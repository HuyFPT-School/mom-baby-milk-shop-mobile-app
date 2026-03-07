import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { Colors } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish?: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 55,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }),
      ]).start();
    });

    const timer = setTimeout(() => {
      onFinish?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#E58FAA" />

      {/* Logo circle */}
      <Animated.View
        style={[
          styles.logoWrapper,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
      >
        <View style={styles.logoCircle}>
          <Image
            source={require('../../../assets/LogoLogin.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      </Animated.View>

      {/* NURA + tagline */}
      <Animated.View
        style={[
          styles.textBlock,
          { opacity: textOpacity, transform: [{ translateY: textTranslateY }] },
        ]}
      >
        <Text style={styles.appName}>NURA</Text>
        <Text style={styles.tagline}>MOM & BABY MILK</Text>
      </Animated.View>
    </View>
  );
}

const CIRCLE_SIZE = width * 0.52;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E58FAA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Logo ── */
  logoWrapper: {
    alignItems: 'center',
  },
  logoCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
   
    alignItems: 'center',
    justifyContent: 'center',
    // shadow so circle floats like in the design
    shadowColor: '#b05575',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 18,
  },
  logoImage: {
    width: CIRCLE_SIZE * 2.0,
    height: CIRCLE_SIZE * 2.0,
  },

  /* ── Text ── */
  textBlock: {
    alignItems: 'center',
    marginTop: CIRCLE_SIZE * 0.25,
  },
  appName: {
    fontSize: width * 0.26,   // ~100px on a 390px wide phone — fills the screen like the mockup
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 6,
    lineHeight: width * 0.30,
    includeFontPadding: false,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 4.5,
    textAlign: 'center',
    marginTop: 4,
  },
});