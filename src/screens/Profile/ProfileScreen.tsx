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
  ActivityIndicator,
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
import { pointApi, userApi } from "../../services/api";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = SCREEN_WIDTH * 0.72;

type Tab = "profile" | "password" | "orders" | "points" | "vouchers";
type Gender = "male" | "female" | "other" | null;

const formatDateOfBirth = (value?: string) => {
  if (!value) return "";
  if (value.includes("/")) return value;

  const isoDate = value.slice(0, 10);
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
};

const toApiDate = (value: string) => {
  if (!value.trim()) return "";
  const normalized = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }

  const parts = normalized.split("/");
  if (parts.length !== 3) return "";

  const [day, month, year] = parts;
  if (!day || !month || !year) return "";
  if (year.length !== 4) return "";

  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(y)) {
    return "";
  }
  if (d < 1 || d > 31 || m < 1 || m > 12) return "";

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

interface PointHistoryItem {
  _id?: string;
  points: number;
  type?: string;
  description?: string;
  createdAt?: string;
}

interface RewardItem {
  _id: string;
  title?: string;
  name?: string;
  pointsRequired?: number;
  pointsCost?: number;
  description?: string;
}

interface UserVoucherItem {
  _id?: string;
  code?: string;
  voucherCode?: string;
  title?: string;
  name?: string;
  description?: string;
  quantity?: number;
  expiresAt?: string;
  expiryDate?: string;
}

