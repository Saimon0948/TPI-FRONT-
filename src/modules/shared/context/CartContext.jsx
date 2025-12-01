import { createContext, useState, useEffect, useCallback } from 'react';

export const CartContext = createContext();

const CART_KEY = 'cart';

export function CartProvider({ children }) {
  const [cartItemsCount, setCartItemsCount] = useState(0);

  // Actualizar el conteo cuando localStorage cambia
  const updateCartCount = useCallback(() => {
    try {
      const stored = localStorage.getItem(CART_KEY);
      if (stored) {
        const cart = JSON.parse(stored);
        const total = Array.isArray(cart) 
          ? cart.reduce((acc, item) => acc + (item.quantity || 0), 0) 
          : 0;
        setCartItemsCount(total);
      } else {
        setCartItemsCount(0);
      }
    } catch (e) {
      console.error("Error reading cart from localStorage", e);
      setCartItemsCount(0);
    }
  }, []);

  useEffect(() => {
    // Actualizar al montar
    updateCartCount();

    // Escuchar cambios en localStorage
    window.addEventListener('storage', updateCartCount);
    
    // Escuchar evento personalizado desde CustomerHome
    window.addEventListener('cartUpdated', updateCartCount);

    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, [updateCartCount]);

  return (
    <CartContext.Provider value={{ cartItemsCount }}>
      {children}
    </CartContext.Provider>
  );
}
