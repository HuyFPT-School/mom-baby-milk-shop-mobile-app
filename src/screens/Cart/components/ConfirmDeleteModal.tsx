import React from 'react';
import {
    View,
    Text,
    Image,
    Modal,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography, Shadow } from '../../../constants/theme';

interface Props {
    visible: boolean;
    itemName: string;
    imageUri: string;
    onCancel: () => void;
    onConfirm: () => void;
}

export default function ConfirmDeleteModal({
    visible,
    itemName,
    imageUri,
    onCancel,
    onConfirm,
}: Props) {
    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="trash" size={30} color={Colors.error} />
                    </View>

                    <Text style={styles.title}>Xóa sản phẩm?</Text>

                    <View style={styles.productRow}>
                        {!!imageUri && (
                            <Image
                                source={{ uri: imageUri }}
                                style={styles.productImage}
                                resizeMode="contain"
                            />
                        )}
                        <Text style={styles.productName} numberOfLines={3}>
                            {itemName}
                        </Text>
                    </View>

                    <Text style={styles.desc}>
                        Sản phẩm sẽ bị xóa khỏi giỏ hàng của bạn.
                    </Text>

                    <View style={styles.btns}>
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={onCancel}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.cancelText}>Hủy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.deleteBtn}
                            onPress={onConfirm}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="trash-outline" size={16} color={Colors.white} />
                            <Text style={styles.deleteText}>Xóa</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
    },
    card: {
        width: '100%',
        backgroundColor: Colors.surface,
        borderRadius: Radius.xl,
        padding: Spacing.xl,
        alignItems: 'center',
        ...Shadow.md,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FEF2F2',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    title: {
        fontSize: Typography.size.lg,
        fontWeight: Typography.weight.bold,
        color: Colors.text,
        marginBottom: Spacing.md,
    },
    productRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        width: '100%',
        backgroundColor: Colors.surfaceVariant,
        borderRadius: Radius.md,
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    productImage: {
        width: 52,
        height: 52,
        borderRadius: Radius.sm,
        backgroundColor: Colors.border,
    },
    productName: {
        flex: 1,
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.semiBold,
        color: Colors.text,
        lineHeight: 18,
    },
    desc: {
        fontSize: Typography.size.sm,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: Spacing.xl,
    },
    btns: {
        flexDirection: 'row',
        gap: Spacing.md,
        width: '100%',
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderRadius: Radius.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        alignItems: 'center',
    },
    cancelText: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.semiBold,
        color: Colors.textSecondary,
    },
    deleteBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xs,
        paddingVertical: Spacing.md,
        borderRadius: Radius.md,
        backgroundColor: Colors.error,
    },
    deleteText: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.bold,
        color: Colors.white,
    },
});