const normalizeVoucherItem = (raw: any): UserVoucherItem => {
  const nestedVoucher =
    raw?.voucher ?? raw?.voucherId ?? raw?.voucherData ?? raw;

  return {
    _id:
      raw?._id ||
      raw?.id ||
      nestedVoucher?._id ||
      nestedVoucher?.id ||
      nestedVoucher?.voucherId,
    code: nestedVoucher?.code || raw?.code || raw?.voucherCode,
    voucherCode: raw?.voucherCode || nestedVoucher?.voucherCode,
    title: nestedVoucher?.title || raw?.title,
    name: nestedVoucher?.name || raw?.name,
    description: nestedVoucher?.description || raw?.description,
    quantity: Number(raw?.quantity ?? raw?.count ?? 1),
    expiresAt:
      nestedVoucher?.expiresAt ||
      nestedVoucher?.expiryDate ||
      nestedVoucher?.expiredAt ||
      raw?.expiresAt,
    expiryDate: raw?.expiryDate || nestedVoucher?.expiryDate,
  };
};

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
    label: "Theo dõi đơn hàng",
    group: "TÀI KHOẢN",
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
  const { user, isAuthenticated, logout, changePassword, updateUser } =
    useAuth();

  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [__previewGuest, __setPreviewGuest] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<Gender>(null);
  const [address, setAddress] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  const [pointsLoading, setPointsLoading] = useState(false);
  const [pointsError, setPointsError] = useState("");
  const [pointBalance, setPointBalance] = useState(0);
  const [pointHistory, setPointHistory] = useState<PointHistoryItem[]>([]);
  const [pointRewards, setPointRewards] = useState<RewardItem[]>([]);
  const [redeemingRewardId, setRedeemingRewardId] = useState("");

  const [vouchersLoading, setVouchersLoading] = useState(false);
  const [vouchersError, setVouchersError] = useState("");
  const [myVouchers, setMyVouchers] = useState<UserVoucherItem[]>([]);

  // Populate form fields with user data when available
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setGender(user.gender || null);
      setDob(formatDateOfBirth(user.dateOfBirth));
      setAddress(user.address || "");
    }
  }, [user]);

  const loadPointsData = useCallback(async () => {
    setPointsLoading(true);
    setPointsError("");

    try {
      const [balanceRes, historyRes, rewardsRes] = await Promise.all([
        pointApi.getBalance(),
        pointApi.getHistory(),
        pointApi.getRewards(),
      ]);

      const rawBalance =
        balanceRes?.data?.data?.balance ??
        balanceRes?.data?.balance ??
        balanceRes?.data?.data?.points ??
        balanceRes?.data?.points ??
        0;
      setPointBalance(Number(rawBalance) || 0);

      const rawHistory =
        historyRes?.data?.data ?? historyRes?.data?.history ?? historyRes?.data;
      setPointHistory(Array.isArray(rawHistory) ? rawHistory : []);

      const rawRewards =
        rewardsRes?.data?.data ?? rewardsRes?.data?.rewards ?? rewardsRes?.data;
      setPointRewards(Array.isArray(rawRewards) ? rawRewards : []);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể tải dữ liệu điểm";
      setPointsError(message);
      setPointBalance(0);
      setPointHistory([]);
      setPointRewards([]);
    } finally {
      setPointsLoading(false);
    }
  }, []);

  const loadVouchers = useCallback(async () => {
    setVouchersLoading(true);
    setVouchersError("");

    try {
      const res = await userApi.getMyVouchers();
      const rawList =
        res?.data?.data ?? res?.data?.vouchers ?? res?.data?.items ?? res?.data;
      const vouchers = Array.isArray(rawList)
        ? rawList.map(normalizeVoucherItem)
        : [];
      setMyVouchers(vouchers);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể tải danh sách voucher";
      setVouchersError(message);
      setMyVouchers([]);
    } finally {
      setVouchersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || __previewGuest) return;

    if (activeTab === "points") {
      void loadPointsData();
      return;
    }

    if (activeTab === "vouchers") {
      void loadVouchers();
    }
  }, [
    __previewGuest,
    activeTab,
    isAuthenticated,
    loadPointsData,
    loadVouchers,
  ]);

  const navigate = useCallback(
    (screen: string) => () => navigation.navigate(screen),
    [navigation],
  );

  const handleSelectTab = useCallback(
    (tab: Tab) => {
      if (tab === "orders") {
        navigation.navigate("OrderTracking");
        return;
      }

      setActiveTab(tab);
    },
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
      Alert.alert("Thành công", "Mật khẩu đã được thay đổi thành công", [
        {
          text: "OK",
          onPress: () => {
            // Clear form
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
          },
        },
      ]);
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

  const handleSaveProfile = useCallback(async () => {
    if (!user?._id) return;

    const normalizedDob = toApiDate(dob);
    if (dob.trim() && !normalizedDob) {
      Alert.alert(
        "Ngày sinh không hợp lệ",
        "Vui lòng nhập theo định dạng DD/MM/YYYY",
      );
      return;
    }

    setProfileSaving(true);
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        gender,
        dateOfBirth: normalizedDob,
        address: address.trim(),
      };

      const res = await userApi.update(user._id, payload);
      const updatedPayload =
        res?.data?.data ?? res?.data?.user ?? res?.data ?? {};

      const updatedUser = {
        ...user,
        ...updatedPayload,
        _id: updatedPayload?._id || updatedPayload?.id || user._id,
      };

      updateUser(updatedUser);
      setDob(formatDateOfBirth(updatedUser?.dateOfBirth));
      Alert.alert("Thành công", "Thông tin hồ sơ đã được cập nhật");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể cập nhật hồ sơ";
      Alert.alert("Cập nhật thất bại", message);
    } finally {
      setProfileSaving(false);
    }
  }, [address, dob, gender, name, phone, updateUser, user]);

  const handleRedeemReward = useCallback(
    async (rewardId: string) => {
      if (!rewardId) return;

      setRedeemingRewardId(rewardId);
      try {
        await pointApi.redeemReward(rewardId);
        Alert.alert("Thành công", "Đổi thưởng thành công");
        await Promise.all([loadPointsData(), loadVouchers()]);
      } catch (error: any) {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Không thể đổi thưởng";
        Alert.alert("Đổi thưởng thất bại", message);
      } finally {
        setRedeemingRewardId("");
      }
    },
    [loadPointsData, loadVouchers],
  );

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
    orders: "Theo dõi đơn hàng",
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
            <InputField
              label="Địa chỉ"
              value={address}
              onChangeText={setAddress}
              placeholder="Nhập địa chỉ của bạn"
            />

            <TouchableOpacity
              style={[styles.saveBtn, profileSaving && styles.saveBtnDisabled]}
              onPress={handleSaveProfile}
              disabled={profileSaving}
              activeOpacity={0.85}
            >
              <Text style={styles.saveBtnText}>
                {profileSaving ? "Đang lưu..." : "Lưu"}
              </Text>
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
              Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và
              số
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
      case "points":
        return (
          <>
            <Text style={styles.formSubtitle}>
              Theo dõi điểm thưởng và đổi quà ngay trên tài khoản của bạn
            </Text>

            {pointsLoading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={Colors.primary} size="large" />
              </View>
            ) : pointsError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={20} color={Colors.error} />
                <Text style={styles.errorText}>{pointsError}</Text>
              </View>
            ) : (
              <>
                <View style={styles.pointsBalanceCard}>
                  <Text style={styles.pointsBalanceLabel}>Điểm hiện có</Text>
                  <Text style={styles.pointsBalanceValue}>
                    {pointBalance.toLocaleString("vi-VN")}
                  </Text>
                </View>

                <Text style={styles.listSectionTitle}>
                  Phần thưởng khả dụng
                </Text>
                {pointRewards.length === 0 ? (
                  <Text style={styles.emptyText}>Hiện chưa có phần thưởng</Text>
                ) : (
                  pointRewards.map((reward) => {
                    const rewardId = reward?._id || "";
                    const pointCost = Number(
                      reward.pointsRequired ?? reward.pointsCost ?? 0,
                    );
                    const title = reward.title || reward.name || "Phần thưởng";
                    const canRedeem = pointBalance >= pointCost && !!rewardId;

                    return (
                      <View key={rewardId || title} style={styles.rewardRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.rewardTitle}>{title}</Text>
                          <Text style={styles.rewardMeta}>
                            {pointCost.toLocaleString("vi-VN")} điểm
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.redeemBtn,
                            (!canRedeem || redeemingRewardId === rewardId) &&
                              styles.redeemBtnDisabled,
                          ]}
                          disabled={
                            !canRedeem || redeemingRewardId === rewardId
                          }
                          onPress={() => handleRedeemReward(rewardId)}
                        >
                          <Text style={styles.redeemBtnText}>
                            {redeemingRewardId === rewardId
                              ? "Đang đổi"
                              : "Đổi"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })
                )}

                <Text style={styles.listSectionTitle}>Lịch sử điểm</Text>
                {pointHistory.length === 0 ? (
                  <Text style={styles.emptyText}>Chưa có giao dịch điểm</Text>
                ) : (
                  pointHistory.slice(0, 10).map((item, index) => {
                    const value = Number(item.points) || 0;
                    const isPlus = value > 0;
                    return (
                      <View
                        key={item._id || `${index}`}
                        style={styles.historyRow}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.historyTitle}>
                            {item.description || "Giao dịch điểm"}
                          </Text>
                          <Text style={styles.historyDate}>
                            {item.createdAt
                              ? new Date(item.createdAt).toLocaleDateString(
                                  "vi-VN",
                                )
                              : ""}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.historyValue,
                            { color: isPlus ? "#2E7D32" : Colors.error },
                          ]}
                        >
                          {isPlus ? "+" : ""}
                          {value.toLocaleString("vi-VN")}
                        </Text>
                      </View>
                    );
                  })
                )}
              </>
            )}
          </>
        );
      case "vouchers":
        return (
          <>
            <Text style={styles.formSubtitle}>
              Danh sách voucher hiện có trong tài khoản của bạn
            </Text>

            {vouchersLoading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={Colors.primary} size="large" />
              </View>
            ) : vouchersError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={20} color={Colors.error} />
                <Text style={styles.errorText}>{vouchersError}</Text>
              </View>
            ) : myVouchers.length === 0 ? (
              <View style={styles.emptyTab}>
                <Ionicons
                  name="pricetag-outline"
                  size={64}
                  color={Colors.primaryLight}
                />
                <Text style={styles.emptyTabTitle}>Bạn chưa có voucher</Text>
                <Text style={styles.emptyTabSub}>
                  Hãy đổi điểm hoặc theo dõi chương trình khuyến mãi
                </Text>
              </View>
            ) : (
              myVouchers.map((voucher, index) => {
                const code = voucher.code || voucher.voucherCode || "---";
                const title =
                  voucher.title ||
                  voucher.name ||
                  voucher.description ||
                  "Voucher";
                const quantity = Number(voucher.quantity) || 1;
                const expires = voucher.expiresAt || voucher.expiryDate;

                return (
                  <View
                    key={voucher._id || `${code}-${index}`}
                    style={styles.voucherRow}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.voucherCode}>{code}</Text>
                      <Text style={styles.voucherTitle}>{title}</Text>
                      {expires ? (
                        <Text style={styles.voucherMeta}>
                          Hết hạn:{" "}
                          {new Date(expires).toLocaleDateString("vi-VN")}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.voucherQtyBadge}>
                      <Text style={styles.voucherQtyText}>x{quantity}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </>
        );
      default:
        return (
          <View style={styles.emptyTab}>
            <Ionicons
              name="person-outline"
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
        onSelect={handleSelectTab}
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

  // Loading
  loadingWrap: {
    paddingVertical: Spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
  },

  // Points
  pointsBalanceCard: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: Radius.md,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  pointsBalanceLabel: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  pointsBalanceValue: {
    fontSize: 30,
    color: Colors.primary,
    fontWeight: Typography.weight.bold,
  },
  listSectionTitle: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
  },
  rewardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
  },
  rewardTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semiBold,
    color: Colors.text,
  },
  rewardMeta: {
    marginTop: 2,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  redeemBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  redeemBtnDisabled: {
    backgroundColor: Colors.textMuted,
    opacity: 0.75,
  },
  redeemBtnText: {
    color: Colors.white,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semiBold,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.sm,
  },
  historyTitle: {
    fontSize: Typography.size.sm,
    color: Colors.text,
    fontWeight: Typography.weight.medium,
  },
  historyDate: {
    marginTop: 2,
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
  },
  historyValue: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
  },

  // Vouchers
  voucherRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  voucherCode: {
    fontSize: Typography.size.base,
    color: Colors.primary,
    fontWeight: Typography.weight.bold,
  },
  voucherTitle: {
    marginTop: 2,
    fontSize: Typography.size.sm,
    color: Colors.text,
  },
  voucherMeta: {
    marginTop: 2,
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
  },
  voucherQtyBadge: {
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
  },
  voucherQtyText: {
    color: Colors.primary,
    fontWeight: Typography.weight.bold,
    fontSize: Typography.size.sm,
  },
  emptyText: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
});
