import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CartItem, PreOrderOptions, PaymentOption } from '../types';
import { useAuth } from './AuthContext';

// ─── State & Actions ─────────────────────────────────────────────────────────

interface CartState {
  items: CartItem[];
  hydrated: boolean;
}

type CartAction =
  | { type: 'HYDRATE'; items: CartItem[] }
  | { type: 'ADD'; product: Record<string, unknown>; preOrder?: PreOrderOptions }
  | { type: 'REMOVE'; id: string }
  | { type: 'UPDATE_QTY'; id: string; quantity: number }
  | { type: 'UPDATE_PAYMENT'; id: string; paymentOption: PaymentOption }
  | { type: 'CLEAR' };

// ─── Context Type ────────────────────────────────────────────────────────────

interface CartContextType {
  items: CartItem[];
  hydrated: boolean;
  totalItems: number;
  totalPrice: number;
  totalPayNow: number;
  regularItems: CartItem[];
  preOrderItems: CartItem[];
  addToCart: (product: Record<string, unknown>, preOrder?: PreOrderOptions) => boolean;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updatePaymentOption: (id: string, paymentOption: PaymentOption) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType>({} as CartContextType);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'mom_baby_cart';

function getEffectivePrice(item: CartItem): number {
  return item.sale_price ?? item.price;
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'HYDRATE':
      return { items: action.items, hydrated: true };

    case 'ADD': {
      const p = action.product;
      const id = (p.id as string) || (p._id as string);
      const existing = state.items.find((i) => i.id === id);

      if (existing) {
        const qtyToAdd = action.preOrder?.quantity ?? 1;
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === id
              ? { ...i, quantity: i.quantity + qtyToAdd }
              : i,
          ),
        };
      }

      const availableStock =
        (p.quantity as number) || (p.stock as number) || 999;

      const newItem: CartItem = {
        id,
        name: (p.name as string) ?? '',
        price: (p.price as number) ?? 0,
        sale_price: p.sale_price as number | undefined,
        image_url: (p.image_url as string) ?? (p.image as string) ?? '',
        image: (p.image as string) ?? '',
        quantity: action.preOrder?.quantity ?? 1,
        availableStock,
        ...(action.preOrder && {
          isPreOrder: true,
          preOrderType: action.preOrder.preOrderType,
          paymentOption: action.preOrder.paymentOption,
          releaseDate: action.preOrder.releaseDate,
          addedAt: new Date().toISOString(),
        }),
      };

      return { ...state, items: [...state.items, newItem] };
    }

    case 'REMOVE':
      return {
        ...state,
        items: state.items.filter((i) => i.id !== action.id),
      };

    case 'UPDATE_QTY': {
      if (action.quantity < 1) return state;
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id
            ? { ...i, quantity: Math.min(action.quantity, i.availableStock) }
            : i,
        ),
      };
    }

    case 'UPDATE_PAYMENT':
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id
            ? { ...i, paymentOption: action.paymentOption }
            : i,
        ),
      };

    case 'CLEAR':
      return { ...state, items: [] };

    default:
      return state;
  }
}

// ─── Provider ────────────────────────────────────────────────────────────────

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    hydrated: false,
  });
  const isFirstRender = useRef(true);

  // Hydrate from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          dispatch({ type: 'HYDRATE', items: JSON.parse(raw) });
        } else {
          dispatch({ type: 'HYDRATE', items: [] });
        }
      } catch {
        dispatch({ type: 'HYDRATE', items: [] });
      }
    })();
  }, []);

  // Persist to AsyncStorage on every change (skip first render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!state.hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.items)).catch(
      () => { },
    );
  }, [state.items, state.hydrated]);

  // ── Dispatchers ──

  const addToCart = useCallback(
    (product: Record<string, unknown>, preOrder?: PreOrderOptions) => {
      if (!isAuthenticated) return false;
      dispatch({ type: 'ADD', product, preOrder });
      return true;
    },
    [isAuthenticated],
  );

  const removeFromCart = useCallback(
    (id: string) => dispatch({ type: 'REMOVE', id }),
    [],
  );

  const updateQuantity = useCallback(
    (id: string, quantity: number) =>
      dispatch({ type: 'UPDATE_QTY', id, quantity }),
    [],
  );

  const updatePaymentOption = useCallback(
    (id: string, paymentOption: PaymentOption) =>
      dispatch({ type: 'UPDATE_PAYMENT', id, paymentOption }),
    [],
  );

  const clearCart = useCallback(() => dispatch({ type: 'CLEAR' }), []);

  // ── Derived values ──

  const totalItems = state.items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = state.items.reduce(
    (s, i) => s + getEffectivePrice(i) * i.quantity,
    0,
  );
  const totalPayNow = state.items
    .filter((i) => !i.isPreOrder || i.paymentOption === 'PAY_NOW')
    .reduce((s, i) => s + getEffectivePrice(i) * i.quantity, 0);

  const regularItems = state.items.filter((i) => !i.isPreOrder);
  const preOrderItems = state.items.filter((i) => i.isPreOrder);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        hydrated: state.hydrated,
        totalItems,
        totalPrice,
        totalPayNow,
        regularItems,
        preOrderItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        updatePaymentOption,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
