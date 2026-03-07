import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography, Shadow } from '../../../constants/theme';
import { formatPrice } from '../../../utils/formatters';
import type { CartItem } from '../../../types';

interface Props {
    item: CartItem;
    onRemove: (id: string) => void;
    onSwitchPayment?: (id: string) => void;
}

export default function OutOfStockRow({ item, onRemove, onSwitchPayment }: Props) {
    const effectivePrice = item.sale_price ?? item.price;
    const imageUri = item.image_url || item.image || '';

    return (
        <View style={[styles.itemCard, styles.itemCardOrange]}>
            <View style={styles.itemRow}>
                <Image source={{ uri: imageUri }} style={styles.itemImage} resizeMode="cover" />
                <View style={styles.itemInfo}>
                    <View style={styles.itemHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.itemName} numberOfLines={2}>
                                {item.name}
                            </Text>
                            <Text style={styles.itemPrice}>{formatPrice(effectivePrice)}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => onRemove(item.id)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Ionicons name="trash-outline" size={20} color={Colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.badgeRow}>
                        {item.paymentOption === 'PAY_NOW' ? (
                            <View style={[styles.statusBadge, styles.badgeGreen]}>
                                <Ionicons name="card-outline" size={12} color="#047857" />
                                <Text style={styles.badgeGreenText}>Thanh toán ngay</Text>
                            </View>
                        ) : (
                            <View style={[styles.statusBadge, styles.badgeBlue]}>
                                <Ionicons name="time-outline" size={12} color="#1D4ED8" />
                                <Text style={styles.badgeBlueText}>Thanh toán sau</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.qtySubRow}>
                        <Text style={styles.qtyLabel}>
                            Số lượng: <Text style={styles.qtyBold}>{item.quantity}</Text>
                        </Text>
                        <Text style={styles.subtotal}>
                            {formatPrice(effectivePrice * item.quantity)}
                        </Text>
                    </View>

                    {item.paymentOption === 'PAY_LATER' && onSwitchPayment && (
                        <TouchableOpacity onPress={() => onSwitchPayment(item.id)}>
                            <Text style={styles.switchLink}>Chuyển sang thanh toán ngay →</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    itemCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.md,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadow.sm,
    },
    itemCardOrange: { borderColor: '#FED7AA', borderWidth: 2 },
    itemRow: { flexDirection: 'row', gap: Spacing.md },
    itemImage: {
        width: 80,
        height: 80,
        borderRadius: Radius.md,
        backgroundColor: Colors.surfaceVariant,
    },
    itemInfo: { flex: 1 },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.sm,
    },
    itemName: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.semiBold,
        color: Colors.text,
        marginBottom: 2,
    },
    itemPrice: {
        fontSize: Typography.size.md,
        fontWeight: Typography.weight.bold,
        color: Colors.primary,
    },
    badgeRow: { flexDirection: 'row', marginBottom: Spacing.sm },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: Radius.full,
    },
    badgeGreen: { backgroundColor: '#ECFDF5' },
    badgeGreenText: { fontSize: 11, fontWeight: Typography.weight.semiBold, color: '#047857' },
    badgeBlue: { backgroundColor: '#EFF6FF' },
    badgeBlueText: { fontSize: 11, fontWeight: Typography.weight.semiBold, color: '#1D4ED8' },
    qtySubRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    qtyLabel: { fontSize: Typography.size.sm, color: Colors.textSecondary },
    qtyBold: { fontWeight: Typography.weight.bold, color: Colors.text },
    subtotal: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.bold,
        color: Colors.text,
    },
    switchLink: {
        fontSize: Typography.size.xs,
        color: Colors.primary,
        fontWeight: Typography.weight.medium,
        marginTop: Spacing.xs,
    },
});
