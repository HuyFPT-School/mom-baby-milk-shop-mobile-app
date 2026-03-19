import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius, Shadow, Spacing, Typography } from "../../constants/theme";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { productApi } from "../../services/api";
import { formatDate, formatDateTime, formatPrice, getDiscountPercent, getProductImage } from "../../utils/formatters";
import { toast } from "../../components/Toast";
import PreOrderModal from "../../components/PreOrderModal";
import type { Product } from "../../types";

type ActiveTab = "description" | "usage" | "reviews";

interface ProductDetailScreenProps {
  navigation: any;
  route: {
    params?: {
      productId?: string;
    };
  };
}

interface CommentItem {
  _id: string;
  rating: number;
  content: string;
  author?: {
    _id?: string;
    id?: string;
    fullname?: string;
    name?: string;
    email?: string;
  } | string;
  createdAt?: string;
}

const TAB_LABELS: Record<ActiveTab, string> = {
  description: "Mô tả",
  usage: "Hướng dẫn",
  reviews: "Đánh giá",
};

export default function ProductDetailScreen({ navigation, route }: ProductDetailScreenProps) {
  const productId = route.params?.productId ?? "";
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<ActiveTab>("description");

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editContent, setEditContent] = useState("");

  const [preOrderProduct, setPreOrderProduct] = useState<Product | null>(null);

  const imageList = useMemo(() => {
    if (!product) return [] as string[];
    if (Array.isArray(product.imageUrl) && product.imageUrl.length > 0) {
      return product.imageUrl;
    }
    return [getProductImage(product)];
  }, [product]);

  const effectivePrice = product?.sale_price ?? product?.price ?? 0;
  const discount = product ? getDiscountPercent(product.price, product.sale_price) : 0;
  const maxQty = Math.max(1, product?.quantity ?? 1);

  const productAny = product as (Product & Record<string, any>) | null;

  const currentUserId = user?._id ?? "";

  const extractComments = (item: Product | null): CommentItem[] => {
    if (!item) return [];
    const raw = (item as Product & Record<string, any>).comments;
    return Array.isArray(raw) ? (raw as CommentItem[]) : [];
  };

  const fetchProductDetail = useCallback(async () => {
    if (!productId) {
      setError("Thiếu mã sản phẩm");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await productApi.getById(productId);
      const item = res.data?.data ?? (res.data as unknown as Product);
      if (!item || !(item as Product)._id) {
        setProduct(null);
        setComments([]);
        setError("Sản phẩm không tồn tại");
        return;
      }
      setProduct(item as Product);
      setComments(extractComments(item as Product));
      setSelectedImage(0);
      setQuantity(1);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 404) {
        setError("Sản phẩm không tồn tại");
      } else {
        setError("Không thể tải thông tin sản phẩm. Vui lòng thử lại.");
      }
      setProduct(null);
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  const fetchComments = useCallback(async () => {
    if (!productId) return;
    try {
      setCommentsLoading(true);
      const res = await productApi.getById(productId);
      const item = res.data?.data ?? (res.data as unknown as Product);
      setComments(extractComments(item as Product));
    } catch {
      toast.error("Không thể tải đánh giá", "Vui lòng thử lại");
    } finally {
      setCommentsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProductDetail();
  }, [fetchProductDetail]);

  useEffect(() => {
    if (activeTab === "reviews") {
      fetchComments();
    }
  }, [activeTab, fetchComments]);

  const renderStars = (
    value: number,
    onChange?: (next: number) => void,
    size = 20,
    testPrefix = "rating",
  ) => (
    <View style={styles.ratingRow}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        const iconName: keyof typeof Ionicons.glyphMap = filled ? "star" : "star-outline";
        return (
          <TouchableOpacity
            key={`${testPrefix}-${star}`}
            disabled={!onChange}
            onPress={() => onChange?.(star)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            accessibilityRole="button"
            accessibilityLabel={`Đánh giá ${star} sao`}
          >
            <Ionicons
              name={iconName}
              size={size}
              color={filled ? Colors.warning : Colors.textMuted}
              style={styles.ratingIcon}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const handleAddToCart = () => {
    if (!product) return;

    if (!isAuthenticated) {
      toast.info("Vui lòng đăng nhập", "Bạn cần đăng nhập để thêm vào giỏ hàng");
      navigation.navigate("Account");
      return;
    }

    const isOutOfStock = product.quantity === 0 && !product.expectedRestockDate;
    const isComingSoon =
      !!product.expectedRestockDate && new Date(product.expectedRestockDate) > new Date();
    const canPreOrder = (isOutOfStock || isComingSoon) && product.allowPreOrder !== false;

    if (canPreOrder) {
      setPreOrderProduct(product);
      return;
    }

    if (product.quantity <= 0) {
      toast.error("Hết hàng", "Sản phẩm hiện đã hết hàng");
      return;
    }

    const added = addToCart({
      id: product._id,
      name: product.name,
      price: product.price,
      sale_price: product.sale_price,
      image_url: getProductImage(product),
      quantity,
      availableStock: product.quantity,
    });

    if (added) {
      toast.success("Đã thêm vào giỏ", `${quantity}x ${product.name}`);
    }
  };

  const handlePreOrderConfirm = (selected: Product, options: any) => {
    if (!isAuthenticated) {
      toast.info("Vui lòng đăng nhập", "Bạn cần đăng nhập để đặt trước");
      setPreOrderProduct(null);
      return;
    }

    const added = addToCart({
      id: selected._id,
      name: selected.name,
      price: selected.price,
      sale_price: selected.sale_price,
      image_url: getProductImage(selected),
      quantity: options.quantity,
      availableStock: 0,
      isPreOrder: true,
      preOrderType: options.preOrderType,
      paymentOption: options.paymentOption,
      releaseDate: options.releaseDate,
    });

    if (!added) return;

    toast.success("Đã đặt trước", `${options.quantity}x ${selected.name}`);
    setPreOrderProduct(null);
  };

  const handleSubmitComment = async () => {
    if (!product) return;

    const content = newContent.trim();
    if (!content) {
      toast.error("Thiếu nội dung", "Vui lòng nhập đánh giá của bạn");
      return;
    }

    if (!isAuthenticated) {
      toast.info("Cần đăng nhập", "Bạn cần đăng nhập để gửi đánh giá");
      navigation.navigate("Account");
      return;
    }

    try {
      setSubmitting(true);
      await productApi.createComment(product._id, {
        rating: newRating,
        content,
      });
      setNewContent("");
      setNewRating(5);
      await fetchComments();
      toast.success("Gửi đánh giá thành công");
    } catch {
      toast.error("Không thể gửi đánh giá", "Vui lòng thử lại");
    } finally {
      setSubmitting(false);
    }
  };

  const beginEdit = (comment: CommentItem) => {
    setEditingId(comment._id);
    setEditRating(comment.rating ?? 5);
    setEditContent(comment.content ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditRating(5);
    setEditContent("");
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!product) return;

    const content = editContent.trim();
    if (!content) {
      toast.error("Thiếu nội dung", "Vui lòng nhập nội dung đánh giá");
      return;
    }

    try {
      setSubmitting(true);
      await productApi.updateComment(product._id, commentId, {
        rating: editRating,
        content,
      });
      cancelEdit();
      await fetchComments();
      toast.success("Cập nhật đánh giá thành công");
    } catch {
      toast.error("Không thể cập nhật đánh giá", "Vui lòng thử lại");
    } finally {
      setSubmitting(false);
    }
  };

  const performDeleteComment = async (commentId: string) => {
    if (!product) return;
    try {
      setSubmitting(true);
      await productApi.deleteComment(product._id, commentId);
      await fetchComments();
      toast.success("Đã xóa đánh giá");
    } catch {
      toast.error("Không thể xóa đánh giá", "Vui lòng thử lại");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    Alert.alert(
      "Xóa đánh giá",
      "Bạn có chắc muốn xóa đánh giá này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => {
            performDeleteComment(commentId);
          },
        },
      ],
    );
  };

  const renderDescription = () => (
    <View style={styles.tabContent}>
      <Text style={styles.descriptionText}>
        {product?.description || "Chưa có mô tả cho sản phẩm này."}
      </Text>

      <View style={styles.specGrid}>
        {!!productAny?.appropriateAge && (
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Độ tuổi phù hợp</Text>
            <Text style={styles.specValue}>{String(productAny.appropriateAge)}</Text>
          </View>
        )}
        {!!productAny?.weight && (
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Khối lượng</Text>
            <Text style={styles.specValue}>{String(productAny.weight)}g</Text>
          </View>
        )}
        {!!productAny?.manufacturer && (
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Nhà sản xuất</Text>
            <Text style={styles.specValue}>{String(productAny.manufacturer)}</Text>
          </View>
        )}
        {!!productAny?.manufacture && (
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Ngày sản xuất</Text>
            <Text style={styles.specValue}>{formatDate(String(productAny.manufacture))}</Text>
          </View>
        )}
        {!!productAny?.expiry && (
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Hạn sử dụng</Text>
            <Text style={styles.specValue}>{formatDate(String(productAny.expiry))}</Text>
          </View>
        )}
      </View>

      {!!productAny?.storageInstructions && (
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Bảo quản</Text>
          <Text style={styles.infoText}>{String(productAny.storageInstructions)}</Text>
        </View>
      )}

      {!!productAny?.warning && (
        <View style={[styles.infoBox, styles.warningBox]}>
          <Text style={styles.infoTitle}>Lưu ý</Text>
          <Text style={styles.infoText}>{String(productAny.warning)}</Text>
        </View>
      )}
    </View>
  );

  const renderUsage = () => (
    <View style={styles.tabContent}>
      <Text style={styles.descriptionText}>
        {productAny?.instructionsForUse
          ? String(productAny.instructionsForUse)
          : "Chưa có hướng dẫn sử dụng cho sản phẩm này."}
      </Text>

      <View style={[styles.infoBox, styles.tipBox]}>
        <Text style={styles.infoTitle}>Mẹo sử dụng</Text>
        <Text style={styles.infoText}>
          Luôn đọc kỹ hướng dẫn trên bao bì, dùng đúng liều lượng và tham khảo chuyên gia khi cần.
        </Text>
      </View>
    </View>
  );

  const renderCommentItem = (comment: CommentItem) => {
    const authorId =
      typeof comment.author === "object"
        ? comment.author?._id || comment.author?.id || ""
        : "";
    const authorName =
      typeof comment.author === "object"
        ? comment.author?.fullname || comment.author?.name || comment.author?.email || "Người dùng"
        : "Người dùng";
    const canEdit = !!currentUserId && authorId === currentUserId;
    const isEditing = editingId === comment._id;

    return (
      <View key={comment._id} style={styles.commentCard}>
        <View style={styles.commentHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.commentAuthor}>{authorName}</Text>
            {renderStars(isEditing ? editRating : comment.rating ?? 5, isEditing ? setEditRating : undefined, 16, `comment-${comment._id}`)}
          </View>

          {!!comment.createdAt && (
            <Text style={styles.commentDate}>{formatDateTime(comment.createdAt)}</Text>
          )}
        </View>

        {isEditing ? (
          <>
            <TextInput
              value={editContent}
              onChangeText={setEditContent}
              style={[styles.input, styles.commentInput]}
              placeholder="Chỉnh sửa đánh giá"
              placeholderTextColor={Colors.textMuted}
              multiline
              textAlignVertical="top"
            />
            <View style={styles.commentActions}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={cancelEdit}>
                <Text style={styles.secondaryBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, submitting && styles.btnDisabled]}
                onPress={() => handleUpdateComment(comment._id)}
                disabled={submitting}
              >
                <Text style={styles.primaryBtnText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <Text style={styles.commentContent}>{comment.content}</Text>
        )}

        {!isEditing && canEdit && (
          <View style={styles.commentActions}>
            <TouchableOpacity style={styles.iconAction} onPress={() => beginEdit(comment)}>
              <Ionicons name="create-outline" size={18} color={Colors.primary} />
              <Text style={styles.iconActionText}>Sửa</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconAction} onPress={() => handleDeleteComment(comment._id)}>
              <Ionicons name="trash-outline" size={18} color={Colors.error} />
              <Text style={[styles.iconActionText, { color: Colors.error }]}>Xóa</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderReviews = () => (
    <View style={styles.tabContent}>
      {isAuthenticated ? (
        <View style={styles.commentForm}>
          <Text style={styles.formTitle}>Viết đánh giá của bạn</Text>
          {renderStars(newRating, setNewRating, 22, "new")}
          <TextInput
            value={newContent}
            onChangeText={setNewContent}
            style={[styles.input, styles.commentInput]}
            placeholder="Chia sẻ cảm nhận của bạn về sản phẩm"
            placeholderTextColor={Colors.textMuted}
            multiline
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[styles.primaryBtn, (!newContent.trim() || submitting) && styles.btnDisabled]}
            onPress={handleSubmitComment}
            disabled={!newContent.trim() || submitting}
          >
            <Text style={styles.primaryBtnText}>{submitting ? "Đang gửi..." : "Gửi đánh giá"}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.loginPrompt}>
          <Text style={styles.loginPromptText}>Đăng nhập để gửi đánh giá sản phẩm.</Text>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate("Account")}>
            <Text style={styles.secondaryBtnText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      )}

      {commentsLoading ? (
        <View style={styles.commentsLoading}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.commentsLoadingText}>Đang tải đánh giá...</Text>
        </View>
      ) : comments.length === 0 ? (
        <View style={styles.emptyReviews}>
          <Text style={styles.emptyReviewsText}>Chưa có đánh giá nào cho sản phẩm này.</Text>
        </View>
      ) : (
        <View style={styles.commentsList}>{comments.map(renderCommentItem)}</View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.centerScreen} edges={["top"]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Đang tải thông tin sản phẩm...</Text>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={styles.centerScreen} edges={["top"]}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
        <Text style={styles.errorText}>{error || "Không tìm thấy sản phẩm"}</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={fetchProductDetail}>
          <Text style={styles.primaryBtnText}>Thử lại</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryBtnText}>Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const brandName =
    typeof product.brand === "object" ? product.brand?.name : product.brand || "";

  const isOutOfStock = product.quantity === 0 && !product.expectedRestockDate;
  const isComingSoon =
    !!product.expectedRestockDate && new Date(product.expectedRestockDate) > new Date();
  const stockLabel =
    product.quantity > 0
      ? `Còn ${product.quantity} sản phẩm`
      : isComingSoon
        ? "Sắp ra mắt"
        : isOutOfStock
          ? "Hết hàng"
          : "Tạm hết hàng";

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Image
          source={{ uri: imageList[selectedImage] || getProductImage(product) }}
          style={styles.heroImage}
          resizeMode="contain"
        />

        {imageList.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbScroll}>
            {imageList.map((img, idx) => {
              const selected = idx === selectedImage;
              return (
                <TouchableOpacity
                  key={`${img}-${idx}`}
                  style={[styles.thumbWrap, selected && styles.thumbWrapSelected]}
                  onPress={() => setSelectedImage(idx)}
                >
                  <Image source={{ uri: img }} style={styles.thumbImage} resizeMode="contain" />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {!!brandName && <Text style={styles.brandText}>{brandName}</Text>}
        <Text style={styles.productName}>{product.name}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.priceText}>{formatPrice(effectivePrice)}</Text>
          {discount > 0 && (
            <>
              <Text style={styles.originalPrice}>{formatPrice(product.price)}</Text>
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>-{discount}%</Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.stockRow}>
          <Ionicons
            name={product.quantity > 0 ? "checkmark-circle" : "close-circle"}
            size={18}
            color={product.quantity > 0 ? Colors.success : Colors.error}
          />
          <Text style={[styles.stockText, { color: product.quantity > 0 ? Colors.success : Colors.error }]}>
            {stockLabel}
          </Text>
        </View>

        <View style={styles.qtySection}>
          <Text style={styles.qtyLabel}>Số lượng</Text>
          <View style={styles.qtyControls}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity((prev) => Math.max(1, prev - 1))}
              disabled={quantity <= 1}
            >
              <Ionicons name="remove" size={18} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{quantity}</Text>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity((prev) => Math.min(maxQty, prev + 1))}
              disabled={quantity >= maxQty}
            >
              <Ionicons name="add" size={18} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.addBtn,
            product.quantity <= 0 && product.allowPreOrder === false && styles.btnDisabled,
          ]}
          onPress={handleAddToCart}
          disabled={product.quantity <= 0 && product.allowPreOrder === false}
        >
          <Ionicons name="cart-outline" size={20} color={Colors.white} />
          <Text style={styles.addBtnText}>
            {product.quantity > 0 ? "Thêm vào giỏ" : product.allowPreOrder === false ? "Hết hàng" : "Đặt trước"}
          </Text>
        </TouchableOpacity>

        <View style={styles.benefitRow}>
          <View style={styles.benefitItem}>
            <Ionicons name="car-outline" size={16} color={Colors.primary} />
            <Text style={styles.benefitText}>Giao hàng toàn quốc</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="shield-checkmark-outline" size={16} color={Colors.primary} />
            <Text style={styles.benefitText}>Hàng chính hãng 100%</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="refresh-outline" size={16} color={Colors.primary} />
            <Text style={styles.benefitText}>Đổi trả trong 7 ngày</Text>
          </View>
        </View>

        <View style={styles.tabsRow}>
          {(Object.keys(TAB_LABELS) as ActiveTab[]).map((tab) => {
            const selected = tab === activeTab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabBtn, selected && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, selected && styles.tabTextActive]}>{TAB_LABELS[tab]}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {activeTab === "description" && renderDescription()}
        {activeTab === "usage" && renderUsage()}
        {activeTab === "reviews" && renderReviews()}
      </ScrollView>

      {preOrderProduct && (
        <PreOrderModal
          visible={!!preOrderProduct}
          product={preOrderProduct}
          onClose={() => setPreOrderProduct(null)}
          onConfirm={(options) => handlePreOrderConfirm(preOrderProduct, options)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerScreen: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
  },
  errorText: {
    fontSize: Typography.size.base,
    color: Colors.error,
    textAlign: "center",
  },
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
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
    flex: 1,
    textAlign: "center",
  },
  content: {
    padding: Spacing.base,
    paddingBottom: Spacing.xxxl,
  },
  heroImage: {
    width: "100%",
    height: 280,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    ...Shadow.sm,
  },
  thumbScroll: {
    marginTop: Spacing.sm,
  },
  thumbWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    marginRight: Spacing.sm,
    padding: Spacing.xs,
  },
  thumbWrapSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  brandText: {
    marginTop: Spacing.base,
    fontSize: Typography.size.sm,
    color: Colors.primary,
    fontWeight: Typography.weight.semiBold,
  },
  productName: {
    marginTop: Spacing.xs,
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
    lineHeight: 30,
  },
  priceRow: {
    marginTop: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  priceText: {
    fontSize: Typography.size.xl,
    color: Colors.primary,
    fontWeight: Typography.weight.bold,
  },
  originalPrice: {
    fontSize: Typography.size.base,
    color: Colors.textMuted,
    textDecorationLine: "line-through",
  },
  discountBadge: {
    backgroundColor: Colors.error,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  discountText: {
    color: Colors.white,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
  },
  stockRow: {
    marginTop: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  stockText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  qtySection: {
    marginTop: Spacing.base,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  qtyLabel: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    fontWeight: Typography.weight.medium,
  },
  qtyControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyValue: {
    minWidth: 28,
    textAlign: "center",
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
  },
  addBtn: {
    marginTop: Spacing.base,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  addBtnText: {
    color: Colors.white,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  benefitRow: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  benefitText: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  tabsRow: {
    marginTop: Spacing.lg,
    flexDirection: "row",
    backgroundColor: Colors.surfaceVariant,
    borderRadius: Radius.md,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: "center",
  },
  tabBtnActive: {
    backgroundColor: Colors.surface,
    ...Shadow.sm,
  },
  tabText: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.weight.medium,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: Typography.weight.bold,
  },
  tabContent: {
    marginTop: Spacing.base,
    gap: Spacing.base,
  },
  descriptionText: {
    fontSize: Typography.size.base,
    lineHeight: 24,
    color: Colors.text,
  },
  specGrid: {
    gap: Spacing.sm,
  },
  specItem: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  specLabel: {
    fontSize: Typography.size.sm,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  specValue: {
    fontSize: Typography.size.base,
    color: Colors.text,
    fontWeight: Typography.weight.medium,
  },
  infoBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  warningBox: {
    backgroundColor: "#FFF8E1",
    borderColor: "#FDE68A",
  },
  tipBox: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  infoTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontSize: Typography.size.sm,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  commentForm: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  formTitle: {
    fontSize: Typography.size.base,
    color: Colors.text,
    fontWeight: Typography.weight.bold,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingIcon: {
    marginRight: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    color: Colors.text,
    fontSize: Typography.size.base,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  commentInput: {
    minHeight: 96,
  },
  primaryBtn: {
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm + 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.base,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semiBold,
  },
  secondaryBtn: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.sm + 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.base,
  },
  secondaryBtnText: {
    color: Colors.text,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
  },
  loginPrompt: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  loginPromptText: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
  },
  commentsLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  commentsLoadingText: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
  },
  emptyReviews: {
    paddingVertical: Spacing.base,
    alignItems: "center",
  },
  emptyReviewsText: {
    color: Colors.textMuted,
    fontSize: Typography.size.sm,
  },
  commentsList: {
    gap: Spacing.sm,
  },
  commentCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  commentAuthor: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
    marginBottom: 4,
  },
  commentDate: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
  },
  commentContent: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  iconAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
  },
  iconActionText: {
    color: Colors.primary,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
});
