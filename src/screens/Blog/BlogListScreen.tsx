import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { blogApi } from "../../services/api";
import type { Blog } from "../../types";

interface BlogListItem extends Blog {
  authorIcon: string;
  time: string;
  featured: boolean;
}

export default function BlogListScreen() {
  const navigation = useNavigation<any>();
  const [blogs, setBlogs] = useState<BlogListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await blogApi.getAll();
      const data = response.data.data || response.data;
      
      // Transform API data to match UI requirements
      const transformedBlogs: BlogListItem[] = data.map((blog: Blog, index: number) => ({
        ...blog,
        id: blog._id,
        authorIcon: "https://cdn-icons-png.flaticon.com/512/732/732204.png",
        time: formatRelativeTime(blog.createdAt),
        featured: index === 0, // First blog is featured
      }));
      
      setBlogs(transformedBlogs);
    } catch (err: any) {
      console.error("Error fetching blogs:", err);
      setError(err.message || "Failed to load blogs");
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

  const renderItem = ({ item }: { item: BlogListItem }) => {
    if (item.featured) {
      return (
        <View>
          <TouchableOpacity
            style={styles.featuredContainer}
            onPress={() => navigation.navigate("BlogPost", { blogId: item._id })}
          >
            <Image source={{ uri: item.image }} style={styles.featuredImage} />
            
            <Text style={styles.featuredTitle}>{item.title}</Text>
            <View style={styles.authorRow}>
              <Image
                source={{ uri: item.authorIcon }}
                style={styles.authorIcon}
              />
              <Text style={styles.authorText}>{item.author}</Text>
              <Text style={styles.timeText}>{item.time}</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />
        </View>
      );
    }

    return (
      <View>
        <TouchableOpacity
          style={styles.listItem}
          onPress={() => navigation.navigate("BlogPost", { blogId: item._id })}
        >
          <View style={styles.listContent}>
            <Text style={styles.listTitle} numberOfLines={3}>
              {item.title}
            </Text>
            <View style={styles.authorRow}>
              <Image
                source={{ uri: item.authorIcon }}
                style={styles.authorIcon}
              />
              <Text style={styles.authorText}>{item.author}</Text>
              <Text style={styles.timeText}>{item.time}</Text>
            </View>
          </View>
          <Image source={{ uri: item.image }} style={styles.listImage} />
        </TouchableOpacity>
        <View style={styles.divider} />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B9D" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchBlogs}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={blogs}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={styles.headerTitle}>Bài viết mới nhất</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
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
  list: {
    padding: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#1a1a1a",
  },
  featuredContainer: {
    paddingBottom: 16,
  },
  featuredImage: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "#f0f0f0",
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  authorIcon: {
    width: 20,
    height: 20,
    borderRadius: 4,
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
  featuredTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    lineHeight: 24,
    marginBottom: 12,
  },
  readsText: {
    fontSize: 14,
    color: "#999",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  listContent: {
    flex: 1,
    paddingRight: 16,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a1a",
    lineHeight: 22,
    marginBottom: 8,
  },
  listImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
  },
});
