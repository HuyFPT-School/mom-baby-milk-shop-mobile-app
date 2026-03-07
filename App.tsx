import 'react-native-gesture-handler';
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import AppNavigator from './src/navigation/AppNavigator';
import Toast from './src/components/Toast';
import SplashScreen from './src/screens/Splash/SplashScreen';

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  if (!splashDone) {
    return <SplashScreen onFinish={() => setSplashDone(true)} />;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <AppNavigator />
          <StatusBar style="auto" />
          <Toast />
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}