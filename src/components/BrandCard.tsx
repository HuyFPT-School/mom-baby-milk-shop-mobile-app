import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Radius, Typography, Shadow } from '../constants/theme';
import type { Brand } from '../types';

interface BrandCardProps {
    brand: Brand;
    onPress?: (brand: Brand) => void;
}

const BrandCard = React.memo(({ brand, onPress }: BrandCardProps) => (
    <TouchableOpacity
        style={styles.card}
        onPress={() => onPress?.(brand)}
        activeOpacity={0.8}
        accessibilityLabel={`Thương hiệu ${brand.name}`}
    >
        {brand.logoUrl ? (
            <Image
                source={{ uri: brand.logoUrl }}
                style={styles.logo}
                resizeMode="contain"
            />
        ) : (
            <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>
                    {brand.name.charAt(0).toUpperCase()}
                </Text>
            </View>
        )}
        <Text style={styles.name} numberOfLines={1}>
            {brand.name}
        </Text>
    </TouchableOpacity>
));

BrandCard.displayName = 'BrandCard';
export default BrandCard;

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    card: {
        width: 100,
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        marginRight: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadow.sm,
    },
    logo: {
        width: 60,
        height: 40,
    },
    placeholder: {
        width: 60,
        height: 40,
        backgroundColor: Colors.surfaceVariant,
        borderRadius: Radius.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: {
        fontSize: Typography.size.xl,
        fontWeight: Typography.weight.bold,
        color: Colors.primary,
    },
    name: {
        fontSize: Typography.size.xs,
        fontWeight: Typography.weight.medium,
        color: Colors.text,
        marginTop: Spacing.sm,
        textAlign: 'center',
    },
});
