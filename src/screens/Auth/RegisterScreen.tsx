import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Colors } from "../../constants/theme";
import { authApi } from "../../services/api";

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleRegister = async () => {
    // Validate input
    if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Lỗi", "Email không hợp lệ");
      return;
    }

    // Password validation (backend requires 8-30 chars, uppercase, lowercase, digit)
    if (password.length < 8 || password.length > 30) {
      Alert.alert("Lỗi", "Mật khẩu phải có từ 8-30 ký tự");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,30}$/;
    if (!passwordRegex.test(password)) {
      Alert.alert(
        "Lỗi", 
        "Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường và một chữ số"
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);
    try {
      // Register user - backend will send OTP to email
      await authApi.register({
        fullname: fullName.trim(),
        email: email.trim(),
        password: password,
        role: "User",
      });

      // Navigate to email verification screen
      (navigation as any).navigate("VerifyEmail", { 
        email: email.trim(),
        fromRegistration: true 
      });
      
      Alert.alert(
        "Kiểm tra email", 
        "Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra và xác thực tài khoản."
      );
    } catch (error: any) {
      console.error("Registration error:", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        "Đăng ký thất bại. Vui lòng thử lại.";
      Alert.alert("Đăng ký thất bại", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={styles.title}>Tạo tài khoản</Text>
            <Text style={styles.subtitle}>
              Vui lòng điền các thông tin dưới đây để đăng ký tài khoản mới của bạn.
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Họ và tên"
                placeholderTextColor="#999"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

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
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Xác nhận mật khẩu"
                placeholderTextColor="#999"
                value={confirmPassword}
                secureTextEntry
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity 
              style={[styles.continueButton, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.continueButtonText}>Đăng ký</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => (navigation as any).replace("Login")}
              style={styles.loginRedirect}
            >
              <Text style={styles.loginRedirectText}>
                Đã có tài khoản?{" "}
                <Text style={styles.linkText}>Đăng nhập</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Bằng việc đăng ký, bạn đồng ý với{" "}
            <Text style={styles.linkText}>Chính sách Bảo mật</Text> và{" "}
            <Text style={styles.linkText}>Điều khoản Sử dụng</Text> của chúng tôi.
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
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  content: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
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
    marginBottom: 24,
    marginTop: 8,
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginRedirect: {
    marginTop: 8,
  },
  loginRedirectText: {
    color: "#666",
    fontSize: 14,
  },
  footer: {
    paddingBottom: 24,
    paddingHorizontal: 24,
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
