import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { AntDesign, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Colors, Typography } from "../../constants/theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Đăng nhập</Text>
          <Text style={styles.subtitle}>
            Nhập thông tin xác thực để truy cập tài khoản của bạn, hoặc tiếp tục
            bằng một trong các tùy chọn dưới đây.
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Địa chỉ email của bạn"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Mật khẩu"
              placeholderTextColor="#999"
              value={password}
              secureTextEntry
              onChangeText={setPassword}
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity style={styles.continueButton}>
            <Text style={styles.continueButtonText}>Đăng nhập</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => (navigation as any).replace("Register")}
            style={styles.registerRedirect}
          >
            <Text style={styles.registerRedirectText}>
              Chưa có tài khoản?{" "}
              <Text style={styles.linkText}>Đăng ký ngay</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Bằng việc tiếp tục, bạn đồng ý với{" "}
            <Text style={styles.linkText}>Chính sách Bảo mật</Text> của chúng tôi.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#000",
    textAlign: "center",
  },
  continueButton: {
    backgroundColor: Colors.primary,
    width: "100%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 32,
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  registerRedirect: {
    marginTop: 8,
  },
  registerRedirectText: {
    color: "#666",
    fontSize: 14,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 32,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  dividerText: {
    color: "#999",
    paddingHorizontal: 16,
    fontSize: 14,
  },
  appleButton: {
    flexDirection: "row",
    backgroundColor: "#000",
    width: "100%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  appleButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  socialButton: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    width: "100%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  socialIcon: {
    width: 20,
    height: 20,
    textAlign: "center",
  },
  socialButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "500",
  },
  ssoButton: {
    marginTop: 8,
  },
  ssoButtonText: {
    color: "#666",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  footer: {
    paddingBottom: 24,
  },
  footerText: {
    textAlign: "center",
    color: "#999",
    fontSize: 12,
    lineHeight: 18,
  },
  linkText: {
    textDecorationLine: "underline",
    color: "#333",
    fontWeight: "500",
  },
});
