import React, { createContext, useCallback, useContext, useReducer } from 'react';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  stock: number;
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD'; item: CartItem }
  | { type: 'REMOVE'; productId: string }
  | { type: 'UPDATE_QTY'; productId: string; quantity: number }
  | { type: 'CLEAR' };

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType>({} as CartContextType);

export const useCart = () => useContext(CartContext);

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD': {
      const existing = state.items.find((i) => i.productId === action.item.productId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === action.item.productId
              ? { ...i, quantity: Math.min(i.quantity + action.item.quantity, i.stock) }
              : i
          ),
        };
      }
      return { items: [...state.items, action.item] };
    }
    case 'REMOVE':
      return { items: state.items.filter((i) => i.productId !== action.productId) };
    case 'UPDATE_QTY':
      return {
        items: state.items.map((i) =>
          i.productId === action.productId ? { ...i, quantity: action.quantity } : i
        ),
      };
    case 'CLEAR':
      return { items: [] };
    default:
      return state;
  }
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  const addItem = useCallback((item: CartItem) => dispatch({ type: 'ADD', item }), []);
  const removeItem = useCallback((productId: string) => dispatch({ type: 'REMOVE', productId }), []);
  const updateQty = useCallback((productId: string, quantity: number) =>
    dispatch({ type: 'UPDATE_QTY', productId, quantity }), []);
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR' }), []);

  const totalItems = state.items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = state.items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items: state.items, totalItems, totalPrice, addItem, removeItem, updateQty, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};
