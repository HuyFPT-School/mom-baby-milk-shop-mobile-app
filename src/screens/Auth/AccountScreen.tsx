import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../constants/theme';

export default function AccountScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person-outline" size={40} color={Colors.textMuted} />
        </View>
        <Text style={styles.title}>Chào mừng trở lại!</Text>
        <Text style={styles.subtitle}>Đăng nhập hoặc đăng ký để quản lý tài khoản của bạn.</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.loginButton} 
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginButtonText}>Đăng nhập</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.registerButton} 
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.registerButtonText}>Tạo tài khoản</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.supportContainer}>
         <TouchableOpacity 
          style={styles.supportButton} 
          onPress={() => navigation.navigate('Support')}
        >
           <Ionicons name="help-circle-outline" size={20} color={Colors.textMuted} style={{marginRight: 4}} />
          <Text style={styles.supportButtonText}>Trợ giúp & Hỗ trợ</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 48,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Typography.size.md,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    width: '100%',
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  loginButtonText: {
    color: Colors.background,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semiBold,
  },
  registerButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
    width: '100%',
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  registerButtonText: {
    color: Colors.primary,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semiBold,
  },
  supportContainer: {
      marginTop: 'auto',
      marginBottom: 24,
      alignItems: 'center',
  },
  supportButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
  },
  supportButtonText: {
      color: Colors.textMuted,
      fontSize: Typography.size.sm,
  }
});
