import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography, Shadow } from '../../../constants/theme';
import { formatPrice } from '../../../utils/formatters';
import type { CartItem } from '../../../types';

interface Props {
    item: CartItem;
    onRemove: (id: string) => void;
    onUpdateQty: (id: string, qty: number) => void;
}

export default function RegularItemRow({ item, onRemove, onUpdateQty }: Props) {
    const effectivePrice = item.sale_price ?? item.price;
    const imageUri = item.image_url || item.image || '';

    return (
        <View style={styles.itemCard}>
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

                    <View style={styles.qtySubRow}>
                        <View style={styles.qtyControls}>
                            <TouchableOpacity
                                style={styles.qtyBtn}
                                onPress={() => onUpdateQty(item.id, item.quantity - 1)}
                            >
                                <Ionicons name="remove" size={16} color={Colors.text} />
                            </TouchableOpacity>
                            <Text style={styles.qtyText}>{item.quantity}</Text>
                            <TouchableOpacity
                                style={styles.qtyBtn}
                                onPress={() => onUpdateQty(item.id, item.quantity + 1)}
                            >
                                <Ionicons name="add" size={16} color={Colors.text} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.subtotal}>
                            {formatPrice(effectivePrice * item.quantity)}
                        </Text>
                    </View>
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
    qtySubRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    qtyControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    qtyBtn: {
        width: 30,
        height: 30,
        borderRadius: Radius.sm,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.surface,
    },
    qtyText: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.semiBold,
        minWidth: 28,
        textAlign: 'center',
        color: Colors.text,
    },
    subtotal: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.bold,
        color: Colors.text,
    },
});
