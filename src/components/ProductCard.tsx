import React, { useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography, Shadow, ITEM_HEIGHT } from '../constants/theme';
import { formatPrice, getProductImage, getDiscountPercent } from '../utils/formatters';
import type { Product } from '../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.base * 3) / 2;

interface ProductCardProps {
  item: Product;
  onPress: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

const ProductCard = React.memo(({ item, onPress, onAddToCart }: ProductCardProps) => {
  const handlePress = useCallback(() => onPress(item), [item, onPress]);
  const handleAdd = useCallback(() => onAddToCart?.(item), [item, onAddToCart]);

  const imageUri = getProductImage(item);
  const brandName =
    typeof item.brand === 'object' ? item.brand?.name : item.brand;
  const discount = getDiscountPercent(item.price, item.sale_price);
  const effectivePrice = item.sale_price ?? item.price;

  const isOutOfStock =
    item.quantity === 0 && !item.expectedRestockDate;
  const isComingSoon =
    !!item.expectedRestockDate &&
    new Date(item.expectedRestockDate) > new Date();
  const isPreOrder =
    (isOutOfStock || isComingSoon) && item.allowPreOrder !== false;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.85}
      accessibilityLabel={`Sản phẩm ${item.name}`}
      accessibilityRole="button"
    >
      {/* ── Image ── */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode="contain"
        />

        {/* Badges */}
        {isOutOfStock && (
          <View style={[styles.badge, styles.badgePreOrder]}>
            <Ionicons name="cube-outline" size={10} color={Colors.white} />
            <Text style={styles.badgeText}>ĐẶT TRƯỚC</Text>
          </View>
        )}
        {isComingSoon && (
          <View style={[styles.badge, styles.badgeComingSoon]}>
            <Ionicons name="calendar-outline" size={10} color={Colors.white} />
            <Text style={styles.badgeText}>SẮP RA MẮT</Text>
          </View>
        )}
        {discount > 0 && !isPreOrder && (
          <View style={[styles.badge, styles.badgeDiscount]}>
            <Text style={styles.badgeText}>-{discount}%</Text>
          </View>
        )}

        {/* Out-of-stock overlay */}
        {item.quantity <= 0 && !isPreOrder && (
          <View style={styles.soldOutOverlay}>
            <Text style={styles.soldOutText}>Hết hàng</Text>
          </View>
        )}
      </View>

      {/* ── Info ── */}
      <View style={styles.info}>
        {brandName ? (
          <Text style={styles.brand} numberOfLines={1}>
            {brandName}
          </Text>
        ) : null}

        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>

        <View style={styles.priceRow}>
          <View>
            <Text style={styles.price}>{formatPrice(effectivePrice)}</Text>
            {discount > 0 && (
              <Text style={styles.originalPrice}>
                {formatPrice(item.price)}
              </Text>
            )}
          </View>

          {onAddToCart && (
            <TouchableOpacity
              style={[
                styles.addBtn,
                isOutOfStock && styles.addBtnPreOrder,
                isComingSoon && styles.addBtnComingSoon,
              ]}
              onPress={handleAdd}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel={
                isPreOrder
                  ? `Đặt trước ${item.name}`
                  : `Thêm ${item.name} vào giỏ`
              }
            >
              <Ionicons
                name={isPreOrder ? 'time-outline' : 'add'}
                size={18}
                color={Colors.white}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

ProductCard.displayName = 'ProductCard';
export default ProductCard;
export { CARD_WIDTH };
export type { ProductCardProps };

// ─── Styles ──────────────────────────────────────────────────────────────────

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

  // Badges
  badge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  badgeDiscount: {
    backgroundColor: Colors.error,
  },
  badgePreOrder: {
    backgroundColor: '#F97316',
  },
  badgeComingSoon: {
    backgroundColor: '#8B5CF6',
  },
  badgeText: {
    color: Colors.white,
    fontSize: Typography.size.xs - 1,
    fontWeight: Typography.weight.bold,
  },

  // Sold-out overlay
  soldOutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldOutText: {
    backgroundColor: Colors.black,
    color: Colors.white,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },

  // Info
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

  // Add-to-cart button
  addBtn: {
    backgroundColor: Colors.primary,
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnPreOrder: {
    backgroundColor: '#F97316',
  },
  addBtnComingSoon: {
    backgroundColor: '#8B5CF6',
  },
});
