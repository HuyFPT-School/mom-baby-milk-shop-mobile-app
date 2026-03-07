import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography } from '../constants/theme';
import { formatPrice, getProductImage } from '../utils/formatters';
import type { Product } from '../types';

interface PreOrderModalProps {
    visible: boolean;
    product: Product | null;
    onClose: () => void;
    onConfirm: (data: {
        product: Product;
        quantity: number;
        preOrderType: 'OUT_OF_STOCK' | 'COMING_SOON';
        paymentOption: 'PAY_NOW';
    }) => void;
}

const PreOrderModal = React.memo(
    ({ visible, product, onClose, onConfirm }: PreOrderModalProps) => {
        const [quantity, setQuantity] = useState(1);

        const handleClose = useCallback(() => {
            setQuantity(1);
            onClose();
        }, [onClose]);

        if (!product) return null;

        const isOutOfStock =
            product.quantity === 0 && !product.expectedRestockDate;
        const effectivePrice = product.sale_price ?? product.price;
        const imageUri = getProductImage(product);

        const handleConfirm = () => {
            onConfirm({
                product,
                quantity,
                preOrderType: isOutOfStock ? 'OUT_OF_STOCK' : 'COMING_SOON',
                paymentOption: 'PAY_NOW',
            });
            setQuantity(1);
        };

        return (
            <Modal
                visible={visible}
                transparent
                animationType="slide"
                onRequestClose={handleClose}
            >
                <View style={styles.overlay}>
                    <View style={styles.container}>
                        <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
                            {/* ── Header ── */}
                            <View style={styles.header}>
                                <View style={styles.headerContent}>
                                    <View style={styles.headerTitleRow}>
                                        <Ionicons
                                            name={isOutOfStock ? 'cube-outline' : 'calendar-outline'}
                                            size={22}
                                            color={Colors.white}
                                        />
                                        <Text style={styles.headerTitle}>
                                            {isOutOfStock
                                                ? 'Đặt Trước - Hết Hàng'
                                                : 'Đặt Trước - Sắp Ra Mắt'}
                                        </Text>
                                    </View>
                                    <Text style={styles.headerSubtitle}>
                                        {isOutOfStock
                                            ? 'Sản phẩm tạm hết hàng. Đặt trước để giữ chỗ khi hàng về!'
                                            : 'Sản phẩm chưa phát hành. Đăng ký đặt trước ngay hôm nay!'}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.closeBtn}
                                    onPress={handleClose}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <Ionicons name="close" size={22} color={Colors.white} />
                                </TouchableOpacity>
                            </View>

                            {/* ── Product Info ── */}
                            <View style={styles.productSection}>
                                <View style={styles.productRow}>
                                    <Image
                                        source={{ uri: imageUri }}
                                        style={styles.productImage}
                                        resizeMode="cover"
                                    />
                                    <View style={styles.productInfo}>
                                        <Text style={styles.productName} numberOfLines={2}>
                                            {product.name}
                                        </Text>
                                        <Text style={styles.productPrice}>
                                            {formatPrice(effectivePrice)}
                                        </Text>
                                        {product.expectedRestockDate && (
                                            <View style={styles.dateRow}>
                                                <Ionicons
                                                    name="calendar-outline"
                                                    size={14}
                                                    color={Colors.textSecondary}
                                                />
                                                <Text style={styles.dateText}>
                                                    Ngày phát hành:{' '}
                                                    {new Date(
                                                        product.expectedRestockDate,
                                                    ).toLocaleDateString('vi-VN')}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                {/* Quantity Selector */}
                                <View style={styles.qtyBox}>
                                    <Text style={styles.qtyLabel}>Số lượng đặt trước</Text>
                                    <View style={styles.qtyRow}>
                                        <TouchableOpacity
                                            style={styles.qtyBtn}
                                            onPress={() => setQuantity(Math.max(1, quantity - 1))}
                                        >
                                            <Ionicons name="remove" size={18} color={Colors.text} />
                                        </TouchableOpacity>
                                        <Text style={styles.qtyValue}>{quantity}</Text>
                                        <TouchableOpacity
                                            style={styles.qtyBtn}
                                            onPress={() => setQuantity(quantity + 1)}
                                        >
                                            <Ionicons name="add" size={18} color={Colors.text} />
                                        </TouchableOpacity>
                                        <View style={styles.qtyTotal}>
                                            <Text style={styles.qtyTotalLabel}>Tổng cộng</Text>
                                            <Text style={styles.qtyTotalPrice}>
                                                {formatPrice(effectivePrice * quantity)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {/* ── Info Section ── */}
                            <View style={styles.infoSection}>
                                <Text style={styles.infoTitle}>
                                    {isOutOfStock
                                        ? 'Hình thức thanh toán'
                                        : 'Thông tin quan trọng'}
                                </Text>
                                {isOutOfStock ? (
                                    <View style={styles.payNowBox}>
                                        <View style={styles.payNowRow}>
                                            <Ionicons
                                                name="card-outline"
                                                size={20}
                                                color={Colors.primary}
                                            />
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.payNowTitle}>Thanh toán ngay</Text>
                                                <Text style={styles.payNowDesc}>
                                                    Thanh toán ngay để đảm bảo đơn hàng. Sản phẩm sẽ được
                                                    giao ngay khi hàng về kho.
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={styles.priorityBox}>
                                            <Ionicons
                                                name="checkmark-circle"
                                                size={18}
                                                color="#10B981"
                                            />
                                            <Text style={styles.priorityText}>
                                                Ưu tiên giao hàng đầu tiên khi hàng về kho
                                            </Text>
                                        </View>
                                    </View>
                                ) : (
                                    <View style={styles.comingSoonBox}>
                                        <View style={styles.comingSoonRow}>
                                            <Ionicons
                                                name="information-circle-outline"
                                                size={20}
                                                color="#8B5CF6"
                                            />
                                            <View style={{ flex: 1, gap: 8 }}>
                                                <Text style={styles.comingSoonDesc}>
                                                    <Text style={styles.comingSoonBold}>
                                                        Sản phẩm chưa phát hành:
                                                    </Text>{' '}
                                                    Bạn chỉ có thể đăng ký đặt trước để được ưu tiên khi
                                                    sản phẩm ra mắt.
                                                </Text>
                                                <Text style={styles.comingSoonDesc}>
                                                    <Text style={styles.comingSoonBold}>
                                                        Không thanh toán trước:
                                                    </Text>{' '}
                                                    Chúng tôi sẽ thông báo khi sản phẩm chính thức mở bán.
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={styles.tipBox}>
                                            <Text style={styles.tipText}>
                                                💡 Đăng ký ngay để không bỏ lỡ cơ hội sở hữu sản phẩm!
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                        </ScrollView>

                        {/* ── Action Buttons ── */}
                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={handleClose}
                            >
                                <Text style={styles.cancelText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.confirmBtn}
                                onPress={handleConfirm}
                            >
                                <Text style={styles.confirmText}>
                                    {isOutOfStock ? 'Xác Nhận Đặt Trước' : 'Đăng Ký Ngay'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    },
);

PreOrderModal.displayName = 'PreOrderModal';
export default PreOrderModal;

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
    },

    // Header
    header: {
        flexDirection: 'row',
        padding: Spacing.lg,
        paddingBottom: Spacing.base,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        backgroundColor: Colors.primary,
    },
    headerContent: { flex: 1 },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: 6,
    },
    headerTitle: {
        fontSize: Typography.size.lg,
        fontWeight: Typography.weight.bold,
        color: Colors.white,
    },
    headerSubtitle: {
        fontSize: Typography.size.sm,
        color: 'rgba(255,255,255,0.8)',
        lineHeight: 18,
    },
    closeBtn: {
        padding: 4,
        marginLeft: Spacing.sm,
    },

    // Product
    productSection: {
        padding: Spacing.base,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    productRow: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    productImage: {
        width: 80,
        height: 80,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    productInfo: { flex: 1, justifyContent: 'center' },
    productName: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.semiBold,
        color: Colors.text,
        marginBottom: 4,
    },
    productPrice: {
        fontSize: Typography.size.xl,
        fontWeight: Typography.weight.bold,
        color: Colors.primary,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 6,
    },
    dateText: {
        fontSize: Typography.size.sm,
        color: Colors.textSecondary,
    },

    // Quantity
    qtyBox: {
        marginTop: Spacing.base,
        backgroundColor: Colors.surfaceVariant,
        borderRadius: Radius.md,
        padding: Spacing.md,
    },
    qtyLabel: {
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.medium,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
    },
    qtyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    qtyBtn: {
        width: 38,
        height: 38,
        borderRadius: Radius.sm,
        borderWidth: 2,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.surface,
    },
    qtyValue: {
        fontSize: Typography.size.lg,
        fontWeight: Typography.weight.bold,
        color: Colors.text,
        minWidth: 30,
        textAlign: 'center',
    },
    qtyTotal: { flex: 1, alignItems: 'flex-end' },
    qtyTotalLabel: {
        fontSize: Typography.size.sm,
        color: Colors.textSecondary,
    },
    qtyTotalPrice: {
        fontSize: Typography.size.lg,
        fontWeight: Typography.weight.bold,
        color: Colors.primary,
    },

    // Info
    infoSection: { padding: Spacing.base },
    infoTitle: {
        fontSize: Typography.size.md,
        fontWeight: Typography.weight.bold,
        color: Colors.text,
        marginBottom: Spacing.md,
    },
    payNowBox: {
        backgroundColor: Colors.surfaceVariant,
        borderRadius: Radius.lg,
        padding: Spacing.base,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    payNowRow: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing.md,
    },
    payNowTitle: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.bold,
        color: Colors.text,
        marginBottom: 4,
    },
    payNowDesc: {
        fontSize: Typography.size.sm,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
    priorityBox: {
        backgroundColor: '#ECFDF5',
        borderRadius: Radius.sm,
        padding: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    priorityText: {
        fontSize: Typography.size.sm,
        color: '#047857',
        fontWeight: Typography.weight.medium,
        flex: 1,
    },
    comingSoonBox: {
        backgroundColor: '#F5F3FF',
        borderRadius: Radius.lg,
        padding: Spacing.base,
        borderWidth: 1,
        borderColor: '#DDD6FE',
    },
    comingSoonRow: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing.md,
    },
    comingSoonDesc: {
        fontSize: Typography.size.sm,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
    comingSoonBold: {
        fontWeight: Typography.weight.semiBold,
        color: '#6D28D9',
    },
    tipBox: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.sm,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: '#DDD6FE',
    },
    tipText: {
        fontSize: Typography.size.xs,
        color: '#6D28D9',
        fontWeight: Typography.weight.semiBold,
    },

    // Actions
    actions: {
        flexDirection: 'row',
        gap: Spacing.md,
        padding: Spacing.base,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        backgroundColor: Colors.surfaceVariant,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: Radius.lg,
        borderWidth: 2,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelText: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.semiBold,
        color: Colors.textSecondary,
    },
    confirmBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: Radius.lg,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmText: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.semiBold,
        color: Colors.white,
    },
});
