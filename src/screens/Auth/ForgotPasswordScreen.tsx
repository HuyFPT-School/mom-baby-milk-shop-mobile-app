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
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Colors } from "../../constants/theme";
import { authApi } from "../../services/api";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const navigation = useNavigation();

  const validateEmail = (value: string) => {
    setEmail(value);
    setEmailError("");
    
    if (value && !value.trim()) {
      setEmailError("Email không được để trống");
    } else if (value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        setEmailError("Email không hợp lệ");
      }
    }
  };

  const handleSendOtp = async () => {
    // Clear previous errors
    setEmailError("");

    // Validate input
    if (!email.trim()) {
      setEmailError("Vui lòng nhập email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Email không hợp lệ");
      return;
    }

    setLoading(true);
    try {
      // Request password reset OTP (backend sends email)
      await authApi.forgetPassword(email.trim());
      
      // Navigate to reset password screen with email
      (navigation as any).navigate("ResetPassword", { 
        email: email.trim() 
      });
      
      Alert.alert(
        "Kiểm tra email",
        "Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra và nhập mã để đặt lại mật khẩu."
      );
    } catch (error: any) {
      console.error("Forgot password error:", error);
      // Backend returns same response regardless of email existence (security)
      const message =
        error.response?.data?.message ||
        error.message ||
        "Không thể gửi mã OTP. Vui lòng thử lại.";
      Alert.alert("Lỗi", message);
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
          <MaterialCommunityIcons 
            name="lock-reset" 
            size={64} 
            color={Colors.primary} 
            style={styles.icon}
          />
          
          <Text style={styles.title}>Quên mật khẩu?</Text>
          <Text style={styles.subtitle}>
            Nhập địa chỉ email của bạn và chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu.
          </Text>

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
              autoFocus
            />
            {emailError ? (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle-outline" size={14} color="#d32f2f" />
                <Text style={styles.errorText}>{emailError}</Text>
              </View>
            ) : null}
          </View>

          <TouchableOpacity 
            style={[styles.continueButton, loading && styles.buttonDisabled]}
            onPress={handleSendOtp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.continueButtonText}>Gửi mã OTP</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>
              <Text style={styles.linkText}>Quay lại đăng nhập</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Bạn sẽ nhận được email chứa mã OTP để đặt lại mật khẩu.{"\n"}
            Mã có hiệu lực trong 15 phút.
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
  icon: {
    marginBottom: 24,
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
    paddingHorizontal: 8,
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
  continueButton: {
    backgroundColor: Colors.primary,
    width: "100%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  backButton: {
    marginTop: 8,
  },
  backText: {
    color: "#666",
    fontSize: 14,
  },
  linkText: {
    textDecorationLine: "underline",
    color: Colors.primary,
    fontWeight: "600",
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
});
