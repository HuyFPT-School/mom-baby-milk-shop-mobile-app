import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

const DATA = [
  {
    id: "1",
    author: "BuzzFeed",
    authorIcon: "https://cdn-icons-png.flaticon.com/512/732/732204.png", // Placeholder
    time: "11h",
    title:
      "Florence Pugh Wore An, Um, Interesting Dress To The Oscars, And Everyone's Making The Same Joke",
    reads: "503 reads",
    image:
      "https://images.unsplash.com/photo-1616091093714-c64882e9ab55?auto=format&fit=crop&w=800",
    featured: true,
  },
  {
    id: "2",
    author: "BGR",
    authorIcon: "https://cdn-icons-png.flaticon.com/512/732/732204.png", // Placeholder
    time: "9h",
    title:
      "Florence Pugh Wore An, Um, Interesting Dress To The Oscars, And Everyone's Making The Same Joke Florence Pugh Wore An, Um, Interesting Dress To The Oscars, And Everyone's Making The Same Joke",
    reads: "1286 reads",
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400",
    featured: false,
  },
  {
    id: "3",
    author: "BGR",
    authorIcon: "https://cdn-icons-png.flaticon.com/512/732/732204.png", // Placeholder
    time: "9h",
    title:
      "Two of the latest Netflix series with perfect 100% scores on Rotten Tomatoes",
    reads: "1286 reads",
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400",
    featured: false,
  },
];

export default function BlogListScreen() {
  const navigation = useNavigation<any>();

  const renderItem = ({ item }: { item: (typeof DATA)[0] }) => {
    if (item.featured) {
      return (
        <View>
          <TouchableOpacity
            style={styles.featuredContainer}
            onPress={() => navigation.navigate("BlogPost", { item })}
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
          onPress={() => navigation.navigate("BlogPost", { item })}
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

  return (
    <View style={styles.container}>
      <FlatList
        data={DATA}
        keyExtractor={(item) => item.id}
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
