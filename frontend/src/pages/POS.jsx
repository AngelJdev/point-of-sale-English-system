import React, { useState, useEffect } from 'react';
import axios from '../config/axios';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { Trash2, Plus, Minus, CreditCard, Banknote, ShoppingCart, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import ProductCard from '../components/ProductCard';
import SuccessModal from '../components/SuccessModal';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
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
  const [montoRecibido, setMontoRecibido] = useState(0);
  const [cambio, setCambio] = useState(0);

  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, subtotal, impuestos, total, priceType, setPriceType } = useCart();
  const { currentUser } = useAuth();
  const token = currentUser?.token;

  useEffect(() => {
    const fetchClients = async () => {
      if (!token) return;
      try {
        const response = await axios.get('/clients');
        setClients(response.data);
      } catch (error) {
        console.error("Error al cargar clientes:", error);
      }
    };
    fetchClients();
  }, [token]);

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

  const handleSearchEnter = async () => {
    if (!searchTerm.trim()) return;
    try {
      const response = await axios.get(`/products?search=${searchTerm.trim()}&limit=1`);
      const products = response.data.products;
      if (products && products.length > 0) {
        const exactMatch = products.find(p => p.codigo_interno === searchTerm.trim()) || products[0];
        
        if (exactMatch.stock_actual > 0) {
          addToCart(exactMatch);
          toast.success(`Agregado: ${exactMatch.nombre}`);
          setSearchTerm(''); // Limpiar para el siguiente escaneo
        } else {
          toast.error('Producto sin stock');
        }
      } else {
        toast.error('Producto no encontrado');
      }
    } catch (error) {
      console.error("Error al buscar producto por escaner:", error);
    }
  };

  // Atajos de teclado y soporte para Escáner de Código de Barras
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        const searchInput = document.querySelector('.search-input');
        if (searchInput) searchInput.focus();
        return;
      }
      if (e.key === 'F4') {
        e.preventDefault();
        // Si hay items en el carrito y no está procesando, dispara el cobro
        if (cart.length > 0 && !isProcessing && !showSuccessModal) {
          handleCheckout();
        } else if (cart.length === 0) {
          toast.error('El carrito está vacío');
        }
        return;
      }

      // Si el usuario escribe algo (como un escáner) y no está en un input, enfocar buscador
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      const isInputFocused = ['input', 'textarea', 'select'].includes(activeTag) || document.activeElement.isContentEditable;
      
      if (!isInputFocused && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // No enfocar si hay modales abiertos (SweetAlert o SuccessModal)
        if (document.querySelector('.swal2-container') || showSuccessModal) return;
        
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
          searchInput.focus();
          // El navegador agregará automáticamente el carácter presionado al input enfocado
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, isProcessing, showSuccessModal]);

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

    let recibido = total;
    let cambioCalculado = 0;

    if (payMethod === 'Efectivo') {
      const { value: montoIngresado } = await Swal.fire({
        title: 'Cobro en Efectivo',
        width: '400px',
        backdrop: `rgba(15, 23, 42, 0.85)`,
        html: `
          <div style="font-family: inherit;">
            <div style="font-size: 1.2rem; margin-bottom: 1rem; color: #374151;">
              Total a Pagar: <b style="font-size: 1.8rem; color: #1f2937;">$${total.toFixed(2)}</b>
            </div>
            <div style="margin-bottom: 0.5rem; text-align: left; font-weight: bold; color: #4b5563; padding-left: 5%;">Monto Recibido del Cliente:</div>
            <input type="number" id="monto-input" class="swal2-input" min="${total}" step="0.01" style="margin: 0 auto; width: 90%; font-size: 1.5rem; text-align: center; box-sizing: border-box;" placeholder="Ej. 500">
            <div style="margin: 1.5rem auto 0 auto; width: 90%; padding: 1rem; background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
              <div style="font-size: 1rem; color: #6b7280; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: bold;">Su Cambio a Entregar</div>
              <div id="cambio-display" style="font-size: 2.5rem; font-weight: 900; color: #16a34a; letter-spacing: -0.02em;">$0.00</div>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonColor: '#16a34a',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Completar Venta',
        cancelButtonText: 'Cancelar',
        didOpen: () => {
          const input = Swal.getPopup().querySelector('#monto-input');
          const display = Swal.getPopup().querySelector('#cambio-display');
          input.focus();
          
          input.addEventListener('input', () => {
            const ingresado = parseFloat(input.value) || 0;
            const cambioCalc = ingresado - total;
            
            if (cambioCalc >= 0) {
              display.textContent = '$' + cambioCalc.toFixed(2);
              display.style.color = '#16a34a';
              display.style.fontSize = '2.5rem';
            } else {
              display.textContent = 'Insuficiente';
              display.style.color = '#dc2626';
              display.style.fontSize = '1.8rem';
            }
          });
        },
        preConfirm: () => {
          const input = Swal.getPopup().querySelector('#monto-input').value;
          const recibido = parseFloat(input);
          if (!input || isNaN(recibido)) {
            Swal.showValidationMessage('Ingrese el monto recibido por el cliente');
            return false;
          }
          if (recibido < total) {
            Swal.showValidationMessage('El monto recibido no puede ser menor al total');
            return false;
          }
          return recibido;
        }
      });

      if (!montoIngresado) return;
      recibido = parseFloat(montoIngresado);
      cambioCalculado = recibido - total;
    } else if (payMethod === 'Tarjeta') {
      const termResult = await Swal.fire({
        title: 'Terminal Bancaria',
        width: '400px',
        backdrop: `rgba(15, 23, 42, 0.85)`,
        html: `
          <div style="margin: 1.5rem 0; font-family: inherit;">
            <div class="terminal-loader" style="margin: 0 auto 1.5rem auto;"></div>
            <p style="font-size: 1.1rem; color: #4b5563; line-height: 1.5;">Deslice o inserte la tarjeta en la terminal física por la cantidad de:</p>
            <div style="margin-top: 1rem; padding: 1rem; background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border-radius: 12px; border: 1px solid #e5e7eb;">
              <p style="font-size: 2.5rem; font-weight: 900; color: #1f2937; margin: 0;">$${total.toFixed(2)}</p>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonColor: '#16a34a',
        cancelButtonColor: '#6b7280',
        confirmButtonText: '✓ Cobro Exitoso (Continuar)',
        cancelButtonText: 'Cancelar Venta',
        allowOutsideClick: false
      });
      if (!termResult.isConfirmed) return;
    } else if (payMethod === 'Crédito') {
      if (!selectedClient) {
        Swal.fire('Error', 'Debe seleccionar un cliente para vender a crédito', 'error');
        return;
      }
      recibido = total;
      cambioCalculado = 0;
    }

    setIsProcessing(true);
    setMontoRecibido(recibido);
    setCambio(cambioCalculado);
    
    try {
      const saleData = {
        items: cart.map(item => ({
          producto_id: item._id,
          cantidad: item.quantity,
          precio: item[priceType] || item.precio_publico || 0
        })),
        subtotal,
        impuestos,
        total,
        metodo_pago: payMethod,
        ...(selectedClient && { cliente_id: selectedClient })
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
    setSelectedClient(''); // Limpia el cliente
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
        montoRecibido={montoRecibido}
        cambio={cambio}
        onNewTicket={handleNewTicket} 
      />

      {/* Columna Izquierda: Carrito */}
      <div className="pos-cart-panel">
        <div className="panel-header">
          <h2 className="panel-title">Venta Actual</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 'bold' }}>[F2] Buscar | [F4] Cobrar</span>
            <span className="cart-count">{cart.length} ítems</span>
          </div>
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
                  <span className="cart-item-price">${(item[priceType] || item.precio_publico || 0).toFixed(2)} c/u</span>
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
                    <span className="cart-item-total">${((item[priceType] || item.precio_publico || 0) * item.quantity).toFixed(2)}</span>
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
          
          <div className="selectors-container" style={{ margin: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div className="price-selector-group">
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tipo de Precio Aplicado:</label>
              <select 
                value={priceType} 
                onChange={(e) => setPriceType(e.target.value)}
                className="pos-custom-select"
              >
                <option value="precio_publico">💰 Precio Público</option>
                <option value="precio_costo">📦 Precio de Compra</option>
                <option value="precio_taller">⭐ Precio Especial</option>
              </select>
            </div>

            {payMethod === 'Crédito' && (
              <div className="client-selector-group" style={{ animation: 'fadeIn 0.3s ease' }}>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#ef4444', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cliente para Crédito (Obligatorio):</label>
                <select 
                  value={selectedClient} 
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="pos-custom-select client-credit-select"
                >
                  <option value="">-- Seleccionar Cliente --</option>
                  {clients.map(c => (
                    <option key={c._id} value={c._id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
            )}
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
             <button 
               className={`pay-method-btn ${payMethod === 'Crédito' ? 'active-pay' : ''}`}
               onClick={() => setPayMethod('Crédito')}
               disabled={cart.length === 0 || isProcessing || !selectedClient}
               style={{ gridColumn: 'span 2' }}
             >
                <Users size={24} /> Crédito
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
        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} onEnter={handleSearchEnter} />
        
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
