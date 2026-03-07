import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow, Spacing, Typography } from '../constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info';

interface ToastConfig {
  type?: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

// ─── Singleton ref ────────────────────────────────────────────────────────────

let _show: ((config: ToastConfig) => void) | null = null;

export const toast = {
  success: (title: string, message?: string, duration?: number) =>
    _show?.({ type: 'success', title, message, duration }),
  error: (title: string, message?: string, duration?: number) =>
    _show?.({ type: 'error', title, message, duration }),
  info: (title: string, message?: string, duration?: number) =>
    _show?.({ type: 'info', title, message, duration }),
};

// ─── Config map ───────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<ToastType, {
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  iconColor: string;
}> = {
  success: { icon: 'checkmark-circle', bg: Colors.success, iconColor: Colors.white },
  error:   { icon: 'close-circle',     bg: Colors.error,   iconColor: Colors.white },
  info:    { icon: 'information-circle', bg: Colors.primary, iconColor: Colors.white },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Toast() {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-160)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [config, setConfig] = useState<Required<Omit<ToastConfig, 'message'>> & { message: string }>({
    type: 'success',
    title: '',
    message: '',
    duration: 3000,
  });

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -160,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateY, opacity]);

  const show = useCallback(
    ({ type = 'success', title, message = '', duration = 3000 }: ToastConfig) => {
      if (timerRef.current) clearTimeout(timerRef.current);

      setConfig({ type, title, message, duration });

      // Reset and animate in
      translateY.setValue(-160);
      opacity.setValue(0);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      timerRef.current = setTimeout(hide, duration);
    },
    [translateY, opacity, hide],
  );

  useEffect(() => {
    _show = show;
    return () => {
      _show = null;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [show]);

  const { icon, bg, iconColor } = TYPE_CONFIG[config.type];

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          top: insets.top + Spacing.sm,
          backgroundColor: bg,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={styles.iconWrapper}>
        <Ionicons name={icon} size={26} color={iconColor} />
      </View>
      <View style={styles.textWrapper}>
        <Text style={styles.title} numberOfLines={1}>
          {config.title}
        </Text>
        {!!config.message && (
          <Text style={styles.message} numberOfLines={2}>
            {config.message}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.base,
    right: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    zIndex: 9999,
    ...Shadow.md,
  },
  iconWrapper: {
    marginRight: Spacing.sm,
  },
  textWrapper: {
    flex: 1,
  },
  title: {
    color: Colors.white,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semiBold,
  },
  message: {
    color: Colors.white,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.regular,
    marginTop: 2,
    opacity: 0.9,
  },
});
