import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography } from '../constants/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

const SearchBar = React.memo(({ value, onChangeText, placeholder = 'Tìm kiếm sản phẩm...', onClear }: SearchBarProps) => (
  <View style={styles.container}>
    <Ionicons name="search" size={18} color={Colors.textMuted} style={styles.icon} />
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.textMuted}
      returnKeyType="search"
      autoCapitalize="none"
      autoCorrect={false}
      accessibilityLabel="Tìm kiếm"
    />
    {value.length > 0 && (
      <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel="Xóa tìm kiếm">
        <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
      </TouchableOpacity>
    )}
  </View>
));
SearchBar.displayName = 'SearchBar';

export default SearchBar;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    minHeight: 48,
  },
  icon: { marginRight: 2 },
  input: {
    flex: 1,
    fontSize: Typography.size.base,
    color: Colors.text,
    padding: 0,
    margin: 0,
  },
});
