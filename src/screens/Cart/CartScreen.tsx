import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  Colors,
  Spacing,
  Radius,
  Typography,
  Shadow,
} from "../../constants/theme";
import { formatPrice } from "../../utils/formatters";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { checkoutApi } from "../../services/api";
import { toast } from "../../components/Toast";
import RegularItemRow from "./components/RegularItemRow";
import OutOfStockRow from "./components/OutOfStockRow";
import ComingSoonRow from "./components/ComingSoonRow";
import ConfirmDeleteModal from "./components/ConfirmDeleteModal";
import type { CartItem } from "../../types";

// ─── Main CartScreen ─────────────────────────────────────────────────────────

export default function CartScreen({ navigation }: { navigation?: any }) {
  const { user } = useAuth();
  const {
    items,
    totalPrice,
    totalPayNow,
    regularItems,
    preOrderItems,
    removeFromCart,
    updateQuantity,
    updatePaymentOption,
    clearCart,
  } = useCart();

  const outOfStockItems = preOrderItems.filter(
    (i) => i.preOrderType === "OUT_OF_STOCK",
  );
  const comingSoonItems = preOrderItems.filter(
    (i) => i.preOrderType === "COMING_SOON",
  );

  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    name: string;
    imageUri: string;
  } | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleCheckout = useCallback(async () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để thanh toán");
      return;
    }
    if (regularItems.length === 0) {
      toast.error("Không có sản phẩm thường để thanh toán");
      return;
    }
    Alert.alert(
      "Xác nhận đặt hàng",
      `Thanh toán ${formatPrice(totalPayNow)} bằng tiền mặt khi nhận hàng (COD)?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đặt hàng",
          onPress: async () => {
            setCheckoutLoading(true);
            try {
              const payload = {
                items: regularItems.map((item) => ({
                  productId: item.id,
                  productName: item.name,
                  quantity: item.quantity,
                  price: item.sale_price ?? item.price,
                  imageUrl: item.image_url ?? item.image ?? "",
                })),
                paymentMethod: "cod",
                shippingAddress: {
                  fullName: user.name || "",
                  phoneNumber: user.phone || "",
                  address: user.address || "",
                  city: "",
                  district: "",
                  ward: "",
                },
                note: "",
              };
              console.log(
                "[Checkout] payload:",
                JSON.stringify(payload, null, 2),
              );
              const res = await checkoutApi.createOrder(payload);
              console.log(
                "[Checkout] success:",
                JSON.stringify(res.data, null, 2),
              );
              clearCart();
              toast.success(
                "Đặt hàng thành công!",
                "Đơn hàng COD đang được xử lý",
              );
              navigation?.navigate?.("Account", { screen: "OrderTracking" });
            } catch (err: any) {
              const status = err?.response?.status;
              console.error(
                "[Checkout] error:",
                status,
                JSON.stringify(err?.response?.data),
              );
              if (status === 403 || status === 401) {
                Alert.alert(
                  "Phiên đăng nhập hết hạn",
                  "Vui lòng đăng xuất và đăng nhập lại, sau đó thử thanh toán lại.",
                );
              } else {
                const msg =
                  err?.response?.data?.message ||
                  err?.response?.data?.error ||
                  err?.message ||
                  "Đặt hàng thất bại, vui lòng thử lại";
                Alert.alert("Lỗi đặt hàng", msg);
              }
            } finally {
              setCheckoutLoading(false);
            }
          },
        },
      ],
    );
  }, [user, regularItems, totalPayNow, clearCart, navigation]);

  const handleRemove = useCallback(
    (id: string) => {
      const found = items.find((i) => i.id === id);
      setPendingDelete({
        id,
        name: found?.name ?? "",
        imageUri: found?.image_url || found?.image || "",
      });
    },
    [items],
  );

  const confirmDelete = useCallback(() => {
    if (!pendingDelete) return;
    removeFromCart(pendingDelete.id);
    toast.success("Đã xóa khỏi giỏ hàng", pendingDelete.name);
    setPendingDelete(null);
  }, [pendingDelete, removeFromCart]);

  // ── Empty state ──
  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={80} color={Colors.border} />
        <Text style={styles.emptyTitle}>Giỏ hàng trống</Text>
        <Text style={styles.emptyDesc}>
          Chưa có sản phẩm nào trong giỏ hàng của bạn
        </Text>
        <TouchableOpacity
          style={styles.emptyBtn}
          onPress={() => navigation?.navigate?.("Home")}
          activeOpacity={0.85}
        >
          <Text style={styles.emptyBtnText}>Khám phá sản phẩm</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Title */}
        <Text style={styles.pageTitle}>Giỏ Hàng Của Bạn</Text>
        <Text style={styles.pageSubtitle}>
          Quản lý các sản phẩm và đơn đặt trước
        </Text>

        {/* ── Regular Items ── */}
        {regularItems.length > 0 && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="cart-outline" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>
                Sản Phẩm Thường ({regularItems.length})
              </Text>
            </View>
            {regularItems.map((item, idx) => (
              <RegularItemRow
                key={item.id ?? `regular-${idx}`}
                item={item}
                onRemove={handleRemove}
                onUpdateQty={updateQuantity}
              />
            ))}
          </View>
        )}

        {/* ── Out-of-stock Pre-orders ── */}
        {outOfStockItems.length > 0 && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="cube-outline" size={20} color="#F97316" />
              <Text style={styles.sectionTitle}>
                Đặt Trước - Hết Hàng ({outOfStockItems.length})
              </Text>
            </View>
            {outOfStockItems.map((item, idx) => (
              <OutOfStockRow
                key={item.id ?? `oos-${idx}`}
                item={item}
                onRemove={handleRemove}
                onSwitchPayment={(id) => updatePaymentOption(id, "PAY_NOW")}
              />
            ))}
          </View>
        )}

        {/* ── Coming-soon Pre-orders ── */}
        {comingSoonItems.length > 0 && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="calendar-outline" size={20} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>
                Đặt Trước - Sắp Ra Mắt ({comingSoonItems.length})
              </Text>
            </View>
            {comingSoonItems.map((item, idx) => (
              <ComingSoonRow
                key={item.id ?? `cs-${idx}`}
                item={item}
                onRemove={handleRemove}
              />
            ))}
          </View>
        )}

        {/* ── Order Summary ── */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Tổng kết</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tổng sản phẩm</Text>
            <Text style={styles.summaryValue}>{items.length}</Text>
          </View>
          {regularItems.length > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Sản phẩm thường</Text>
              <Text style={styles.summaryValue}>{regularItems.length}</Text>
            </View>
          )}
          {outOfStockItems.length > 0 && (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Hết hàng (thanh toán ngay)
                </Text>
                <Text style={styles.summaryValue}>
                  {
                    outOfStockItems.filter((i) => i.paymentOption === "PAY_NOW")
                      .length
                  }
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Hết hàng (thanh toán sau)
                </Text>
                <Text style={styles.summaryValue}>
                  {
                    outOfStockItems.filter(
                      (i) => i.paymentOption === "PAY_LATER",
                    ).length
                  }
                </Text>
              </View>
            </>
          )}
          {comingSoonItems.length > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Sắp ra mắt (đã đăng ký)</Text>
              <Text style={styles.summaryValue}>{comingSoonItems.length}</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tổng tạm tính</Text>
            <Text style={styles.summaryPriceSmall}>
              {formatPrice(totalPrice)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabelBold}>Cần thanh toán ngay</Text>
            <Text style={styles.summaryPriceBig}>
              {formatPrice(totalPayNow)}
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Bottom Checkout Bar ── */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarInner}>
          <View>
            <Text style={styles.bottomLabel}>Thanh toán</Text>
            <Text style={styles.bottomPrice}>{formatPrice(totalPayNow)}</Text>
          </View>
          <TouchableOpacity
            style={styles.checkoutBtn}
            activeOpacity={0.85}
            onPress={handleCheckout}
            disabled={checkoutLoading}
          >
            <LinearGradient
              colors={[Colors.primary, "#9333EA"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.checkoutGradient}
            >
              {checkoutLoading ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <>
                  <Text style={styles.checkoutText}>Thanh toán</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color={Colors.white}
                  />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Confirm Delete Modal ── */}
      <ConfirmDeleteModal
        visible={!!pendingDelete}
        itemName={pendingDelete?.name ?? ""}
        imageUri={pendingDelete?.imageUri ?? ""}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: Spacing.base, paddingTop: Spacing.lg },

  // Page titles
  pageTitle: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },

  // Section
  sectionBlock: { marginBottom: Spacing.lg },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
  },

  // Summary
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  summaryTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  summaryLabel: { fontSize: Typography.size.sm, color: Colors.textSecondary },
  summaryLabelBold: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
  },
  summaryValue: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semiBold,
    color: Colors.text,
  },
  summaryPriceSmall: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
  },
  summaryPriceBig: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },

  // Info box
  infoBox: {
    backgroundColor: "#EFF6FF",
    borderRadius: Radius.md,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  infoBoxTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  infoBoxItem: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 2,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xxl,
    backgroundColor: Colors.background,
  },
  emptyTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyDesc: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md + 2,
    borderRadius: Radius.md,
  },
  emptyBtnText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semiBold,
    color: Colors.white,
  },

  // Bottom bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.lg,
    ...Shadow.md,
  },
  bottomBarInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bottomLabel: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  bottomPrice: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
  },
  checkoutBtn: { borderRadius: Radius.md, overflow: "hidden" },
  checkoutGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md + 2,
  },
  checkoutText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.white,
  },
});
