import React from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography } from '../constants/theme';
import type { HierarchicalCategory } from '../types';

interface CategoryListProps {
    categories: HierarchicalCategory[];
    loading?: boolean;
    onPress?: (category: HierarchicalCategory) => void;
}

const CategoryList = React.memo(
    ({ categories, loading, onPress }: CategoryListProps) => {
        if (loading) {
            return (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                </View>
            );
        }

        if (categories.length === 0) return null;

        return (
            <FlatList
                horizontal
                data={categories}
                keyExtractor={(item) => item._id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.chip}
                        onPress={() => onPress?.(item)}
                        activeOpacity={0.75}
                    >
                        <Ionicons
                            name="grid-outline"
                            size={14}
                            color={Colors.primary}
                        />
                        <Text style={styles.chipText} numberOfLines={1}>
                            {item.name}
                        </Text>
                        {item.subcategories.length > 0 && (
                            <Ionicons
                                name="chevron-forward"
                                size={12}
                                color={Colors.textMuted}
                            />
                        )}
                    </TouchableOpacity>
                )}
            />
        );
    },
);

CategoryList.displayName = 'CategoryList';
export default CategoryList;

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    loaderContainer: {
        paddingVertical: Spacing.lg,
        alignItems: 'center',
    },
    list: {
        paddingHorizontal: Spacing.base,
        gap: Spacing.sm,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.surfaceVariant,
        borderRadius: Radius.full,
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.sm + 2,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    chipText: {
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.medium,
        color: Colors.text,
    },
});
