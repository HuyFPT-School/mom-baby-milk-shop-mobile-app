import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  Colors,
  Spacing,
  Radius,
  Typography,
  Shadow,
} from "../../constants/theme";
import { orderApi } from "../../services/api";
import { formatPrice } from "../../utils/formatters";
import { toast } from "../../components/Toast";

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  sale_price?: number;
  imageUrl?: string;
  status?: string;
  isPreOrder?: boolean;
}

interface Order {
  _id: string;
  orderNumber?: string;
  userId: string;
  items: OrderItem[];
  totalPrice: number;
  status: "pending" | "processing" | "shipping" | "delivered" | "cancelled";
  paymentStatus: "unpaid" | "paid" | "refunded";
  paymentMethod?: string;
  shippingAddress?:
    | {
        fullName: string;
        phoneNumber: string;
        address: string;
        city: string;
        district: string;
        ward: string;
      }
    | string;
  createdAt: string;
  updatedAt: string;
  deliveryDate?: string;
  cancelReason?: string;
  note?: string;
}

interface OrderTrackingScreenProps {
  navigation?: any;
  route?: any;
}

const ORDER_STATUS_MAP = {
  pending: { label: "Chờ xác nhận", icon: "time-outline", color: "#F59E0B" },
  processing: { label: "Đang xử lý", icon: "layers-outline", color: "#3B82F6" },
  shipping: { label: "Đang giao", icon: "car-outline", color: "#8B5CF6" },
  delivered: {
    label: "Đã giao",
    icon: "checkmark-circle-outline",
    color: "#10B981",
  },
  cancelled: {
    label: "Đã hủy",
    icon: "close-circle-outline",
    color: "#EF4444",
  },
};

const PAYMENT_STATUS_MAP = {
  unpaid: { label: "Chưa thanh toán", color: "#F59E0B" },
  paid: { label: "Đã thanh toán", color: "#10B981" },
  refunded: { label: "Đã hoàn tiền", color: "#6B7280" },
};

const toPaymentStatus = (rawPayment: unknown): Order["paymentStatus"] => {
  const value = String(rawPayment ?? "").toLowerCase();

  if (value === "paid" || value === "success" || value === "completed") {
    return "paid";
  }

  if (value === "refunded" || value === "refund") {
    return "refunded";
  }

  // Common backend states like "pending"/"failed" are treated as unpaid in UI.
  return "unpaid";
};

const toOrderStatus = (rawStatus: unknown): Order["status"] => {
  const value = String(rawStatus ?? "").toLowerCase();
  if (value in ORDER_STATUS_MAP) return value as Order["status"];
  return "pending";
};

const asImageUrl = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
};

const normalizeOrder = (raw: any): Order => {
  const sourceItems = Array.isArray(raw?.items)
    ? raw.items
    : Array.isArray(raw?.cartItems)
      ? raw.cartItems
      : [];

  const items: OrderItem[] = sourceItems.map((item: any) => ({
    productId: String(
      item?.productId ?? item?.product?._id ?? item?.product ?? "",
    ),
    productName:
      item?.productName ?? item?.name ?? item?.product?.name ?? "Sản phẩm",
    quantity: Number(item?.quantity ?? 0),
    price: Number(item?.price ?? item?.unitPrice ?? item?.product?.price ?? 0),
    sale_price:
      typeof item?.sale_price === "number"
        ? item.sale_price
        : typeof item?.product?.sale_price === "number"
          ? item.product.sale_price
          : undefined,
    imageUrl:
      asImageUrl(item?.imageUrl) ??
      asImageUrl(item?.image_url) ??
      asImageUrl(item?.image) ??
      asImageUrl(item?.product?.imageUrl) ??
      asImageUrl(item?.product?.image_url) ??
      asImageUrl(item?.product?.image),
    status: item?.status,
    isPreOrder: item?.isPreOrder,
  }));

  const status = toOrderStatus(raw?.status ?? raw?.orderStatus);
  const paymentStatus = toPaymentStatus(raw?.paymentStatus);

  return {
    _id: String(raw?._id ?? ""),
    orderNumber: raw?.orderNumber,
    userId: String(raw?.userId ?? raw?.customer ?? raw?.user?._id ?? ""),
    items,
    totalPrice: Number(raw?.totalPrice ?? raw?.totalAmount ?? 0),
    status,
    paymentStatus,
    paymentMethod: raw?.paymentMethod,
    shippingAddress: raw?.shippingAddress,
    createdAt: raw?.createdAt ?? new Date().toISOString(),
    updatedAt: raw?.updatedAt ?? new Date().toISOString(),
    deliveryDate: raw?.deliveryDate,
    cancelReason: raw?.cancelReason,
    note: raw?.note,
  };
};

