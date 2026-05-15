import React from 'react';
import { X, Printer, Package, CreditCard, Banknote, Calendar, Hash, RotateCcw, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import axios from '../config/axios';
import Receipt from './Receipt';
import './SaleDetailModal.css';

const SaleDetailModal = ({ isOpen, onClose, sale, onSaleUpdated }) => {
  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleReturn = async () => {
    const result = await Swal.fire({
      title: '¿Confirmar Devolución?',
      text: 'Los artículos se sumarán de nuevo al inventario y esta venta se anulará.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, procesar devolución',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await axios.post(`/sales/${sale._id}/return`);
        Swal.fire('¡Éxito!', 'La devolución ha sido procesada.', 'success');
        if (onSaleUpdated) onSaleUpdated();
        onClose();
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Error al procesar la devolución', 'error');
      }
    }
  };

  // Preparar datos para el componente Receipt
  // Ya vienen poblados del backend: sale.items[].producto_id.nombre
  const receiptItems = sale.items.map(item => ({
    nombre: item.producto_id?.nombre || 'Producto no encontrado',
    quantity: item.cantidad,
    precio_publico: item.precio
  }));

  return (
    <div className="modal-overlay">
      <div className="sale-detail-content">
        <div className="modal-header">
          <div className="header-title">
            <Hash size={24} />
            <h2>Detalle de Venta #{sale._id.slice(-6).toUpperCase()}</h2>
            {sale.estado === 'devuelta' && (
              <span className="status-badge error">DEVUELTA</span>
            )}
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="detail-grid">
            <div className="detail-item">
              <span className="label">Fecha y Hora</span>
              <div className="value-with-icon">
                <Calendar size={18} />
                <span>{new Date(sale.fecha).toLocaleString()}</span>
              </div>
            </div>
            <div className="detail-item">
              <span className="label">Método de Pago</span>
              <div className="value-with-icon">
                {sale.metodo_pago === 'Efectivo' ? <Banknote size={18} /> : <CreditCard size={18} />}
                <span>{sale.metodo_pago}</span>
              </div>
            </div>
          </div>

          <div className="items-section">
            <h3><Package size={20} /> Artículos Vendidos</h3>
            <div className="items-table-container">
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Refacción</th>
                    <th>Cant.</th>
                    <th>Precio</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <span className="item-name">{item.producto_id?.nombre || '---'}</span>
                        <span className="item-code">{item.producto_id?.codigo_interno || ''}</span>
                      </td>
                      <td>{item.cantidad}</td>
                      <td>${item.precio.toFixed(2)}</td>
                      <td>${(item.cantidad * item.precio).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="summary-section">
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>${sale.subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>IVA (16%):</span>
              <span>${sale.impuestos.toFixed(2)}</span>
            </div>
            <div className="summary-row total">
              <span>TOTAL PAGADO:</span>
              <span>${sale.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="footer-actions">
            <button className="reprint-btn" onClick={handlePrint}>
              <Printer size={24} />
              REIMPRIMIR COMPROBANTE
            </button>
            
            {sale.estado === 'completada' && (
              <button className="return-btn" onClick={handleReturn}>
                <RotateCcw size={24} />
                DEVOLVER VENTA
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Componente Receipt oculto para impresión */}
      <Receipt 
        cart={receiptItems}
        total={sale.total}
        subtotal={sale.subtotal}
        impuestos={sale.impuestos}
        payMethod={sale.metodo_pago}
        date={new Date(sale.fecha)}
      />
    </div>
  );
};

export default SaleDetailModal;
