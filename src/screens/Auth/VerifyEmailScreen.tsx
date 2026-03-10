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
import { useNavigation, useRoute } from "@react-navigation/native";
import { Colors } from "../../constants/theme";
import { authApi } from "../../services/api";

export default function VerifyEmailScreen() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  
  // Get email from navigation params
  const email = (route.params as any)?.email || "";
  const fromRegistration = (route.params as any)?.fromRegistration || false;

  const handleVerifyEmail = async () => {
    // Validate OTP
    if (!otp.trim() || otp.length !== 6) {
      Alert.alert("Lỗi", "Vui lòng nhập mã OTP 6 số");
      return;
    }

    setLoading(true);
    try {
      // Verify email with OTP
      await authApi.verifyEmail({
        email: email,
        otp: otp.trim(),
      });
      
      // Email is now verified, user can log in
      Alert.alert(
        "Xác thực thành công!", 
        "Email của bạn đã được xác thực. Hãy đăng nhập để tiếp tục.",
        [
          {
            text: "Đăng nhập ngay",
            onPress: () => {
              // Navigate to login screen
              (navigation as any).replace('Login');
            }
          }
        ]
      );
    } catch (error: any) {
      console.error("Email verification error:", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        "Xác thực thất bại. Vui lòng kiểm tra lại mã OTP.";
      Alert.alert("Xác thực thất bại", message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      Alert.alert("Lỗi", "Email không hợp lệ");
      return;
    }

    setResending(true);
    try {
      await authApi.resendOtp(email);
      Alert.alert("Thành công", "Mã OTP mới đã được gửi đến email của bạn");
    } catch (error: any) {
      console.error("Resend OTP error:", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        "Không thể gửi lại mã OTP. Vui lòng thử lại.";
      Alert.alert("Lỗi", message);
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Xác thực email</Text>
          <Text style={styles.subtitle}>
            Mã OTP đã được gửi đến email{"\n"}
            <Text style={styles.email}>{email}</Text>
            {"\n"}Vui lòng nhập mã để xác thực tài khoản.
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Nhập mã OTP (6 số)"
              placeholderTextColor="#999"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
          </View>

          <TouchableOpacity 
            style={[styles.continueButton, loading && styles.buttonDisabled]}
            onPress={handleVerifyEmail}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.continueButtonText}>Xác thực</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleResendOtp}
            style={styles.resendButton}
            disabled={resending}
          >
            <Text style={styles.resendText}>
              {resending ? "Đang gửi..." : "Gửi lại mã OTP"}
            </Text>
          </TouchableOpacity>

          {!fromRegistration && (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Text style={styles.backText}>Quay lại</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Mã OTP có hiệu lực trong 10 phút.{"\n"}
            Vui lòng kiểm tra cả thư mục spam nếu không thấy email.
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
  email: {
    fontWeight: "600",
    color: Colors.primary,
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
    fontSize: 20,
    color: "#000",
    textAlign: "center",
    letterSpacing: 8,
    fontWeight: "600",
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
  resendButton: {
    marginVertical: 8,
  },
  resendText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  backButton: {
    marginTop: 16,
  },
  backText: {
    color: "#666",
    fontSize: 14,
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
