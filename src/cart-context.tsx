import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Product, CartItem } from './types';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, selectedSize?: string, selectedColor?: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  saveForLater: (productId: string) => void;
  moveToCart: (productId: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  savedItems: CartItem[];
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('akselling_cart_items');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Save to localStorage whenever cart items change
  useEffect(() => {
    try {
      localStorage.setItem('akselling_cart_items', JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  const addToCart = useCallback((product: Product, quantity = 1, selectedSize?: string, selectedColor?: string) => {
    setItems(prev => {
      const existing = prev.find(
        item =>
          item.product.id === product.id &&
          !item.savedForLater &&
          item.selectedSize === selectedSize &&
          item.selectedColor === selectedColor
      );
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id &&
          !item.savedForLater &&
          item.selectedSize === selectedSize &&
          item.selectedColor === selectedColor
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity, savedForLater: false, selectedSize, selectedColor }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems(prev => prev.filter(item => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  }, []);

  const saveForLater = useCallback((productId: string) => {
    setItems(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, savedForLater: true } : item
      )
    );
  }, []);

  const moveToCart = useCallback((productId: string) => {
    setItems(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, savedForLater: false } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const activeItems = items.filter(item => !item.savedForLater);
  const savedItems = items.filter(item => item.savedForLater);
  const cartCount = activeItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = activeItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        saveForLater,
        moveToCart,
        clearCart,
        cartCount,
        cartTotal,
        savedItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
