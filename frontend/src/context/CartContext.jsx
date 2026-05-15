import React, { createContext, useState, useContext } from 'react';
import Swal from 'sweetalert2';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(item => item._id === product._id);
      
      if (existingItem) {
        if (existingItem.quantity < product.stock_actual) {
          return prevCart.map(item =>
            item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
          );
        } else {
          Swal.fire('Stock Insuficiente', 'No hay suficiente stock para agregar más cantidad de este producto.', 'warning');
          return prevCart;
        }
      }
      
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter(item => item._id !== productId));
  };

  const updateQuantity = (productId, amount) => {
    setCart((prevCart) => {
      return prevCart.map(item => {
        if (item._id === productId) {
          const newQuantity = item.quantity + amount;
          if (newQuantity > item.stock_actual) {
            Swal.fire('Stock Insuficiente', 'La cantidad solicitada supera el stock disponible.', 'warning');
            return item;
          }
          if (newQuantity > 0) {
            return { ...item, quantity: newQuantity };
          }
        }
        return item;
      });
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const total = cart.reduce((acc, item) => acc + (item.precio_publico * item.quantity), 0);
  const subtotal = total / 1.16; // El IVA ya está incluido, así que lo extraemos
  const impuestos = total - subtotal; // 16% desglosado

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      subtotal, 
      impuestos, 
      total 
    }}>
      {children}
    </CartContext.Provider>
  );
};
