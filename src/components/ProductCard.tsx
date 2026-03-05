import React, { useCallback } from 'react';
import {
  View, Text, Image, StyleSheet, TouchableOpacity, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography, Shadow, ITEM_HEIGHT } from '../constants/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.base * 3) / 2;

export interface Product {
  _id: string;
  name: string;
  price: number;
  discountPrice?: number;
  images?: string[];
  image?: string;
  brand?: { name: string } | string;
  category?: { name: string } | string;
  stock?: number;
  rating?: number;
  isFeatured?: boolean;
}

interface ProductCardProps {
  item: Product;
  onPress: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

function formatPrice(price: number) {
  return price.toLocaleString('vi-VN') + '₫';
}

const ProductCard = React.memo(({ item, onPress, onAddToCart }: ProductCardProps) => {
  const handlePress = useCallback(() => onPress(item), [item, onPress]);
  const handleAdd = useCallback(() => onAddToCart?.(item), [item, onAddToCart]);

  const imageUri = item.images?.[0] || item.image || 'https://placehold.co/300x300/FFF0F7/E91E8C?text=Sữa';
  const brandName = typeof item.brand === 'object' ? item.brand?.name : item.brand;
  const hasDiscount = item.discountPrice && item.discountPrice < item.price;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.85}
      accessibilityLabel={`Sản phẩm ${item.name}`}
      accessibilityRole="button"
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode="contain"
        />
        {hasDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>
              -{Math.round(((item.price - item.discountPrice!) / item.price) * 100)}%
            </Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        {brandName ? <Text style={styles.brand} numberOfLines={1}>{brandName}</Text> : null}
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.price}>{formatPrice(hasDiscount ? item.discountPrice! : item.price)}</Text>
            {hasDiscount && (
              <Text style={styles.originalPrice}>{formatPrice(item.price)}</Text>
            )}
          </View>
          {onAddToCart && (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={handleAdd}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel={`Thêm ${item.name} vào giỏ`}
            >
              <Ionicons name="add" size={18} color={Colors.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    height: ITEM_HEIGHT,
    ...Shadow.sm,
  },
  imageContainer: {
    width: '100%',
    height: 130,
    backgroundColor: Colors.surfaceVariant,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: Colors.error,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: {
    color: Colors.white,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
  },
  info: {
    padding: Spacing.sm,
    flex: 1,
  },
  brand: {
    fontSize: Typography.size.xs,
    color: Colors.primary,
    fontWeight: Typography.weight.medium,
    marginBottom: 2,
  },
  name: {
    fontSize: Typography.size.sm,
    color: Colors.text,
    fontWeight: Typography.weight.medium,
    flex: 1,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  price: {
    fontSize: Typography.size.sm,
    color: Colors.primary,
    fontWeight: Typography.weight.bold,
  },
  originalPrice: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  addBtn: {
    backgroundColor: Colors.primary,
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export { CARD_WIDTH };
