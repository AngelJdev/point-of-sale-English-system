import React, { useState, useEffect } from 'react';
import axios from '../config/axios';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { Trash2, Plus, Minus, CreditCard, Banknote, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import ProductCard from '../components/ProductCard';
import SuccessModal from '../components/SuccessModal';
import { useCart } from '../context/CartContext';
import './POS.css';

const POS = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Estados para procesar el pago
  const [payMethod, setPayMethod] = useState('Efectivo');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const { cart, removeFromCart, updateQuantity, clearCart, subtotal, impuestos, total } = useCart();

  const fetchProducts = async (term = '', page = 1) => {
    setLoading(true);
    try {
      const response = await axios.get(`/products?page=${page}&limit=12&search=${term}`);
      setSearchResults(response.data.products);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Error al buscar productos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Búsqueda en tiempo real con debounce
  useEffect(() => {
    setCurrentPage(1);
    const timeoutId = setTimeout(() => fetchProducts(searchTerm, 1), 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchProducts(searchTerm, newPage);
    }
  };

  // Manejador del cobro
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    // Confirmación previa de SweetAlert2
    const confirmResult = await Swal.fire({
      title: '¿Confirmar Venta?',
      html: `Se cobrará un total de <b>$${total.toFixed(2)}</b> con <b>${payMethod}</b>.<br><br>¿El pedido es correcto?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, cobrar ahora',
      cancelButtonText: 'Revisar pedido'
    });

    if (!confirmResult.isConfirmed) return;

    setIsProcessing(true);
    
    try {
      const saleData = {
        items: cart.map(item => ({
          producto_id: item._id,
          cantidad: item.quantity,
          precio: item.precio_publico
        })),
        subtotal,
        impuestos,
        total,
        metodo_pago: payMethod
      };

      // Mandar la venta a Node.js
      await axios.post('/sales', saleData);
      
      toast.success('Venta registrada correctamente');
      
      // Mostrar Modal
      setShowSuccessModal(true);
    } catch (error) {
      Swal.fire('Error de Venta', error.response?.data?.message || 'Ocurrió un error al procesar el cobro.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Botón "Nuevo Ticket" en el modal
  const handleNewTicket = () => {
    clearCart();
    setShowSuccessModal(false);
    setSearchTerm(''); // Limpia visualmente el buscador
    setCurrentPage(1);
    fetchProducts('', 1); // Fuerza la recarga ignorando el estado anterior para ver el stock actualizado
  };

  return (
    <div className="pos-layout">
      {/* Modal de Éxito Flotante */}
      <SuccessModal 
        isOpen={showSuccessModal} 
        total={total} 
        subtotal={subtotal}
        impuestos={impuestos}
        cart={cart}
        payMethod={payMethod}
        onNewTicket={handleNewTicket} 
      />

      {/* Columna Izquierda: Carrito */}
      <div className="pos-cart-panel">
        <div className="panel-header">
          <h2 className="panel-title">Venta Actual</h2>
          <span className="cart-count">{cart.length} ítems</span>
        </div>
        
        <div className="cart-items-container">
          {cart.length === 0 ? (
            <div className="empty-cart-message">
              <ShoppingCart size={80} className="empty-icon" />
              <p>El carrito está vacío.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item._id} className="cart-item">
                <div className="cart-item-info">
                  <h4>{item.nombre}</h4>
                  <span className="cart-item-price">${item.precio_publico.toFixed(2)} c/u</span>
                </div>
                
                <div className="cart-item-actions">
                  <div className="cart-item-controls">
                    <button onClick={() => updateQuantity(item._id, -1)} className="qty-btn" disabled={item.quantity <= 1 || isProcessing}>
                      <Minus size={24} />
                    </button>
                    <span className="qty-display">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item._id, 1)} className="qty-btn" disabled={item.quantity >= item.stock_actual || isProcessing}>
                      <Plus size={24} />
                    </button>
                  </div>
                  
                  <div className="cart-item-total-group">
                    <span className="cart-item-total">${(item.precio_publico * item.quantity).toFixed(2)}</span>
                    <button onClick={() => removeFromCart(item._id)} className="delete-btn" disabled={isProcessing}>
                      <Trash2 size={28} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-summary">
          <div className="summary-row">
            <span>Subtotal (Sin IVA):</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>IVA Incluido (16%):</span>
            <span>${impuestos.toFixed(2)}</span>
          </div>
          <div className="summary-row total-row">
            <span>Total a Pagar:</span>
            <span>${total.toFixed(2)}</span>
          </div>
          
          <div className="payment-methods">
             <button 
               className={`pay-method-btn ${payMethod === 'Efectivo' ? 'active-pay' : ''}`}
               onClick={() => setPayMethod('Efectivo')}
               disabled={cart.length === 0 || isProcessing}
             >
                <Banknote size={24} /> Efectivo
             </button>
             <button 
               className={`pay-method-btn ${payMethod === 'Tarjeta' ? 'active-pay' : ''}`}
               onClick={() => setPayMethod('Tarjeta')}
               disabled={cart.length === 0 || isProcessing}
             >
                <CreditCard size={24} /> Tarjeta
             </button>
          </div>

          <button 
            className="checkout-btn" 
            disabled={cart.length === 0 || isProcessing}
            onClick={handleCheckout}
          >
            {isProcessing ? 'PROCESANDO...' : `COBRAR $${total.toFixed(2)}`}
          </button>
        </div>
      </div>

      {/* Columna Derecha: Catálogo */}
      <div className="pos-catalog-panel">
        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        
        {loading && <p className="loading-text">Buscando...</p>}

          <div className="products-grid">
            {searchResults.length === 0 ? (
              <p className="no-results">No se encontraron productos.</p>
            ) : (
              searchResults.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="pagination-controls">
              <button 
                className="pagination-btn" 
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                <ChevronLeft size={24} />
                <span>Anterior</span>
              </button>
              <span className="pagination-text">Página {currentPage} de {totalPages}</span>
              <button 
                className="pagination-btn" 
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                <span>Siguiente</span>
                <ChevronRight size={24} />
              </button>
            </div>
          )}
        </div>
    </div>
  );
};

export default POS;
