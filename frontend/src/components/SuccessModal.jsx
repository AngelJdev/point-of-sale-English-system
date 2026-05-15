import React from 'react';
import { CheckCircle2, Printer } from 'lucide-react';
import Receipt from './Receipt';
import './SuccessModal.css';

const SuccessModal = ({ isOpen, total, subtotal, impuestos, cart, payMethod, onNewTicket }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="modal-overlay">
        <div className="modal-content">
          <CheckCircle2 size={100} className="success-icon" />
          <h2 className="success-title">¡VENTA ÉXITOSA!</h2>
          <p className="success-amount">Total: ${total?.toFixed(2)}</p>
          
          <div className="modal-actions-horizontal">
            <button className="print-btn" onClick={handlePrint}>
              <Printer size={24} />
              IMPRIMIR TICKET
            </button>
            <button className="new-ticket-btn" onClick={onNewTicket} autoFocus>
              FINALIZAR COMPRA
            </button>
          </div>
        </div>
      </div>
      
      {/* El comprobante está en el DOM pero oculto hasta que se invoca window.print() */}
      <Receipt 
        cart={cart} 
        total={total} 
        subtotal={subtotal} 
        impuestos={impuestos} 
        payMethod={payMethod} 
      />
    </>
  );
};

export default SuccessModal;
