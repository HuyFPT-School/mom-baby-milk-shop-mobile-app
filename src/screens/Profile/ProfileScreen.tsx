import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {
  Colors,
  Spacing,
  Radius,
  Typography,
  Shadow,
} from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = SCREEN_WIDTH * 0.72;

type Tab =
  | "profile"
  | "password"
  | "orders"
  | "membership"
  | "points"
  | "vouchers";
type Gender = "male" | "female" | "other" | null;

// ─── Input Field ──────────────────────────────────────────────────────────────
const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  editable = true,
  secureTextEntry,
  keyboardType,
}: any) => (
  <View style={inputStyles.wrapper}>
    <Text style={inputStyles.label}>{label}</Text>
    <TextInput
      style={[inputStyles.input, !editable && inputStyles.inputDisabled]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.textMuted}
      editable={editable}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
    />
  </View>
);
const inputStyles = StyleSheet.create({
  wrapper: { marginBottom: Spacing.base },
  label: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    fontWeight: Typography.weight.medium,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: Typography.size.base,
    color: Colors.text,
    minHeight: 48,
  },
  inputDisabled: {
    backgroundColor: Colors.surfaceVariant,
    color: Colors.textSecondary,
  },
});

// ─── Gender Picker ────────────────────────────────────────────────────────────
const GenderPicker = ({
  value,
  onChange,
}: {
  value: Gender;
  onChange: (v: Gender) => void;
}) => (
  <View style={{ marginBottom: Spacing.base }}>
    <Text style={inputStyles.label}>Giới tính</Text>
    <View style={{ flexDirection: "row", gap: Spacing.xl }}>
      {(
        [
          ["male", "Nam"],
          ["female", "Nữ"],
          ["other", "Khác"],
        ] as [Gender, string][]
      ).map(([key, label]) => (
        <TouchableOpacity
          key={key}
          style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
          onPress={() => onChange(key)}
        >
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              borderWidth: 2,
              borderColor: value === key ? Colors.primary : Colors.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {value === key && (
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: Colors.primary,
                }}
              />
            )}
          </View>
          <Text style={{ fontSize: Typography.size.base, color: Colors.text }}>
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

// ─── Drawer Menu ──────────────────────────────────────────────────────────────
const MENU_ITEMS: { tab: Tab; icon: any; label: string; group: string }[] = [
  {
    tab: "profile",
    icon: "person-outline",
    label: "Hồ Sơ",
    group: "TÀI KHOẢN",
  },
  {
    tab: "password",
    icon: "lock-closed-outline",
    label: "Đổi Mật Khẩu",
    group: "TÀI KHOẢN",
  },
  {
    tab: "orders",
    icon: "receipt-outline",
    label: "Đơn Mua",
    group: "TÀI KHOẢN",
  },
  {
    tab: "membership",
    icon: "star-outline",
    label: "Chương trình thành viên",
    group: "NURA MEMBERS",
  },
  {
    tab: "points",
    icon: "gift-outline",
    label: "Đổi điểm",
    group: "NURA MEMBERS",
  },
  {
    tab: "vouchers",
    icon: "pricetag-outline",
    label: "Vouchers",
    group: "NURA MEMBERS",
  },
];

interface DrawerProps {
  visible: boolean;
  activeTab: Tab;
  onSelect: (tab: Tab) => void;
  onClose: () => void;
  user: any;
  avatarUri: string;
  onLogout: () => void;
}

const Drawer = ({
  visible,
  activeTab,
  onSelect,
  onClose,
  user,
  avatarUri,
  onLogout,
}: DrawerProps) => {
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  React.useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : -DRAWER_WIDTH,
      tension: 65,
      friction: 11,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const groups = ["TÀI KHOẢN", "NURA MEMBERS"];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={drawerStyles.overlay} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          drawerStyles.drawer,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        {/* User info top */}
        <View style={drawerStyles.drawerHeader}>
          <Image
            source={{ uri: avatarUri }}
            style={drawerStyles.drawerAvatar}
          />
          <View style={{ flex: 1 }}>
            <Text style={drawerStyles.drawerName} numberOfLines={1}>
              {user?.name}
            </Text>
            <Text style={drawerStyles.drawerEmail} numberOfLines={1}>
              {user?.email}
            </Text>
          </View>
        </View>

        <View style={drawerStyles.drawerDivider} />

        {/* Menu groups */}
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {groups.map((group) => (
            <View key={group}>
              <Text style={drawerStyles.groupLabel}>{group}</Text>
              {MENU_ITEMS.filter((m) => m.group === group).map((item) => (
                <TouchableOpacity
                  key={item.tab}
                  style={[
                    drawerStyles.menuItem,
                    activeTab === item.tab && drawerStyles.menuItemActive,
                  ]}
                  onPress={() => {
                    onSelect(item.tab);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={
                      activeTab === item.tab
                        ? Colors.primary
                        : Colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      drawerStyles.menuLabel,
                      activeTab === item.tab && drawerStyles.menuLabelActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {activeTab === item.tab && (
                    <View style={drawerStyles.activeBar} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>

        {/* Logout */}
        <TouchableOpacity
          style={drawerStyles.logoutItem}
          onPress={onLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={18} color={Colors.error} />
          <Text style={drawerStyles.logoutLabel}>Đăng xuất</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const drawerStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  drawer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: Colors.surface,
    paddingTop: 52,
    paddingBottom: Spacing.xl,
    ...Shadow.md,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
  },
  drawerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
    backgroundColor: Colors.surfaceVariant,
  },
  drawerName: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
  },
  drawerEmail: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  drawerDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  groupLabel: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.textMuted,
    letterSpacing: 1,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
    position: "relative",
  },
  menuItemActive: { backgroundColor: Colors.surfaceVariant },
  menuLabel: {
    flex: 1,
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
  },
  menuLabelActive: {
    color: Colors.primary,
    fontWeight: Typography.weight.semiBold,
  },
  activeBar: {
    position: "absolute",
    right: 0,
    top: 8,
    bottom: 8,
    width: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  logoutItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.sm,
  },
  logoutLabel: {
    fontSize: Typography.size.base,
    color: Colors.error,
    fontWeight: Typography.weight.medium,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, isAuthenticated, logout, changePassword } = useAuth();
  const { totalItems } = useCart();

  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [__previewGuest, __setPreviewGuest] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<Gender>(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Populate form fields with user data when available
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  const navigate = useCallback(
    (screen: string) => () => navigation.navigate(screen),
    [navigation],
  );

  const handleChangePassword = useCallback(async () => {
    // Clear previous errors
    setPasswordError("");

    // Validation
    if (!oldPassword.trim()) {
      setPasswordError("Vui lòng nhập mật khẩu hiện tại");
      return;
    }

    if (!newPassword.trim()) {
      setPasswordError("Vui lòng nhập mật khẩu mới");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Mật khẩu mới phải có ít nhất 8 ký tự");
      return;
    }

    if (newPassword === oldPassword) {
      setPasswordError("Mật khẩu mới phải khác mật khẩu hiện tại");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Xác nhận mật khẩu không khớp");
      return;
    }

    // Password strength validation
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      setPasswordError("Mật khẩu phải có chữ hoa, chữ thường và số");
      return;
    }

    setPasswordLoading(true);

    try {
      await changePassword(oldPassword, newPassword);
      Alert.alert(
        "Thành công",
        "Mật khẩu đã được thay đổi thành công",
        [
          {
            text: "OK",
            onPress: () => {
              // Clear form
              setOldPassword("");
              setNewPassword("");
              setConfirmPassword("");
            },
          },
        ]
      );
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể thay đổi mật khẩu. Vui lòng thử lại";
      setPasswordError(message);
    } finally {
      setPasswordLoading(false);
    }
  }, [oldPassword, newPassword, confirmPassword, changePassword]);

  const handleLogout = useCallback(() => {
    setDrawerOpen(false);
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất không?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  }, [logout]);

  const previewUser = user ?? {
    _id: "preview-id",
    name: "Test User",
    email: "test@example.com",
    phone: "0123456789",
    role: "customer",
    avatar: undefined,
  };
  const avatarUri =
    previewUser?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(previewUser?.name ?? "User")}&background=E91E8C&color=fff&size=200`;

  const __authState = __previewGuest ? false : isAuthenticated;

  // ── Guest ──
  if (!__authState) {
    return (
      <View style={styles.guestContainer}>
        <Ionicons
          name="person-circle-outline"
          size={100}
          color={Colors.primaryLight}
        />
        <Text style={styles.guestTitle}>Chào mừng bạn!</Text>
        <Text style={styles.guestSubtitle}>
          Đăng nhập để quản lý tài khoản của bạn.
        </Text>
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={navigate("Login")}
          activeOpacity={0.85}
        >
          <Text style={styles.loginBtnText}>Đăng nhập</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.registerBtn}
          onPress={navigate("Register")}
          activeOpacity={0.85}
        >
          <Text style={styles.registerBtnText}>Tạo tài khoản mới</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Tab content ──
  const tabTitle: Record<Tab, string> = {
    profile: "Hồ Sơ Của Tôi",
    password: "Đổi Mật Khẩu",
    orders: "Đơn Mua",
    membership: "Chương Trình Thành Viên",
    points: "Đổi Điểm",
    vouchers: "Vouchers",
  };

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <>
            <Text style={styles.formSubtitle}>
              Quản lý thông tin hồ sơ để bảo mật tài khoản
            </Text>

            {/* Avatar */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarCircle}>
                <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
              </View>
              <TouchableOpacity
                style={styles.choosePhotoBtn}
                onPress={() =>
                  Alert.alert("Chọn ảnh", "Tính năng đang phát triển")
                }
              >
                <Text style={styles.choosePhotoBtnText}>Chọn ảnh</Text>
              </TouchableOpacity>
              <Text style={styles.photoHint}>
                Dung lượng file tối đa 1MB.{"\n"}Định dạng JPEG, PNG
              </Text>
            </View>

            <View style={styles.divider} />
            <InputField
              label="Tên"
              value={name}
              onChangeText={setName}
              placeholder="Nhập tên của bạn"
            />
            <InputField
              label="Email"
              value={previewUser?.email ?? ""}
              editable={false}
            />
            <InputField
              label="Số điện thoại"
              value={phone}
              onChangeText={setPhone}
              placeholder="Nhập số điện thoại"
              keyboardType="phone-pad"
            />
            <GenderPicker value={gender} onChange={setGender} />
            <InputField
              label="Ngày sinh"
              value={dob}
              onChangeText={setDob}
              placeholder="DD/MM/YYYY"
            />

            <View style={styles.sectionBlock}>
              <Text style={styles.sectionBlockTitle}>Địa chỉ</Text>
              <Text style={styles.sectionBlockSub}>
                Địa chỉ giao hàng của bạn
              </Text>
              <TouchableOpacity
                style={styles.addAddressBtn}
                onPress={() =>
                  Alert.alert("Địa chỉ", "Tính năng đang phát triển")
                }
              >
                <Ionicons name="add" size={16} color={Colors.white} />
                <Text style={styles.addAddressBtnText}>Thêm địa chỉ</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() =>
                Alert.alert("Đã lưu", "Thông tin đã được cập nhật")
              }
              activeOpacity={0.85}
            >
              <Text style={styles.saveBtnText}>Lưu</Text>
            </TouchableOpacity>
          </>
        );
      case "password":
        return (
          <>
            <Text style={styles.formSubtitle}>
              Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu
            </Text>
            <View style={styles.divider} />
            
            {passwordError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={20} color={Colors.error} />
                <Text style={styles.errorText}>{passwordError}</Text>
              </View>
            ) : null}
            
            <InputField
              label="Mật khẩu hiện tại"
              value={oldPassword}
              onChangeText={(text: string) => {
                setOldPassword(text);
                if (passwordError) setPasswordError("");
              }}
              secureTextEntry
              placeholder="Nhập mật khẩu hiện tại"
            />
            <InputField
              label="Mật khẩu mới"
              value={newPassword}
              onChangeText={(text: string) => {
                setNewPassword(text);
                if (passwordError) setPasswordError("");
              }}
              secureTextEntry
              placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
            />
            <Text style={styles.passwordHint}>
              Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số
            </Text>
            <InputField
              label="Xác nhận mật khẩu mới"
              value={confirmPassword}
              onChangeText={(text: string) => {
                setConfirmPassword(text);
                if (passwordError) setPasswordError("");
              }}
              secureTextEntry
              placeholder="Nhập lại mật khẩu mới"
            />
            <TouchableOpacity
              style={[
                styles.saveBtn,
                passwordLoading && styles.saveBtnDisabled,
              ]}
              onPress={handleChangePassword}
              disabled={passwordLoading}
              activeOpacity={0.85}
            >
              <Text style={styles.saveBtnText}>
                {passwordLoading ? "Đang xử lý..." : "Xác nhận"}
              </Text>
            </TouchableOpacity>
          </>
        );
      default:
        const emptyIcons: Record<string, any> = {
          orders: "receipt-outline",
          membership: "star-outline",
          points: "gift-outline",
          vouchers: "pricetag-outline",
        };
        return (
          <View style={styles.emptyTab}>
            <Ionicons
              name={emptyIcons[activeTab]}
              size={64}
              color={Colors.primaryLight}
            />
            <Text style={styles.emptyTabTitle}>{tabTitle[activeTab]}</Text>
            <Text style={styles.emptyTabSub}>
              Tính năng đang được phát triển
            </Text>
          </View>
        );
    }
  };

  return (
    <>
      <Drawer
        visible={drawerOpen}
        activeTab={activeTab}
        onSelect={setActiveTab}
        onClose={() => setDrawerOpen(false)}
        user={previewUser}
        avatarUri={avatarUri}
        onLogout={handleLogout}
      />
      <SafeAreaView
        style={{ flex: 1, backgroundColor: Colors.primary }}
        edges={["top"]}
      >
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            {/* Hamburger */}
            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => setDrawerOpen(true)}
              activeOpacity={0.8}
            >
              <View style={styles.bar} />
              <View style={[styles.bar, { width: 16 }]} />
              <View style={styles.bar} />
            </TouchableOpacity>

            {/* Avatar + name centered */}
            <View style={styles.headerCenter}>
              <Image source={{ uri: avatarUri }} style={styles.headerAvatar} />
              <View>
                <Text style={styles.headerName}>{previewUser?.name}</Text>
                <Text style={styles.headerRole}>
                  {previewUser?.role === "Admin"
                    ? "Quản trị viên"
                    : previewUser?.role === "Staff"
                    ? "Nhân viên"
                    : "Khách hàng"}
                </Text>
              </View>
            </View>

            {/* DEV toggle */}
            <TouchableOpacity
              onPress={() => __setPreviewGuest(true)}
            ></TouchableOpacity>
          </View>

          {/* Active tab breadcrumb */}
          <View style={styles.breadcrumb}>
            <Ionicons name="person-outline" size={14} color={Colors.primary} />
            <Text style={styles.breadcrumbText}>{tabTitle[activeTab]}</Text>
          </View>

          {/* Content card */}
          <View style={styles.card}>
            <Text style={styles.formTitle}>{tabTitle[activeTab]}</Text>
            {renderContent()}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Guest
  guestContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xxl,
  },
  guestTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
  },
  guestSubtitle: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  loginBtn: {
    width: "100%",
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    alignItems: "center",
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  loginBtnText: {
    color: Colors.white,
    fontWeight: Typography.weight.bold,
    fontSize: Typography.size.base,
  },
  registerBtn: {
    width: "100%",
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  registerBtnText: {
    color: Colors.primary,
    fontWeight: Typography.weight.semiBold,
    fontSize: Typography.size.base,
  },
  devToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#666",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: Spacing.xl,
  },
  devToggleText: { color: "#fff", fontSize: 11, fontWeight: "600" },

  // Header
  header: {
    backgroundColor: Colors.primary,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.base,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuBtn: { gap: 5, padding: 4 },
  bar: {
    width: 22,
    height: 2.5,
    backgroundColor: Colors.white,
    borderRadius: 2,
  },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.8)",
    backgroundColor: Colors.surfaceVariant,
  },
  headerName: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.white,
  },
  headerRole: {
    fontSize: Typography.size.xs,
    color: "rgba(255,255,255,0.8)",
    marginTop: 1,
  },
  devToggleSmall: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Breadcrumb
  breadcrumb: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  breadcrumbText: {
    fontSize: Typography.size.sm,
    color: Colors.primary,
    fontWeight: Typography.weight.semiBold,
  },

  // Card
  card: {
    marginHorizontal: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    ...Shadow.sm,
  },
  formTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.base,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Spacing.base,
  },

  // Avatar in form
  avatarSection: { alignItems: "center", marginBottom: Spacing.base },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: "hidden",
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  avatarImg: { width: "100%", height: "100%" },
  choosePhotoBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  choosePhotoBtnText: {
    fontSize: Typography.size.sm,
    color: Colors.text,
    fontWeight: Typography.weight.medium,
  },
  photoHint: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },

  // Address block
  sectionBlock: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: Radius.md,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  sectionBlockTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
    marginBottom: 2,
  },
  sectionBlockSub: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  addAddressBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    alignSelf: "flex-start",
  },
  addAddressBtnText: {
    color: Colors.white,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semiBold,
  },

  // Save
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.sm,
    ...Shadow.sm,
  },
  saveBtnDisabled: {
    backgroundColor: Colors.textMuted,
    opacity: 0.6,
  },
  saveBtnText: {
    color: Colors.white,
    fontWeight: Typography.weight.bold,
    fontSize: Typography.size.base,
  },

  // Error banner
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "#FFEBEE",
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.base,
  },
  errorText: {
    flex: 1,
    fontSize: Typography.size.sm,
    color: Colors.error,
    lineHeight: 20,
  },

  // Password hint
  passwordHint: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    marginTop: -Spacing.xs,
    marginBottom: Spacing.base,
    lineHeight: 18,
  },

  // Empty
  emptyTab: { alignItems: "center", paddingVertical: Spacing.xxxl },
  emptyTabTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
    marginTop: Spacing.base,
  },
  emptyTabSub: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
});
