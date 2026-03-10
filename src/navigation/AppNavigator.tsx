import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography } from "../constants/theme";
import { useCart } from "../context/CartContext";
import BlogListScreen from "../screens/Blog/BlogListScreen";
import BlogViewScreen from "../screens/Blog/BlogPostScreen";
import LoginScreen from "../screens/Auth/LoginScreen";
import AccountScreen from "../screens/Auth/AccountScreen";
import RegisterScreen from "../screens/Auth/RegisterScreen";
import ProfileScreen from "../screens/Profile/ProfileScreen";

// ── Real screens ─────────────────────────────────────────────────────────────
import HomeScreen from "../screens/HomeScreen";
import CartScreen from "../screens/Cart/CartScreen";
import ProductListScreen from "../screens/Products/ProductListScreen";
import OrderTrackingScreen from "../screens/Orders/OrderTrackingScreen";

// ── Placeholder screens (to be replaced later) ──────────────────────────────

const Placeholder = ({ name }: { name: string }) => (
  <View style={styles.center}>
    <Text style={styles.title}>{name}</Text>
  </View>
);

const ProductDetailScreen = () => <Placeholder name="Chi tiết sản phẩm" />;
const CheckoutScreen = () => <Placeholder name="Thanh toán" />;
const PaymentResultScreen = () => <Placeholder name="Kết quả thanh toán" />;
const ForgotPasswordScreen = () => <Placeholder name="Quên mật khẩu" />;
const VerifyEmailScreen = () => <Placeholder name="Xác thực email" />;
const SupportScreen = () => <Placeholder name="Hỗ trợ" />;

// ── Stack navigators ───────────────────────────────────────────────────

const HomeStack = createStackNavigator();
const ProductsStack = createStackNavigator();
const CartStack = createStackNavigator();
const BlogStack = createStackNavigator();
const AccountStack = createStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{ title: "MomBabyMilk" }}
      />
    </HomeStack.Navigator>
  );
}

function ProductsStackNavigator() {
  return (
    <ProductsStack.Navigator>
      <ProductsStack.Screen
        name="ProductListing"
        component={ProductListScreen}
        options={{ headerShown: false }}
      />
      <ProductsStack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ title: "Chi tiết sản phẩm" }}
      />
    </ProductsStack.Navigator>
  );
}

function CartStackNavigator() {
  return (
    <CartStack.Navigator>
      <CartStack.Screen
        name="CartScreen"
        component={CartScreen}
        options={{ title: "Giỏ hàng" }}
      />
      <CartStack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ title: "Thanh toán" }}
      />
      <CartStack.Screen
        name="PaymentResult"
        component={PaymentResultScreen}
        options={{ title: "Kết quả thanh toán" }}
      />
    </CartStack.Navigator>
  );
}

function BlogStackNavigator() {
  return (
    <BlogStack.Navigator>
      <BlogStack.Screen
        name="BlogList"
        component={BlogListScreen}
        options={{ title: "Blog" }}
      />
      <BlogStack.Screen
        name="BlogPost"
        component={BlogViewScreen}
        options={{
          title: "Bài viết",
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="ellipsis-horizontal" size={24} color="#333" />
            </TouchableOpacity>
          ),
        }}
      />
    </BlogStack.Navigator>
  );
}

function AccountStackNavigator() {
  return (
    <AccountStack.Navigator>
      <AccountStack.Screen
        name="AccountScreen"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <AccountStack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: "Đăng nhập" }}
      />
      <AccountStack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: "Đăng ký" }}
      />
      <AccountStack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ title: "Quên mật khẩu" }}
      />
      <AccountStack.Screen
        name="VerifyEmail"
        component={VerifyEmailScreen}
        options={{ title: "Xác thực email" }}
      />
      <AccountStack.Screen
        name="OrderTracking"
        component={OrderTrackingScreen}
        options={{ headerShown: false }}
      />
      <AccountStack.Screen
        name="Support"
        component={SupportScreen}
        options={{ title: "Hỗ trợ" }}
      />
    </AccountStack.Navigator>
  );
}

// ── Main App Navigator ──────────────────────────────────────────────────────

export default function AppNavigator() {
  const { totalItems } = useCart();

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarStyle: { paddingBottom: 4, height: 56 },
          tabBarIcon: ({ color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap = "ellipse-outline";
            if (route.name === "Home") iconName = "home-outline";
            else if (route.name === "Products") iconName = "grid-outline";
            else if (route.name === "Cart") iconName = "cart-outline";
            else if (route.name === "Blog") iconName = "newspaper-outline";
            else if (route.name === "Account") iconName = "person-outline";
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeStackNavigator}
          options={{ tabBarLabel: "Trang chủ" }}
        />
        <Tab.Screen
          name="Products"
          component={ProductsStackNavigator}
          options={{ tabBarLabel: "Sản phẩm" }}
        />
        <Tab.Screen
          name="Cart"
          component={CartStackNavigator}
          options={{
            tabBarLabel: "Giỏ hàng",
            tabBarBadge: totalItems > 0 ? totalItems : undefined,
          }}
        />
        <Tab.Screen name="Blog" component={BlogStackNavigator} />
        <Tab.Screen
          name="Account"
          component={AccountStackNavigator}
          options={{ tabBarLabel: "Tài khoản" }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semiBold,
    color: Colors.text,
  },
  iconButton: {
    marginRight: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
