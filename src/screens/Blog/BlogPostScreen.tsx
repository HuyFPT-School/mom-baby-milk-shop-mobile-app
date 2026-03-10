import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Platform,
  StatusBar,
  useWindowDimensions,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import RenderHtml from "react-native-render-html";
import { blogApi } from "../../services/api";
import type { Blog, Product } from "../../types";

export default function BlogViewScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { width } = useWindowDimensions();
  
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const blogId = (route.params as any)?.blogId;

  useEffect(() => {
    if (blogId) {
      fetchBlog();
    } else {
      setError("Blog ID not provided");
      setLoading(false);
    }
  }, [blogId]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await blogApi.getById(blogId);
      const data = response.data.data || response.data;
      setBlog(data);
    } catch (err: any) {
      console.error("Error fetching blog:", err);
      setError(err.message || "Failed to load blog");
    } finally {
      setLoading(false);
    }
  };

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    return date.toLocaleDateString("vi-VN");
  };

  const getProductImage = (product: Product): string => {
    const imageUrl = product.imageUrl || product.image_url;
    if (Array.isArray(imageUrl)) {
      return imageUrl[0] || "";
    }
    return imageUrl || "";
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B9D" />
      </View>
    );
  }

  if (error || !blog) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || "Blog not found"}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const authorIcon = "https://cdn-icons-png.flaticon.com/512/732/732204.png";
  const time = formatRelativeTime(blog.createdAt);
  const recommendedProducts = (blog.recommended_products || []) as Product[];

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={{ uri: blog.image }} style={styles.heroImage} />
        <View style={styles.contentContainer}>
          <Text style={styles.title}>{blog.title}</Text>

          <View style={styles.authorRow}>
            <Image
              source={{ uri: authorIcon }}
              style={styles.authorIcon}
            />
            <Text style={styles.authorText}>{blog.author}</Text>
            <Text style={styles.timeText}>{time}</Text>
          </View>

          <RenderHtml
            contentWidth={width}
            source={{ html: blog.content }}
            baseStyle={{
              fontSize: 16,
              color: "#333",
              lineHeight: 26,
            }}
            tagsStyles={{
              p: {
                marginBottom: 10,
              },
              h3: {
                fontSize: 20,
                fontWeight: "bold",
                color: "#1a1a1a",
                marginTop: 24,
                marginBottom: 12,
              },
              h4: {
                fontSize: 18,
                fontWeight: "600",
                color: "#333",
                marginTop: 20,
                marginBottom: 10,
              },
              a: {
                color: "#0066cc",
                textDecorationLine: "none",
              },
              ul: {
                paddingLeft: 20,
                marginBottom: 16,
              },
              li: {
                marginBottom: 8,
              },
              img: {
                marginVertical: 16,
              },
              strong: {
                fontWeight: "bold",
              },
            }}
            classesStyles={{
              "rounded-lg": {
                borderRadius: 8,
              },
            }}
          />

          {recommendedProducts.length > 0 && (
            <View style={styles.recommendedSection}>
              <Text style={styles.recommendedTitle}>Sản phẩm được giới thiệu</Text>

              {recommendedProducts.map((product) => (
                <TouchableOpacity
                  key={product._id}
                  style={styles.productCard}
                  onPress={() => navigation.navigate("ProductDetail", { productId: product._id })}
                >
                  {getProductImage(product) ? (
                    <Image
                      source={{ uri: getProductImage(product) }}
                      style={styles.productImage}
                    />
                  ) : (
                    <View style={styles.productImagePlaceholder}>
                      <Text style={styles.placeholderText}>No Image</Text>
                    </View>
                  )}
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={2}>
                      {product.name}
                    </Text>
                    <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
                    {product.brand && typeof product.brand === "object" && (
                      <Text style={styles.productBrand}>{product.brand.name}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#FF6B9D",
    borderRadius: 8,
  },
  retryText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: "#fff",
  },
  heroImage: {
    height: 240,
    borderRadius: 16,
    width: "100%", // approx to leave margin
    alignSelf: "center",
    marginBottom: 16,
  },
  contentContainer: {},
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1a1a1a",
    lineHeight: 30,
    marginBottom: 16,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  authorIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
    backgroundColor: "#eee",
  },
  authorText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginRight: 8,
  },
  timeText: {
    fontSize: 14,
    color: "#999",
  },
  recommendedSection: {
    marginTop: 24,
  },
  recommendedTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 16,
  },
  productCard: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#eaeaea",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  productImage: {
    width: 80,
    height: 80,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
  productImagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: "#d9d9d9",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 12,
    color: "#666",
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  productName: {
    fontSize: 16,
    color: "#333",
    lineHeight: 22,
    marginBottom: 4,
    fontWeight: "500",
  },
  productPrice: {
    fontSize: 14,
    color: "#FF6B9D",
    fontWeight: "600",
    marginBottom: 2,
  },
  productBrand: {
    fontSize: 12,
    color: "#999",
  },
});
