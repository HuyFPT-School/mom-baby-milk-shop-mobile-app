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
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Colors } from "../../constants/theme";
import { authApi } from "../../services/api";

export default function ResetPasswordScreen() {
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [otpError, setOtpError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  
  const navigation = useNavigation();
  const route = useRoute();
  
  // Get email from navigation params
  const email = (route.params as any)?.email || "";

  const validateOtp = (value: string) => {
    setOtp(value);
    setOtpError("");
    
    if (value && value.length !== 6) {
      setOtpError("Mã OTP phải có 6 số");
    }
  };

  const validatePassword = (value: string) => {
    setNewPassword(value);
    setPasswordError("");
    
    if (value && (value.length < 8 || value.length > 30)) {
      setPasswordError("Mật khẩu phải có từ 8-30 ký tự");
    } else if (value) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,30}$/;
      if (!passwordRegex.test(value)) {
        setPasswordError("Mật khẩu phải chứa chữ hoa, chữ thường và số");
      }
    }
  };

  const validateConfirmPassword = (value: string) => {
    setConfirmPassword(value);
    setConfirmPasswordError("");
    
    if (value && value !== newPassword) {
      setConfirmPasswordError("Mật khẩu xác nhận không khớp");
    }
  };

  const handleResetPassword = async () => {
    // Clear previous errors
    setOtpError("");
    setPasswordError("");
    setConfirmPasswordError("");

    let hasError = false;

    // Validate OTP
    if (!otp.trim() || otp.length !== 6) {
      setOtpError("Vui lòng nhập mã OTP 6 số");
      hasError = true;
    }

    // Validate password
    if (!newPassword.trim()) {
      setPasswordError("Vui lòng nhập mật khẩu mới");
      hasError = true;
    } else if (newPassword.length < 8 || newPassword.length > 30) {
      setPasswordError("Mật khẩu phải có từ 8-30 ký tự");
      hasError = true;
    } else {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,30}$/;
      if (!passwordRegex.test(newPassword)) {
        setPasswordError("Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường và một chữ số");
        hasError = true;
      }
    }

    // Validate confirm password
    if (!confirmPassword.trim()) {
      setConfirmPasswordError("Vui lòng xác nhận mật khẩu");
      hasError = true;
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError("Mật khẩu xác nhận không khớp");
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setLoading(true);
    try {
      // Reset password with OTP
      await authApi.resetPassword({
        email: email,
        otp: otp.trim(),
        newPassword: newPassword,
      });
      
      Alert.alert(
        "Thành công!",
        "Mật khẩu đã được đặt lại thành công. Hãy đăng nhập với mật khẩu mới.",
        [
          {
            text: "Đăng nhập",
            onPress: () => {
              // Navigate to login screen
              (navigation as any).navigate("Login");
            }
          }
        ]
      );
    } catch (error: any) {
      console.error("Reset password error:", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        "Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại mã OTP.";
      Alert.alert("Lỗi", message);
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
      await authApi.forgetPassword(email);
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
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <MaterialCommunityIcons 
              name="key-variant" 
              size={64} 
              color={Colors.primary} 
              style={styles.icon}
            />
            
            <Text style={styles.title}>Đặt lại mật khẩu</Text>
            <Text style={styles.subtitle}>
              Nhập mã OTP đã gửi đến email{"\n"}
              <Text style={styles.email}>{email}</Text>
              {"\n"}và mật khẩu mới của bạn.
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, otpError && styles.inputError]}
                placeholder="Mã OTP (6 số)"
                placeholderTextColor="#999"
                value={otp}
                onChangeText={validateOtp}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
              {otpError ? (
                <View style={styles.errorContainer}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={14} color="#d32f2f" />
                  <Text style={styles.errorText}>{otpError}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.passwordInputWrapper}>
                <TextInput
                  style={[styles.input, styles.passwordInput, passwordError && styles.inputError]}
                  placeholder="Mật khẩu mới"
                  placeholderTextColor="#999"
                  value={newPassword}
                  secureTextEntry={!showPassword}
                  onChangeText={validatePassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <MaterialCommunityIcons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={24} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? (
                <View style={styles.errorContainer}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={14} color="#d32f2f" />
                  <Text style={styles.errorText}>{passwordError}</Text>
                </View>
              ) : (
                <Text style={styles.hintText}>
                  8-30 ký tự, bao gồm chữ hoa, chữ thường và số
                </Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.passwordInputWrapper}>
                <TextInput
                  style={[styles.input, styles.passwordInput, confirmPasswordError && styles.inputError]}
                  placeholder="Xác nhận mật khẩu mới"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  onChangeText={validateConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <MaterialCommunityIcons 
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                    size={24} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>
              {confirmPasswordError ? (
                <View style={styles.errorContainer}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={14} color="#d32f2f" />
                  <Text style={styles.errorText}>{confirmPasswordError}</Text>
                </View>
              ) : null}
            </View>

            <TouchableOpacity 
              style={[styles.continueButton, loading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.continueButtonText}>Đặt lại mật khẩu</Text>
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
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Mã OTP có hiệu lực trong 15 phút.{"\n"}
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
    fontSize: 16,
    color: "#000",
    textAlign: "center",
  },
  passwordInputWrapper: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    top: 14,
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
  hintText: {
    color: "#999",
    fontSize: 12,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    width: "100%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
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
  resendButton: {
    marginVertical: 8,
  },
  resendText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
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
});
