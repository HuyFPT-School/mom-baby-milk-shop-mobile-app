import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	ActivityIndicator,
	Image,
	KeyboardAvoidingView,
	Linking,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../constants/theme';
import { checkoutApi, voucherApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { toast } from '../../components/Toast';
import { formatPrice } from '../../utils/formatters';
import type { CartItem } from '../../types';

type PaymentMethod = 'cod' | 'vnpay' | 'momo';

interface AppliedVoucher {
	voucherId?: string;
	code: string;
	discountPercentage: number;
	discountAmount: number;
}

const SHIPPING_FEE = 30000;
const FREE_SHIPPING_THRESHOLD = 500000;
const MIN_PAYABLE = 10000;

const PAYMENT_OPTIONS: Array<{
	value: PaymentMethod;
	title: string;
	subtitle: string;
	icon: keyof typeof Ionicons.glyphMap;
}> = [
	{
		value: 'cod',
		title: 'Thanh toán khi nhận hàng (COD)',
		subtitle: 'Thanh toán bằng tiền mặt khi nhận hàng',
		icon: 'cash-outline',
	},
	{
		value: 'vnpay',
		title: 'VNPay',
		subtitle: 'Thanh toán qua cổng VNPay',
		icon: 'card-outline',
	},
	{
		value: 'momo',
		title: 'Ví MoMo',
		subtitle: 'Thanh toán qua ví điện tử MoMo',
		icon: 'phone-portrait-outline',
	},
];

function getEffectivePrice(item: CartItem): number {
	return item.sale_price ?? item.price;
}

function toNumber(value: unknown): number {
	const n = Number(value);
	return Number.isFinite(n) ? n : 0;
}

function normalizeVoucherResponse(payload: any): AppliedVoucher | null {
	const data = payload?.data ?? payload;
	if (!data) return null;

	const code = String(data.code ?? data.voucherCode ?? '').trim().toUpperCase();
	const voucherId =
		data.voucherId ?? data._id ?? data.id ?? data.voucher?._id ?? data.voucher?.id;
	const discountPercentage = toNumber(
		data.discountPercentage ?? data.percent ?? data.discountPercent,
	);
	const discountAmount = Math.max(
		0,
		toNumber(data.discountAmount ?? data.discount ?? data.amount),
	);

	if (!code && !voucherId) return null;

	return {
		voucherId: voucherId ? String(voucherId) : undefined,
		code: code || String(voucherId),
		discountPercentage,
		discountAmount,
	};
}

function getApiMessage(error: any): string {
	return (
		error?.response?.data?.message ||
		error?.message ||
		'Đã có lỗi xảy ra. Vui lòng thử lại.'
	);
}

export default function CheckoutScreen({ navigation }: { navigation?: any }) {
	const { user } = useAuth();
	const { items, clearCart } = useCart();

	const [fullName, setFullName] = useState('');
	const [phone, setPhone] = useState('');
	const [email, setEmail] = useState('');
	const [address, setAddress] = useState('');
	const [note, setNote] = useState('');

	const [voucherCode, setVoucherCode] = useState('');
	const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher | null>(null);

	const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
	const [applyingVoucher, setApplyingVoucher] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		setFullName((current) => current || user?.name || '');
		setPhone((current) => current || user?.phone || '');
		setEmail((current) => current || user?.email || '');
		setAddress((current) => current || user?.address || '');
	}, [user]);

	const payableItems = useMemo(
		() =>
			items.filter(
				(item) => !item.isPreOrder || item.paymentOption === 'PAY_NOW',
			),
		[items],
	);

	const deferredItems = useMemo(
		() =>
			items.filter(
				(item) => item.isPreOrder && item.paymentOption === 'PAY_LATER',
			),
		[items],
	);

	const allPayableArePreOrder = useMemo(
		() => payableItems.length > 0 && payableItems.every((item) => item.isPreOrder),
		[payableItems],
	);

	const subtotal = useMemo(
		() =>
			payableItems.reduce(
				(sum, item) => sum + getEffectivePrice(item) * item.quantity,
				0,
			),
		[payableItems],
	);

	const shippingFee = subtotal > FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FEE;
	const orderBaseTotal = subtotal + shippingFee;
	const discount = Math.min(appliedVoucher?.discountAmount ?? 0, orderBaseTotal);
	const totalAfterDiscount = Math.max(MIN_PAYABLE, orderBaseTotal - discount);
	const minAmountApplied = payableItems.length > 0 && orderBaseTotal - discount < MIN_PAYABLE;
	const totalQuantity = payableItems.reduce((sum, item) => sum + item.quantity, 0);

	const resetVoucherIfCodeChanged = useCallback(
		(nextCode: string) => {
			setVoucherCode(nextCode);
			if (
				appliedVoucher &&
				nextCode.trim().toUpperCase() !== appliedVoucher.code.trim().toUpperCase()
			) {
				setAppliedVoucher(null);
			}
		},
		[appliedVoucher],
	);

	const handleApplyVoucher = useCallback(async () => {
		const code = voucherCode.trim().toUpperCase();
		if (!code) {
			toast.error('Thiếu mã voucher', 'Vui lòng nhập mã voucher');
			return;
		}

		if (orderBaseTotal <= 0) {
			toast.error('Không thể áp dụng', 'Không có sản phẩm cần thanh toán');
			return;
		}

		setApplyingVoucher(true);
		try {
			const res = await voucherApi.validate(code, orderBaseTotal);
			const normalized = normalizeVoucherResponse(res?.data);
			if (!normalized) {
				throw new Error('Không thể đọc thông tin voucher');
			}

			const safeDiscount = Math.min(normalized.discountAmount, orderBaseTotal);
			const nextVoucher: AppliedVoucher = {
				...normalized,
				code,
				discountAmount: safeDiscount,
			};

			setAppliedVoucher(nextVoucher);
			setVoucherCode(code);

			toast.success(
				'Áp dụng voucher thành công',
				`Giảm ${formatPrice(safeDiscount)}${
					normalized.discountPercentage > 0
						? ` (${normalized.discountPercentage.toFixed(0)}%)`
						: ''
				}`,
			);
		} catch (error: any) {
			setAppliedVoucher(null);
			toast.error('Không thể áp dụng voucher', getApiMessage(error));
		} finally {
			setApplyingVoucher(false);
		}
	}, [orderBaseTotal, voucherCode]);

	const isEmailValid = useCallback((value: string) => {
		if (!value.trim()) return true;
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
	}, []);

	const validateBeforeSubmit = useCallback((): string | null => {
		if (payableItems.length === 0) {
			return 'Không có sản phẩm nào cần thanh toán ngay.';
		}
		if (!fullName.trim()) {
			return 'Vui lòng nhập họ và tên.';
		}
		if (!phone.trim()) {
			return 'Vui lòng nhập số điện thoại.';
		}
		if (phone.trim().length < 9) {
			return 'Số điện thoại chưa hợp lệ.';
		}
		if (!isEmailValid(email)) {
			return 'Email chưa hợp lệ.';
		}
		if (!address.trim()) {
			return 'Vui lòng nhập địa chỉ giao hàng.';
		}
		if (allPayableArePreOrder && paymentMethod === 'cod') {
			return 'Đơn chỉ gồm pre-order cần thanh toán online (VNPay hoặc MoMo).';
		}

		return null;
	}, [
		address,
		allPayableArePreOrder,
		email,
		fullName,
		isEmailValid,
		payableItems.length,
		paymentMethod,
		phone,
	]);

	const handlePlaceOrder = useCallback(async () => {
		const validationMessage = validateBeforeSubmit();
		if (validationMessage) {
			toast.error('Không thể đặt hàng', validationMessage);
			return;
		}

		setSubmitting(true);
		try {
			const payload: Record<string, unknown> = {
				cartItems: payableItems.map((item) => ({
					productId: item.id,
					quantity: item.quantity,
				})),
				paymentMethod,
				shippingAddress: address.trim(),
				phone: phone.trim(),
				note: note.trim(),
			};

			if (appliedVoucher?.voucherId) {
				payload.voucherUsed = appliedVoucher.voucherId;
			}

			const response = await checkoutApi.createOrder(payload);
			const body = response?.data?.data ?? response?.data;
			const payUrl = body?.payUrl;
			const message = body?.message ?? 'Đơn hàng đã được tạo thành công';

			if (payUrl) {
				toast.success('Đơn hàng đã tạo', 'Đang mở cổng thanh toán');
				try {
					await Linking.openURL(String(payUrl));
				} catch {
					toast.info(
						'Không thể mở cổng thanh toán',
						'Bạn có thể thanh toán lại trong mục đơn hàng của tôi',
					);
				}

				navigation?.getParent?.()?.navigate?.('Account', {
					screen: 'OrderTracking',
				});
				return;
			}

			clearCart();
			toast.success('Đặt hàng thành công', message);

			navigation?.getParent?.()?.navigate?.('Account', {
				screen: 'OrderTracking',
			});
			navigation?.goBack?.();
		} catch (error: any) {
			toast.error('Đặt hàng thất bại', getApiMessage(error));
		} finally {
			setSubmitting(false);
		}
	}, [
		address,
		appliedVoucher?.voucherId,
		clearCart,
		navigation,
		note,
		payableItems,
		paymentMethod,
		phone,
		validateBeforeSubmit,
	]);

	if (payableItems.length === 0) {
		return (
			<View style={styles.emptyWrap}>
				<Ionicons name="wallet-outline" size={72} color={Colors.textMuted} />
				<Text style={styles.emptyTitle}>Không có sản phẩm cần thanh toán</Text>
				<Text style={styles.emptyText}>
					Giỏ hàng hiện chỉ có sản phẩm thanh toán sau. Vui lòng quay lại giỏ hàng để điều chỉnh.
				</Text>
				<TouchableOpacity
					style={styles.backBtn}
					activeOpacity={0.85}
					onPress={() => navigation?.goBack?.()}
				>
					<Text style={styles.backBtnText}>Quay lại giỏ hàng</Text>
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<KeyboardAvoidingView
			style={styles.screen}
			behavior={Platform.OS === 'ios' ? 'padding' : undefined}
		>
			<ScrollView
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
				contentContainerStyle={styles.content}
			>
				<Text style={styles.pageTitle}>Thanh toán</Text>
				<Text style={styles.pageSubtitle}>
					Điền thông tin giao hàng, chọn phương thức thanh toán và hoàn tất đơn hàng.
				</Text>

				{deferredItems.length > 0 && (
					<View style={styles.noticeCard}>
						<Ionicons name="information-circle-outline" size={18} color="#1D4ED8" />
						<Text style={styles.noticeText}>
							{deferredItems.length} sản phẩm thanh toán sau không được tính vào đơn này.
						</Text>
					</View>
				)}

				<View style={styles.card}>
					<Text style={styles.cardTitle}>Thông tin giao hàng</Text>

					<Text style={styles.label}>Họ và tên *</Text>
					<TextInput
						style={styles.input}
						value={fullName}
						onChangeText={setFullName}
						placeholder="Nhập họ và tên"
						placeholderTextColor={Colors.textMuted}
					/>

					<Text style={styles.label}>Số điện thoại *</Text>
					<TextInput
						style={styles.input}
						value={phone}
						onChangeText={setPhone}
						keyboardType="phone-pad"
						placeholder="Nhập số điện thoại"
						placeholderTextColor={Colors.textMuted}
					/>

					<Text style={styles.label}>Email</Text>
					<TextInput
						style={styles.input}
						value={email}
						onChangeText={setEmail}
						keyboardType="email-address"
						autoCapitalize="none"
						placeholder="example@email.com"
						placeholderTextColor={Colors.textMuted}
					/>

					<Text style={styles.label}>Địa chỉ giao hàng *</Text>
					<TextInput
						style={[styles.input, styles.inputMultiline]}
						value={address}
						onChangeText={setAddress}
						multiline
						placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
						placeholderTextColor={Colors.textMuted}
					/>

					<Text style={styles.label}>Ghi chú đơn hàng (tùy chọn)</Text>
					<TextInput
						style={[styles.input, styles.inputMultiline]}
						value={note}
						onChangeText={setNote}
						multiline
						placeholder="Ví dụ: giao giờ hành chính, gọi trước khi giao..."
						placeholderTextColor={Colors.textMuted}
					/>
				</View>

				<View style={styles.card}>
					<Text style={styles.cardTitle}>Phương thức thanh toán</Text>

					{PAYMENT_OPTIONS.map((option) => {
						const selected = paymentMethod === option.value;
						const disabled = option.value === 'cod' && allPayableArePreOrder;

						return (
							<TouchableOpacity
								key={option.value}
								style={[
									styles.paymentRow,
									selected && styles.paymentRowActive,
									disabled && styles.paymentRowDisabled,
								]}
								activeOpacity={0.85}
								disabled={disabled || submitting}
								onPress={() => setPaymentMethod(option.value)}
							>
								<View
									style={[
										styles.radioOuter,
										selected && styles.radioOuterActive,
										disabled && styles.radioOuterDisabled,
									]}
								>
									{selected && <View style={styles.radioInner} />}
								</View>

								<Ionicons
									name={option.icon}
									size={18}
									color={disabled ? Colors.textMuted : Colors.primary}
								/>

								<View style={styles.paymentTextWrap}>
									<Text
										style={[
											styles.paymentTitle,
											disabled && styles.paymentTextDisabled,
										]}
									>
										{option.title}
									</Text>
									<Text
										style={[
											styles.paymentSubtitle,
											disabled && styles.paymentTextDisabled,
										]}
									>
										{option.subtitle}
									</Text>
								</View>
							</TouchableOpacity>
						);
					})}

					{allPayableArePreOrder && (
						<Text style={styles.paymentHint}>
							Đơn chỉ gồm sản phẩm pre-order nên COD không khả dụng.
						</Text>
					)}
				</View>

				<View style={styles.card}>
					<Text style={styles.cardTitle}>Đơn hàng của bạn</Text>

					{payableItems.map((item, index) => {
						const lineTotal = getEffectivePrice(item) * item.quantity;
						return (
							<View key={`${item.id}-${index}`} style={styles.itemRow}>
								<Image
									source={{ uri: item.image_url || item.image || '' }}
									style={styles.itemImage}
								/>
								<View style={styles.itemInfo}>
									<Text style={styles.itemName} numberOfLines={2}>
										{item.name}
									</Text>
									<Text style={styles.itemQty}>x{item.quantity}</Text>
								</View>
								<Text style={styles.itemPrice}>{formatPrice(lineTotal)}</Text>
							</View>
						);
					})}

					<View style={styles.voucherHeaderRow}>
						<Ionicons name="pricetag-outline" size={16} color={Colors.primary} />
						<Text style={styles.voucherTitle}>Mã giảm giá</Text>
					</View>

					<View style={styles.voucherInputRow}>
						<TextInput
							style={styles.voucherInput}
							value={voucherCode}
							onChangeText={resetVoucherIfCodeChanged}
							autoCapitalize="characters"
							placeholder="Nhập mã voucher"
							placeholderTextColor={Colors.textMuted}
							editable={!submitting && !applyingVoucher}
						/>
						<TouchableOpacity
							style={[styles.applyBtn, (applyingVoucher || submitting) && styles.applyBtnDisabled]}
							onPress={handleApplyVoucher}
							disabled={applyingVoucher || submitting}
							activeOpacity={0.85}
						>
							{applyingVoucher ? (
								<ActivityIndicator size="small" color={Colors.white} />
							) : (
								<Text style={styles.applyBtnText}>Áp dụng</Text>
							)}
						</TouchableOpacity>
					</View>

					{!!appliedVoucher && (
						<View style={styles.voucherAppliedRow}>
							<Text style={styles.voucherAppliedText}>
								Voucher {appliedVoucher.code} đã áp dụng, giảm {formatPrice(discount)}
							</Text>
							<TouchableOpacity onPress={() => setAppliedVoucher(null)}>
								<Ionicons name="close-circle" size={18} color={Colors.textMuted} />
							</TouchableOpacity>
						</View>
					)}

					<View style={styles.summaryRow}>
						<Text style={styles.summaryLabel}>Tạm tính ({totalQuantity} sản phẩm)</Text>
						<Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
					</View>
					<View style={styles.summaryRow}>
						<Text style={styles.summaryLabel}>Phí vận chuyển</Text>
						<Text style={[styles.summaryValue, shippingFee === 0 && styles.freeText]}>
							{shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}
						</Text>
					</View>
					{discount > 0 && (
						<View style={styles.summaryRow}>
							<Text style={styles.summaryLabel}>Giảm giá</Text>
							<Text style={[styles.summaryValue, styles.discountText]}>
								-{formatPrice(discount)}
							</Text>
						</View>
					)}

					<View style={styles.divider} />

					<View style={styles.summaryRow}>
						<Text style={styles.totalLabel}>Tổng cộng</Text>
						<Text style={styles.totalValue}>{formatPrice(totalAfterDiscount)}</Text>
					</View>

					{minAmountApplied && (
						<Text style={styles.minimumNote}>
							Hệ thống áp dụng mức thanh toán tối thiểu {formatPrice(MIN_PAYABLE)}.
						</Text>
					)}

					<TouchableOpacity
						style={styles.placeOrderBtn}
						activeOpacity={0.88}
						onPress={handlePlaceOrder}
						disabled={submitting}
					>
						<LinearGradient
							colors={submitting ? [Colors.textMuted, Colors.textMuted] : [Colors.primary, '#9333EA']}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 0 }}
							style={styles.placeOrderGradient}
						>
							{submitting ? (
								<ActivityIndicator size="small" color={Colors.white} />
							) : (
								<>
									<Text style={styles.placeOrderText}>Đặt hàng ngay</Text>
									<Ionicons name="arrow-forward" size={18} color={Colors.white} />
								</>
							)}
						</LinearGradient>
					</TouchableOpacity>

					<Text style={styles.termsText}>
						Bằng việc đặt hàng, bạn đồng ý với điều khoản dịch vụ của chúng tôi.
					</Text>
				</View>

				<View style={{ height: 28 }} />
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		backgroundColor: Colors.background,
	},
	content: {
		padding: Spacing.base,
		paddingBottom: Spacing.xxl,
	},
	pageTitle: {
		fontSize: Typography.size.xxl,
		fontWeight: Typography.weight.bold,
		color: Colors.text,
		marginBottom: 4,
	},
	pageSubtitle: {
		fontSize: Typography.size.base,
		color: Colors.textSecondary,
		lineHeight: 22,
		marginBottom: Spacing.md,
	},
	noticeCard: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: Spacing.sm,
		padding: Spacing.md,
		borderRadius: Radius.md,
		backgroundColor: '#EFF6FF',
		borderWidth: 1,
		borderColor: '#BFDBFE',
		marginBottom: Spacing.md,
	},
	noticeText: {
		flex: 1,
		fontSize: Typography.size.sm,
		color: '#1D4ED8',
		lineHeight: 18,
	},
	card: {
		backgroundColor: Colors.surface,
		borderWidth: 1,
		borderColor: Colors.border,
		borderRadius: Radius.lg,
		padding: Spacing.base,
		marginBottom: Spacing.md,
		...Shadow.sm,
	},
	cardTitle: {
		fontSize: Typography.size.lg,
		fontWeight: Typography.weight.bold,
		color: Colors.text,
		marginBottom: Spacing.md,
	},
	label: {
		fontSize: Typography.size.sm,
		color: Colors.textSecondary,
		marginBottom: Spacing.xs,
		fontWeight: Typography.weight.medium,
	},
	input: {
		minHeight: 48,
		borderRadius: Radius.md,
		borderWidth: 1,
		borderColor: Colors.border,
		backgroundColor: Colors.surface,
		color: Colors.text,
		paddingHorizontal: Spacing.base,
		fontSize: Typography.size.base,
		marginBottom: Spacing.md,
	},
	inputMultiline: {
		minHeight: 90,
		textAlignVertical: 'top',
		paddingTop: Spacing.md,
	},
	paymentRow: {
		borderWidth: 1,
		borderColor: Colors.border,
		borderRadius: Radius.md,
		padding: Spacing.md,
		flexDirection: 'row',
		alignItems: 'center',
		gap: Spacing.sm,
		marginBottom: Spacing.sm,
		backgroundColor: Colors.surface,
	},
	paymentRowActive: {
		borderColor: Colors.primary,
		backgroundColor: '#FFF0F7',
	},
	paymentRowDisabled: {
		opacity: 0.6,
	},
	radioOuter: {
		width: 18,
		height: 18,
		borderRadius: Radius.full,
		borderWidth: 1.5,
		borderColor: Colors.textMuted,
		alignItems: 'center',
		justifyContent: 'center',
	},
	radioOuterActive: {
		borderColor: Colors.primary,
	},
	radioOuterDisabled: {
		borderColor: Colors.border,
	},
	radioInner: {
		width: 8,
		height: 8,
		borderRadius: Radius.full,
		backgroundColor: Colors.primary,
	},
	paymentTextWrap: {
		flex: 1,
	},
	paymentTitle: {
		color: Colors.text,
		fontSize: Typography.size.base,
		fontWeight: Typography.weight.semiBold,
	},
	paymentSubtitle: {
		color: Colors.textSecondary,
		fontSize: Typography.size.sm,
		marginTop: 2,
	},
	paymentTextDisabled: {
		color: Colors.textMuted,
	},
	paymentHint: {
		marginTop: Spacing.sm,
		fontSize: Typography.size.xs,
		color: '#B45309',
	},
	itemRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: Spacing.sm,
		paddingVertical: Spacing.sm,
		borderBottomWidth: 1,
		borderBottomColor: Colors.border,
	},
	itemImage: {
		width: 46,
		height: 46,
		borderRadius: Radius.sm,
		backgroundColor: Colors.surfaceVariant,
	},
	itemInfo: {
		flex: 1,
	},
	itemName: {
		fontSize: Typography.size.sm,
		color: Colors.text,
		fontWeight: Typography.weight.medium,
	},
	itemQty: {
		marginTop: 2,
		fontSize: Typography.size.xs,
		color: Colors.textSecondary,
	},
	itemPrice: {
		fontSize: Typography.size.sm,
		color: Colors.text,
		fontWeight: Typography.weight.semiBold,
	},
	voucherHeaderRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: Spacing.xs,
		marginTop: Spacing.md,
		marginBottom: Spacing.sm,
	},
	voucherTitle: {
		fontSize: Typography.size.sm,
		fontWeight: Typography.weight.semiBold,
		color: Colors.text,
	},
	voucherInputRow: {
		flexDirection: 'row',
		gap: Spacing.sm,
		alignItems: 'center',
	},
	voucherInput: {
		flex: 1,
		minHeight: 42,
		borderRadius: Radius.md,
		borderWidth: 1,
		borderColor: Colors.border,
		paddingHorizontal: Spacing.md,
		color: Colors.text,
		fontSize: Typography.size.sm,
		backgroundColor: Colors.surface,
	},
	applyBtn: {
		minHeight: 42,
		minWidth: 88,
		borderRadius: Radius.md,
		backgroundColor: Colors.primary,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: Spacing.md,
	},
	applyBtnDisabled: {
		backgroundColor: Colors.textMuted,
	},
	applyBtnText: {
		color: Colors.white,
		fontWeight: Typography.weight.semiBold,
		fontSize: Typography.size.sm,
	},
	voucherAppliedRow: {
		marginTop: Spacing.sm,
		padding: Spacing.sm,
		borderRadius: Radius.md,
		borderWidth: 1,
		borderColor: '#BBF7D0',
		backgroundColor: '#ECFDF5',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: Spacing.sm,
	},
	voucherAppliedText: {
		flex: 1,
		color: '#065F46',
		fontSize: Typography.size.xs,
		fontWeight: Typography.weight.medium,
	},
	summaryRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: Spacing.sm,
	},
	summaryLabel: {
		color: Colors.textSecondary,
		fontSize: Typography.size.sm,
	},
	summaryValue: {
		color: Colors.text,
		fontSize: Typography.size.sm,
		fontWeight: Typography.weight.semiBold,
	},
	freeText: {
		color: Colors.success,
	},
	discountText: {
		color: Colors.success,
	},
	divider: {
		height: 1,
		backgroundColor: Colors.border,
		marginTop: Spacing.md,
		marginBottom: Spacing.xs,
	},
	totalLabel: {
		color: Colors.text,
		fontSize: Typography.size.lg,
		fontWeight: Typography.weight.bold,
	},
	totalValue: {
		color: Colors.primary,
		fontSize: Typography.size.xl,
		fontWeight: Typography.weight.bold,
	},
	minimumNote: {
		marginTop: Spacing.xs,
		color: '#92400E',
		fontSize: Typography.size.xs,
	},
	placeOrderBtn: {
		marginTop: Spacing.md,
		borderRadius: Radius.md,
		overflow: 'hidden',
	},
	placeOrderGradient: {
		minHeight: 48,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: Spacing.sm,
	},
	placeOrderText: {
		fontSize: Typography.size.base,
		color: Colors.white,
		fontWeight: Typography.weight.bold,
	},
	termsText: {
		marginTop: Spacing.sm,
		textAlign: 'center',
		color: Colors.textMuted,
		fontSize: Typography.size.xs,
		lineHeight: 17,
	},
	emptyWrap: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: Spacing.xxl,
		backgroundColor: Colors.background,
	},
	emptyTitle: {
		marginTop: Spacing.lg,
		fontSize: Typography.size.xl,
		fontWeight: Typography.weight.bold,
		color: Colors.text,
		textAlign: 'center',
	},
	emptyText: {
		marginTop: Spacing.sm,
		fontSize: Typography.size.base,
		color: Colors.textSecondary,
		textAlign: 'center',
		lineHeight: 22,
		marginBottom: Spacing.xl,
	},
	backBtn: {
		backgroundColor: Colors.primary,
		borderRadius: Radius.md,
		paddingVertical: Spacing.md,
		paddingHorizontal: Spacing.xl,
	},
	backBtnText: {
		color: Colors.white,
		fontSize: Typography.size.base,
		fontWeight: Typography.weight.semiBold,
	},
});
