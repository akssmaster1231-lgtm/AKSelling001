import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Product, CartItem } from './types';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, selectedSize?: string, selectedColor?: string) => void;
  removeFromCart: (targetIdOrProductId: string, selectedSize?: string, selectedColor?: string) => void;
  updateQuantity: (targetIdOrProductId: string, quantity: number, selectedSize?: string, selectedColor?: string) => void;
  saveForLater: (targetIdOrProductId: string, selectedSize?: string, selectedColor?: string) => void;
  moveToCart: (targetIdOrProductId: string, selectedSize?: string, selectedColor?: string) => void;
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
        const parsed: CartItem[] = JSON.parse(stored);
        const map = new Map<string, CartItem>();
        parsed.forEach((item, index) => {
          if (!item?.product?.id) return;
          const key = `${item.product.id}_${item.selectedSize || 'std'}_${item.selectedColor || 'std'}_${item.savedForLater ? 'saved' : 'active'}`;
          const existing = map.get(key);
          if (existing) {
            existing.quantity = (existing.quantity || 1) + (item.quantity || 1);
          } else {
            map.set(key, {
              ...item,
              id: item.id || `${item.product.id}_${item.selectedSize || 'std'}_${item.selectedColor || 'std'}_${index}`,
            });
          }
        });
        return Array.from(map.values());
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
      const newItemId = `${product.id}_${selectedSize || 'std'}_${selectedColor || 'std'}_${Date.now()}`;
      return [...prev, { id: newItemId, product, quantity, savedForLater: false, selectedSize, selectedColor }];
    });
  }, []);

  const removeFromCart = useCallback((targetIdOrProductId: string, selectedSize?: string, selectedColor?: string) => {
    setItems(prev =>
      prev.filter(item => {
        if (item.id && item.id === targetIdOrProductId) return false;
        if (selectedSize !== undefined || selectedColor !== undefined) {
          return !(item.product.id === targetIdOrProductId && item.selectedSize === selectedSize && item.selectedColor === selectedColor);
        }
        return item.id !== targetIdOrProductId && item.product.id !== targetIdOrProductId;
      })
    );
  }, []);

  const updateQuantity = useCallback((targetIdOrProductId: string, quantity: number, selectedSize?: string, selectedColor?: string) => {
    setItems(prev =>
      prev.map(item => {
        const isMatch =
          (item.id && item.id === targetIdOrProductId) ||
          (selectedSize !== undefined || selectedColor !== undefined
            ? item.product.id === targetIdOrProductId && item.selectedSize === selectedSize && item.selectedColor === selectedColor
            : item.product.id === targetIdOrProductId);
        return isMatch ? { ...item, quantity: Math.max(1, quantity) } : item;
      })
    );
  }, []);

  const saveForLater = useCallback((targetIdOrProductId: string, selectedSize?: string, selectedColor?: string) => {
    setItems(prev =>
      prev.map(item => {
        const isMatch =
          (item.id && item.id === targetIdOrProductId) ||
          (selectedSize !== undefined || selectedColor !== undefined
            ? item.product.id === targetIdOrProductId && item.selectedSize === selectedSize && item.selectedColor === selectedColor
            : item.product.id === targetIdOrProductId);
        return isMatch ? { ...item, savedForLater: true } : item;
      })
    );
  }, []);

  const moveToCart = useCallback((targetIdOrProductId: string, selectedSize?: string, selectedColor?: string) => {
    setItems(prev =>
      prev.map(item => {
        const isMatch =
          (item.id && item.id === targetIdOrProductId) ||
          (selectedSize !== undefined || selectedColor !== undefined
            ? item.product.id === targetIdOrProductId && item.selectedSize === selectedSize && item.selectedColor === selectedColor
            : item.product.id === targetIdOrProductId);
        return isMatch ? { ...item, savedForLater: false } : item;
      })
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const activeItems = items.filter(item => Boolean(item?.product?.id && !item.savedForLater));
  const savedItems = items.filter(item => Boolean(item?.product?.id && item.savedForLater));
  const cartCount = activeItems.reduce((sum, item) => sum + Math.max(1, item.quantity || 1), 0);
  const cartTotal = activeItems.reduce((sum, item) => sum + (item.product?.price || 0) * Math.max(1, item.quantity || 1), 0);

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