export default function OrderTrackingScreen({
  navigation,
  route,
}: OrderTrackingScreenProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<
    "all" | "active" | "completed"
  >("all");

  // ── Fetch Orders ──
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderApi.getMyOrders();
      const payload = res?.data?.data ?? res?.data;
      const rawOrders = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.orders)
          ? payload.orders
          : Array.isArray(res?.data?.orders)
            ? res.data.orders
            : Array.isArray(payload?.results)
              ? payload.results
              : Array.isArray(payload?.docs)
                ? payload.docs
                : [payload].filter(Boolean);

      const ordersArray: Order[] = rawOrders
        .map(normalizeOrder)
        .filter((order: Order) => !!order._id);

      // Sort by date (newest first)
      ordersArray.sort(
        (a: Order, b: Order) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      setOrders(ordersArray);
    } catch (error: any) {
      const status = error?.response?.status;
      const serverMessage =
        error?.response?.data?.message || error?.response?.data?.error;

      // React Native surfaces console.error as redbox overlay in dev mode.
      console.warn(
        "Failed to fetch orders:",
        status,
        serverMessage || error?.message,
      );

      if (status === 401 || status === 403) {
        toast.error(
          "Phiên đăng nhập đã hết hạn",
          "Vui lòng đăng nhập lại để xem đơn hàng",
        );
        navigation?.navigate("Login");
        return;
      }

      toast.error(
        "Không thể tải đơn hàng",
        serverMessage || error.message || "Vui lòng thử lại",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // ── Handle Refresh ──
  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  // ── Handle Cancel Order ──
  const handleCancelOrder = async (orderId: string) => {
    Alert.alert("Hủy đơn hàng", "Bạn có chắc chắn muốn hủy đơn hàng này?", [
      { text: "Không", style: "cancel" },
      {
        text: "Hủy đơn",
        style: "destructive",
        onPress: async () => {
          try {
            await orderApi.cancel(orderId, "Khách hàng yêu cầu hủy");
            toast.success("Đã hủy đơn hàng", "Đơn hàng đã được hủy thành công");
            fetchOrders();
          } catch (error: any) {
            toast.error(
              "Không thể hủy đơn",
              error.message || "Vui lòng thử lại",
            );
          }
        },
      },
    ]);
  };

  // ── Handle Confirm Delivery ──
  const handleConfirmDelivery = async (orderId: string) => {
    try {
      await orderApi.confirmDelivery(orderId);
      toast.success("Đã xác nhận", "Cảm ơn bạn đã mua hàng!");
      fetchOrders();
    } catch (error: any) {
      toast.error("Không thể xác nhận", error.message || "Vui lòng thử lại");
    }
  };

  // ── Filter Orders ──
  const filteredOrders = orders.filter((order) => {
    if (selectedTab === "active") {
      return ["pending", "processing", "shipping"].includes(order.status);
    }
    if (selectedTab === "completed") {
      return ["delivered", "cancelled"].includes(order.status);
    }
    return true;
  });

  // ── Render Order Item ──
  const renderOrderItem = (order: Order) => {
    const statusInfo = ORDER_STATUS_MAP[order.status];
    const paymentInfo = PAYMENT_STATUS_MAP[order.paymentStatus];
    const orderItems = Array.isArray(order.items) ? order.items : [];
    const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);

    return (
      <TouchableOpacity
        key={order._id}
        style={styles.orderCard}
        activeOpacity={0.85}
        onPress={() => {
          // Navigate to order detail
          console.log("View order detail:", order._id);
        }}
      >
        {/* Header */}
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <Ionicons name="receipt-outline" size={20} color={Colors.primary} />
            <Text style={styles.orderNumber}>
              #{order.orderNumber || order._id.slice(-8).toUpperCase()}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusInfo.color + "20" },
            ]}
          >
            <Ionicons
              name={statusInfo.icon as any}
              size={14}
              color={statusInfo.color}
            />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        {/* Order Date */}
        <Text style={styles.orderDate}>
          {new Date(order.createdAt).toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>

        {/* Timeline */}
        <View style={styles.timeline}>
          {["pending", "processing", "shipping", "delivered"].map(
            (step, index) => {
              const isActive =
                ["pending", "processing", "shipping", "delivered"].indexOf(
                  order.status,
                ) >= index;
              const isCurrent = order.status === step;
              const stepInfo =
                ORDER_STATUS_MAP[step as keyof typeof ORDER_STATUS_MAP];

              return (
                <View key={step} style={styles.timelineItem}>
                  <View
                    style={[
                      styles.timelineDot,
                      isActive && styles.timelineDotActive,
                      isCurrent && styles.timelineDotCurrent,
                    ]}
                  >
                    {isActive && (
                      <Ionicons
                        name={isCurrent ? (stepInfo.icon as any) : "checkmark"}
                        size={12}
                        color={Colors.white}
                      />
                    )}
                  </View>
                  {index < 3 && (
                    <View
                      style={[
                        styles.timelineLine,
                        isActive && styles.timelineLineActive,
                      ]}
                    />
                  )}
                </View>
              );
            },
          )}
        </View>

        {/* Items Preview */}
        <View style={styles.itemsPreview}>
          {orderItems.slice(0, 3).map((item, index) => (
            <View key={index} style={styles.itemPreviewCard}>
              {item.imageUrl && (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.itemImage}
                />
              )}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.productName}
                </Text>
                <Text style={styles.itemQuantity}>x{item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>
                {formatPrice(item.sale_price || item.price)}
              </Text>
            </View>
          ))}
          {orderItems.length > 3 && (
            <Text style={styles.moreItems}>
              +{orderItems.length - 3} sản phẩm khác
            </Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.orderFooter}>
          <View>
            <Text style={styles.totalLabel}>
              Tổng cộng ({totalItems} sản phẩm)
            </Text>
            <Text style={styles.totalPrice}>
              {formatPrice(order.totalPrice)}
            </Text>
          </View>
          <View style={styles.footerActions}>
            {order.status === "pending" && (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => handleCancelOrder(order._id)}
              >
                <Text style={styles.cancelBtnText}>Hủy đơn</Text>
              </TouchableOpacity>
            )}
            {order.status === "shipping" && (
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={() => handleConfirmDelivery(order._id)}
              >
                <Text style={styles.confirmBtnText}>Đã nhận hàng</Text>
              </TouchableOpacity>
            )}
            {order.status === "delivered" && (
              <TouchableOpacity style={styles.reviewBtn}>
                <Text style={styles.reviewBtnText}>Đánh giá</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Payment Status */}
        <View style={styles.paymentBadge}>
          <Ionicons
            name={order.paymentStatus === "paid" ? "card" : "card-outline"}
            size={14}
            color={paymentInfo.color}
          />
          <Text style={[styles.paymentText, { color: paymentInfo.color }]}>
            {paymentInfo.label}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Render Empty ──
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={80} color={Colors.border} />
      <Text style={styles.emptyTitle}>Chưa có đơn hàng</Text>
      <Text style={styles.emptyDesc}>
        {selectedTab === "active"
          ? "Bạn chưa có đơn hàng đang xử lý"
          : selectedTab === "completed"
            ? "Bạn chưa có đơn hàng hoàn tất"
            : "Bạn chưa có đơn hàng nào"}
      </Text>
      <TouchableOpacity
        style={styles.shopBtn}
        onPress={() => navigation?.navigate("Home")}
      >
        <LinearGradient
          colors={[Colors.primary, "#9333EA"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shopBtnGradient}
        >
          <Text style={styles.shopBtnText}>Mua sắm ngay</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.white} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation?.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đơn Hàng Của Tôi</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {[
          { key: "all", label: "Tất cả", count: orders.length },
          {
            key: "active",
            label: "Đang xử lý",
            count: orders.filter((o) =>
              ["pending", "processing", "shipping"].includes(o.status),
            ).length,
          },
          {
            key: "completed",
            label: "Hoàn tất",
            count: orders.filter((o) =>
              ["delivered", "cancelled"].includes(o.status),
            ).length,
          },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, selectedTab === tab.key && styles.tabActive]}
            onPress={() => setSelectedTab(tab.key as any)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View
                style={[
                  styles.tabBadge,
                  selectedTab === tab.key && styles.tabBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabBadgeText,
                    selectedTab === tab.key && styles.tabBadgeTextActive,
                  ]}
                >
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        >
          {filteredOrders.length > 0
            ? filteredOrders.map(renderOrderItem)
            : renderEmpty()}
          <View style={{ height: Spacing.xxxl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
    flex: 1,
    textAlign: "center",
  },

  // Tabs
  tabs: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.base,
    gap: Spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    fontWeight: Typography.weight.medium,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: Typography.weight.bold,
  },
  tabBadge: {
    backgroundColor: Colors.surfaceVariant,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    minWidth: 20,
    alignItems: "center",
  },
  tabBadgeActive: {
    backgroundColor: Colors.primary,
  },
  tabBadgeText: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weight.bold,
  },
  tabBadgeTextActive: {
    color: Colors.white,
  },

  // Content
  content: {
    flex: 1,
    padding: Spacing.base,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
  },

  // Empty
  emptyContainer: {
    paddingVertical: Spacing.xxxl * 2,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  emptyDesc: {
    fontSize: Typography.size.base,
    color: Colors.textMuted,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  shopBtn: {
    marginTop: Spacing.base,
  },
  shopBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.full,
  },
  shopBtnText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.white,
  },

  // Order Card
  orderCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  orderHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  orderNumber: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  statusText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
  },
  orderDate: {
    fontSize: Typography.size.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },

  // Timeline
  timeline: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.base,
    paddingHorizontal: Spacing.sm,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineDotActive: {
    backgroundColor: Colors.success,
  },
  timelineDotCurrent: {
    backgroundColor: Colors.primary,
    transform: [{ scale: 1.2 }],
  },
  timelineLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  timelineLineActive: {
    backgroundColor: Colors.success,
  },

  // Items Preview
  itemsPreview: {
    marginBottom: Spacing.md,
  },
  itemPreviewCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceVariant,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: Typography.size.base,
    color: Colors.text,
    marginBottom: 2,
  },
  itemQuantity: {
    fontSize: Typography.size.sm,
    color: Colors.textMuted,
  },
  itemPrice: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semiBold,
    color: Colors.primary,
  },
  moreItems: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    fontStyle: "italic",
    marginTop: Spacing.xs,
  },

  // Footer
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalLabel: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  totalPrice: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
  },
  footerActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  cancelBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  cancelBtnText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semiBold,
    color: Colors.error,
  },
  confirmBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
  },
  confirmBtnText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semiBold,
    color: Colors.white,
  },
  reviewBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    borderRadius: Radius.md,
    backgroundColor: Colors.secondary,
  },
  reviewBtnText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semiBold,
    color: Colors.white,
  },

  // Payment Badge
  paymentBadge: {
    position: "absolute",
    top: Spacing.base,
    right: Spacing.base,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.surfaceVariant,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  paymentText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
  },
});
