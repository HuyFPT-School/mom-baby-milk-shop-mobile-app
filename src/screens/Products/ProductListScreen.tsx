import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Dimensions,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  Colors,
  Spacing,
  Radius,
  Typography,
  Shadow,
} from "../../constants/theme";
import { productApi, categoryApi, brandApi } from "../../services/api";
import { getProductImage } from "../../utils/formatters";
import ProductCard from "../../components/ProductCard";
import { toast } from "../../components/Toast";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import PreOrderModal from "../../components/PreOrderModal";
import type { Product, Category, Brand } from "../../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface ProductListScreenProps {
  navigation?: any;
  route?: any;
}

export default function ProductListScreen({
  navigation,
  route,
}: ProductListScreenProps) {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  // UI states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [preOrderProduct, setPreOrderProduct] = useState<Product | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Search debounce
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  // ── Fetch Products ──
  const fetchProducts = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params: any = {
        page: pageNum,
        limit: searchQuery ? 1000 : 20, // Get more products for client-side search
      };

      // Don't send search params if doing client-side filtering
      // Try sending search query to backend first
      if (searchQuery) {
        params.search = searchQuery;
        params.name = searchQuery; // Try both search and name parameters
      }
      if (selectedCategory) params.category = selectedCategory;
      if (selectedBrand) params.brand = selectedBrand;

      console.log("🔍 Search params:", params);
      const res = await productApi.getAll(params);
      console.log("📦 API Response:", res.data);
      const data = res.data.data ?? (res.data as unknown as Product[]);
      let arr = Array.isArray(data) ? data : [];

      // Client-side filtering as fallback if backend doesn't support search
      if (searchQuery && arr.length > 0) {
        const query = searchQuery.toLowerCase().trim();
        arr = arr.filter(
          (product) =>
            product.name?.toLowerCase().includes(query) ||
            product.description?.toLowerCase().includes(query),
        );
        console.log("🔍 Filtered products:", arr.length);
      }

      const productsWithImages = arr.map((p) => ({
        ...p,
        image_url: getProductImage(p),
      }));

      if (append) {
        setProducts((prev) => [...prev, ...productsWithImages]);
      } else {
        setProducts(productsWithImages);
      }

      // Disable pagination when using client-side search
      setHasMore(searchQuery ? false : arr.length >= 20);
      setPage(pageNum);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Không thể tải sản phẩm", "Vui lòng thử lại");
      setProducts([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  // ── Fetch Categories & Brands ──
  useEffect(() => {
    (async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          categoryApi.getAll(),
          brandApi.getAll(),
        ]);
        const cats = catRes.data.data ?? (catRes.data as unknown as Category[]);
        const brds =
          brandRes.data.data ?? (brandRes.data as unknown as Brand[]);
        setCategories(Array.isArray(cats) ? cats : []);
        setBrands(Array.isArray(brds) ? brds : []);
      } catch (error) {
        console.warn("Failed to fetch filters:", error);
      }
    })();
  }, []);

  // ── Initial Load ──
  useEffect(() => {
    fetchProducts(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto Search on Query Change (Debounced) ──
  useEffect(() => {
    // Skip initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Set new timeout for search (500ms delay)
    searchTimeout.current = setTimeout(() => {
      console.log("🔍 Triggering search with query:", searchQuery);
      setPage(1);
      fetchProducts(1, false);
    }, 500);

    // Cleanup on unmount
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // ── Handle Search ──
  const handleSearch = () => {
    setPage(1);
    fetchProducts(1, false);
  };

  // ── Handle Refresh ──
  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchProducts(1, false);
  };

  // ── Handle Load More ──
  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchProducts(page + 1, true);
    }
  };

  // ── Handle Product Press ──
  const handleProductPress = (product: Product) => {
    navigation?.navigate("ProductDetail", { productId: product._id });
  };

  // ── Handle Add to Cart ──
  const handleAddToCart = (product: Product) => {
    if (!isAuthenticated) {
      toast.info("Vui lòng đăng nhập", "Bạn cần đăng nhập để thêm vào giỏ hàng");
      return;
    }

    const isOutOfStock = product.quantity === 0 && !product.expectedRestockDate;
    const isComingSoon =
      !!product.expectedRestockDate &&
      new Date(product.expectedRestockDate) > new Date();
    const canPreOrder =
      (isOutOfStock || isComingSoon) && product.allowPreOrder !== false;

    if (canPreOrder) {
      setPreOrderProduct(product);
      return;
    }

    if (product.quantity > 0) {
      const added = addToCart({
        id: product._id,
        name: product.name,
        price: product.price,
        sale_price: product.sale_price,
        image_url: getProductImage(product),
        quantity: 1,
        availableStock: product.quantity,
      });
      if (added) {
        toast.success("Đã thêm vào giỏ hàng", product.name);
      }
    } else {
      toast.error("Hết hàng", "Sản phẩm tạm thời hết hàng");
    }
  };

  // ── Handle Pre-Order Confirm ──
  const handlePreOrderConfirm = (product: Product, options: any) => {
    if (!isAuthenticated) {
      toast.info("Vui lòng đăng nhập", "Bạn cần đăng nhập để đặt trước");
      setPreOrderProduct(null);
      return;
    }

    const added = addToCart({
      id: product._id,
      name: product.name,
      price: product.price,
      sale_price: product.sale_price,
      image_url: getProductImage(product),
      quantity: options.quantity,
      availableStock: 0,
      isPreOrder: true,
      preOrderType: options.preOrderType,
      paymentOption: options.paymentOption,
      releaseDate: options.releaseDate,
    });
    if (!added) return;

    toast.success("Đã đặt trước", `${options.quantity}x ${product.name}`);
    setPreOrderProduct(null);
  };

  // ── Clear Filters ──
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setSelectedBrand(null);
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedBrand;

  // ── Render Product Item ──
  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productWrapper}>
      <ProductCard
        item={item}
        onPress={handleProductPress}
        onAddToCart={handleAddToCart}
      />
    </View>
  );

  // ── Render Footer ──
  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  };

  // ── Render Empty ──
  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={64} color={Colors.border} />
        <Text style={styles.emptyTitle}>Không tìm thấy sản phẩm</Text>
        <Text style={styles.emptyDesc}>
          Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
        </Text>
        {hasActiveFilters && (
          <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
            <Text style={styles.clearBtnText}>Xóa bộ lọc</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

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
        <Text style={styles.headerTitle}>Sản Phẩm</Text>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setShowFilters(true)}
          activeOpacity={0.7}
        >
          <Ionicons
            name="filter"
            size={22}
            color={hasActiveFilters ? Colors.primary : Colors.text}
          />
          {hasActiveFilters && <View style={styles.filterBadge} />}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm sản phẩm..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons
                name="close-circle"
                size={20}
                color={Colors.textMuted}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Active Filters Chips */}
      {hasActiveFilters && (
        <View style={styles.chipsContainer}>
          {selectedCategory && (
            <View style={styles.chip}>
              <Text style={styles.chipText} numberOfLines={1}>
                {categories.find((c) => c._id === selectedCategory)?.name}
              </Text>
              <TouchableOpacity onPress={() => setSelectedCategory(null)}>
                <Ionicons name="close" size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          )}
          {selectedBrand && (
            <View style={styles.chip}>
              <Text style={styles.chipText} numberOfLines={1}>
                {brands.find((b) => b._id === selectedBrand)?.name}
              </Text>
              <TouchableOpacity onPress={() => setSelectedBrand(null)}>
                <Ionicons name="close" size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Product List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải sản phẩm...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item._id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bộ Lọc</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={28} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              {/* Categories */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupTitle}>Danh Mục</Text>
                <View style={styles.filterOptions}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat._id}
                      style={[
                        styles.filterOption,
                        selectedCategory === cat._id &&
                          styles.filterOptionActive,
                      ]}
                      onPress={() =>
                        setSelectedCategory(
                          selectedCategory === cat._id ? null : cat._id,
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          selectedCategory === cat._id &&
                            styles.filterOptionTextActive,
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Brands */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupTitle}>Thương Hiệu</Text>
                <View style={styles.filterOptions}>
                  {brands.map((brand) => (
                    <TouchableOpacity
                      key={brand._id}
                      style={[
                        styles.filterOption,
                        selectedBrand === brand._id &&
                          styles.filterOptionActive,
                      ]}
                      onPress={() =>
                        setSelectedBrand(
                          selectedBrand === brand._id ? null : brand._id,
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          selectedBrand === brand._id &&
                            styles.filterOptionTextActive,
                        ]}
                      >
                        {brand.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.clearFiltersBtn}
                onPress={() => {
                  clearFilters();
                  setShowFilters(false);
                }}
              >
                <Text style={styles.clearFiltersBtnText}>Xóa tất cả</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => {
                  setShowFilters(false);
                  fetchProducts(1, false); // Fetch when applying filters
                }}
              >
                <Text style={styles.applyBtnText}>Áp dụng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Pre-Order Modal */}
      {preOrderProduct && (
        <PreOrderModal
          visible={!!preOrderProduct}
          product={preOrderProduct}
          onClose={() => setPreOrderProduct(null)}
          onConfirm={(options) =>
            handlePreOrderConfirm(preOrderProduct, options)
          }
        />
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
  filterBtn: {
    padding: Spacing.xs,
    position: "relative",
  },
  filterBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },

  // Search
  searchSection: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.size.base,
    color: Colors.text,
    paddingVertical: Spacing.xs,
  },

  // Chips
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight + "20",
    borderRadius: Radius.full,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
    maxWidth: SCREEN_WIDTH * 0.5,
  },
  chipText: {
    fontSize: Typography.size.sm,
    color: Colors.primary,
    fontWeight: Typography.weight.medium,
    flex: 1,
  },

  // Product List
  listContent: {
    padding: Spacing.base,
    paddingBottom: Spacing.xxxl,
  },
  productWrapper: {
    width: "50%",
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.base,
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
  footerLoader: {
    paddingVertical: Spacing.lg,
    alignItems: "center",
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
  clearBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
  },
  clearBtnText: {
    color: Colors.white,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semiBold,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
  },
  modalBody: {
    padding: Spacing.lg,
    maxHeight: "60%",
  },
  filterGroup: {
    marginBottom: Spacing.xl,
  },
  filterGroupTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  filterOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterOptionText: {
    fontSize: Typography.size.base,
    color: Colors.text,
  },
  filterOptionTextActive: {
    color: Colors.white,
    fontWeight: Typography.weight.semiBold,
  },
  modalFooter: {
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  clearFiltersBtn: {
    flex: 1,
    paddingVertical: Spacing.base,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: "center",
  },
  clearFiltersBtnText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semiBold,
    color: Colors.primary,
  },
  applyBtn: {
    flex: 1,
    paddingVertical: Spacing.base,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  applyBtnText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semiBold,
    color: Colors.white,
  },
});
