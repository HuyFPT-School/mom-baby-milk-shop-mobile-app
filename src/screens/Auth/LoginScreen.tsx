import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AntDesign, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Colors, Typography } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const navigation = useNavigation();
  const { login } = useAuth();

  const validateEmail = (value: string) => {
    setEmail(value);
    setEmailError("");
    setGeneralError("");
    
    if (value && !value.trim()) {
      setEmailError("Email không được để trống");
    } else if (value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        setEmailError("Email không hợp lệ");
      }
    }
  };

  const validatePassword = (value: string) => {
    setPassword(value);
    setPasswordError("");
    setGeneralError("");
    
    if (value && value.length < 6) {
      setPasswordError("Mật khẩu phải có ít nhất 6 ký tự");
    }
  };

  const handleLogin = async () => {
    // Clear previous errors
    setEmailError("");
    setPasswordError("");
    setGeneralError("");

    let hasError = false;

    // Validate input
    if (!email.trim()) {
      setEmailError("Vui lòng nhập email");
      hasError = true;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailError("Email không hợp lệ");
        hasError = true;
      }
    }

    if (!password.trim()) {
      setPasswordError("Vui lòng nhập mật khẩu");
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError("Mật khẩu phải có ít nhất 6 ký tự");
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      // Navigate back to account screen after successful login
      (navigation as any).goBack();
    } catch (error: any) {
      console.error("Login error:", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
      setGeneralError(message);
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
        <View style={styles.content}>
          <Text style={styles.title}>Đăng nhập</Text>
          <Text style={styles.subtitle}>
            Nhập thông tin xác thực để truy cập tài khoản của bạn, hoặc tiếp tục
            bằng một trong các tùy chọn dưới đây.
          </Text>

          {generalError ? (
            <View style={styles.generalErrorContainer}>
              <MaterialCommunityIcons name="alert-circle" size={20} color="#d32f2f" />
              <Text style={styles.generalErrorText}>{generalError}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, emailError && styles.inputError]}
              placeholder="Địa chỉ email của bạn"
              placeholderTextColor="#999"
              value={email}
              onChangeText={validateEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {emailError ? (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle-outline" size={14} color="#d32f2f" />
                <Text style={styles.errorText}>{emailError}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, passwordError && styles.inputError]}
              placeholder="Mật khẩu"
              placeholderTextColor="#999"
              value={password}
              secureTextEntry
              onChangeText={validatePassword}
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {passwordError ? (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle-outline" size={14} color="#d32f2f" />
                <Text style={styles.errorText}>{passwordError}</Text>
              </View>
            ) : null}
          </View>

          <TouchableOpacity 
            style={[styles.continueButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.continueButtonText}>Đăng nhập</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => (navigation as any).navigate("ForgotPassword")}
            style={styles.forgotPasswordButton}
          >
            <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
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
  inputError: {
    borderColor: "#d32f2f",
    borderWidth: 1.5,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    paddingHorizontal: 4,
  },
  errorText: {
    color: "#d32f2f",
    fontSize: 13,
    marginLeft: 4,
  },
  generalErrorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffebee",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: "100%",
  },
  generalErrorText: {
    color: "#d32f2f",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    width: "100%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  forgotPasswordButton: {
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
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
