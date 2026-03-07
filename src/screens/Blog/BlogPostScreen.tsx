import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Platform,
  StatusBar,
  useWindowDimensions,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import RenderHtml from "react-native-render-html";

export default function BlogViewScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { width } = useWindowDimensions();

  // Accept parameter or use fallback dummy data
  const passedItem = (route.params as any)?.item || {};
  const item = {
    ...passedItem,
    author: passedItem.author || "BuzzFeed",
    authorIcon: passedItem.authorIcon || "https://cdn-icons-png.flaticon.com/512/732/732204.png",
    time: passedItem.time || "11h",
    title: passedItem.title ||
      "Florence Pugh Wore An, Um, Interesting Dress To The Oscars, And Everyone's Making The Same Joke",
    image: passedItem.image ||
      "https://images.unsplash.com/photo-1616091093714-c64882e9ab55?auto=format&fit=crop&w=800",
    content: passedItem.content ||
      "<p>Florence Pugh's Oscars dress has been the talk of the town, and for good reason. The actress stunned on the red carpet in a gown that was... well, let's just say it was unique.</p><h3>The Dress That Broke the Internet</h3><p>Florence's dress featured a bold pattern and an unconventional silhouette that left everyone wondering if it was a fashion statement or a fashion faux pas.</p><h4>Public Reaction</h4><p>Social media exploded with reactions, with many users making jokes about the dress resembling everything from a tablecloth to a shower curtain.</p><ul><li>Some praised Florence for taking a risk and standing out.</li><li>Others couldn't help but laugh at the dress's resemblance to household items.</li></ul><p>Regardless of the opinions, one thing is clear: Florence Pugh's dress will be remembered as one of the most talked-about looks of the Oscars.</p>",
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={{ uri: item.image }} style={styles.heroImage} />
        <View style={styles.contentContainer}>
          <Text style={styles.title}>{item.title}</Text>

          <View style={styles.authorRow}>
            <Image
              source={{ uri: item.authorIcon }}
              style={styles.authorIcon}
            />
            <Text style={styles.authorText}>{item.author}</Text>
            <Text style={styles.timeText}>{item.time}</Text>
          </View>

          <RenderHtml
            contentWidth={width}
            source={{ html: item.content }}
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

          <View style={styles.recommendedSection}>
            <Text style={styles.recommendedTitle}>Sản phẩm được giới thiệu</Text>

            {[1, 2].map((_, index) => (
              <View key={index} style={styles.productCard}>
                <View style={styles.productImagePlaceholder}>
                  <Text style={styles.placeholderText}>placeholder</Text>
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    productName should be 2 lines tall and can be clamp...
                  </Text>
                  <Text style={styles.productPrice}>productPrice</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
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
  },
  productPrice: {
    fontSize: 14,
    color: "#666",
  },
});
