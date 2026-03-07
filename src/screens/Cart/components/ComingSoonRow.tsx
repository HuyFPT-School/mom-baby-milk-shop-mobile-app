import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography, Shadow } from '../../../constants/theme';
import { formatPrice } from '../../../utils/formatters';
import type { CartItem } from '../../../types';

interface Props {
    item: CartItem;
    onRemove: (id: string) => void;
}

export default function ComingSoonRow({ item, onRemove }: Props) {
    const effectivePrice = item.sale_price ?? item.price;
    const imageUri = item.image_url || item.image || '';

    return (
        <View style={[styles.itemCard, styles.itemCardPurple]}>
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

                    {item.releaseDate && (
                        <View style={styles.releaseDateRow}>
                            <Ionicons name="calendar-outline" size={14} color="#6D28D9" />
                            <Text style={styles.releaseDateText}>
                                Ra mắt:{' '}
                                <Text style={{ fontWeight: Typography.weight.bold }}>
                                    {new Date(item.releaseDate).toLocaleDateString('vi-VN')}
                                </Text>
                            </Text>
                        </View>
                    )}

                    <View style={styles.badgeRow}>
                        <View style={[styles.statusBadge, styles.badgePurple]}>
                            <Ionicons name="gift-outline" size={12} color="#6D28D9" />
                            <Text style={styles.badgePurpleText}>Đã đăng ký - Chưa thanh toán</Text>
                        </View>
                    </View>

                    <Text style={styles.qtyLabel}>
                        Số lượng đăng ký: <Text style={styles.qtyBold}>{item.quantity}</Text>
                    </Text>
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
    itemCardPurple: { borderColor: '#DDD6FE', borderWidth: 2 },
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
    releaseDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: Spacing.sm,
    },
    releaseDateText: {
        fontSize: Typography.size.sm,
        color: '#6D28D9',
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
    badgePurple: { backgroundColor: '#F5F3FF' },
    badgePurpleText: { fontSize: 11, fontWeight: Typography.weight.semiBold, color: '#6D28D9' },
    qtyLabel: { fontSize: Typography.size.sm, color: Colors.textSecondary },
    qtyBold: { fontWeight: Typography.weight.bold, color: Colors.text },
});
