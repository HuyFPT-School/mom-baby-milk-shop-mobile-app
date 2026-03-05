export const Colors = {
  primary: '#E91E8C',
  primaryLight: '#FF6BB5',
  primaryDark: '#C2185B',
  secondary: '#FF9800',
  secondaryLight: '#FFB74D',
  background: '#FFF8FC',
  surface: '#FFFFFF',
  surfaceVariant: '#FFF0F7',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#F3E8F0',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.5)',
  cardShadow: 'rgba(233,30,140,0.12)',
};

export const Typography = {
  fontFamily: {
    regular: undefined, // uses system font
    medium: undefined,
    bold: undefined,
  },
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    xxl: 28,
    xxxl: 32,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const Shadow = {
  sm: {
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 6,
  },
};

export const ITEM_HEIGHT = 240; // fixed height for product cards in grid
