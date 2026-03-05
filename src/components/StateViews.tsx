import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '../constants/theme';

export const LoadingState = React.memo(({ message = 'Đang tải...' }: { message?: string }) => (
  <View style={styles.center}>
    <ActivityIndicator size="large" color={Colors.primary} />
    <Text style={styles.message}>{message}</Text>
  </View>
));
LoadingState.displayName = 'LoadingState';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState = React.memo(({ message = 'Đã có lỗi xảy ra', onRetry }: ErrorStateProps) => (
  <View style={styles.center}>
    <Ionicons name="alert-circle-outline" size={52} color={Colors.error} />
    <Text style={styles.errorText}>{message}</Text>
    {onRetry && (
      <TouchableOpacity style={styles.retryBtn} onPress={onRetry} accessibilityLabel="Thử lại">
        <Text style={styles.retryText}>Thử lại</Text>
      </TouchableOpacity>
    )}
  </View>
));
ErrorState.displayName = 'ErrorState';

export const EmptyState = React.memo(({ message = 'Không có dữ liệu', icon = 'cube-outline' }: { message?: string; icon?: string }) => (
  <View style={styles.center}>
    <Ionicons name={icon as any} size={64} color={Colors.textMuted} />
    <Text style={styles.emptyText}>{message}</Text>
  </View>
));
EmptyState.displayName = 'EmptyState';

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    gap: Spacing.md,
  },
  message: {
    color: Colors.textSecondary,
    fontSize: Typography.size.base,
    marginTop: Spacing.sm,
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.size.base,
    textAlign: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: Typography.size.base,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    marginTop: Spacing.sm,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: {
    color: Colors.white,
    fontWeight: Typography.weight.semiBold,
    fontSize: Typography.size.base,
  },
});
