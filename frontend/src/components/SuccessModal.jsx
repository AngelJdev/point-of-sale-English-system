import React, { useEffect, useState } from 'react';
import { CheckCircle2, Printer, AlertCircle, Loader2 } from 'lucide-react';
import Receipt from './Receipt';
import { openCashDrawer } from '../utils/cashDrawer';
import './SuccessModal.css';

const SuccessModal = ({ isOpen, total, subtotal, impuestos, cart, payMethod, montoRecibido, cambio, onNewTicket }) => {
  // Estado del proceso automático al abrir el modal
  const [autoStatus, setAutoStatus] = useState('idle'); // 'idle' | 'running' | 'done' | 'error'
  const [drawerMethod, setDrawerMethod] = useState('');

  // ── Al abrir el modal: abre la caja + imprime ticket automáticamente ──────
  useEffect(() => {
    if (!isOpen) {
      setAutoStatus('idle');
      setDrawerMethod('');
      return;
    }

    const runAutoActions = async () => {
      setAutoStatus('running');

      // 1. Abrir caja registradora
      let drawerResult = { success: false, method: 'none' };
      if (payMethod === 'Efectivo') {
        // Solo abre cajón si el pago fue en efectivo (en tarjeta no se necesita cambio físico)
        drawerResult = await openCashDrawer();
        setDrawerMethod(drawerResult.method);
      }

      // 2. Imprimir ticket automáticamente (pequeño delay para que el modal haya renderizado)
      setTimeout(() => {
        window.print();
      }, 400);

      setAutoStatus('done');
    };

    runAutoActions();
  }, [isOpen]);

  // ── Impresión manual (botón de respaldo) ──────────────────────────────────
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  // Texto descriptivo del estado
  const statusLabel = {
    idle: '',
    running: 'Abriendo caja e imprimiendo ticket...',
    done: payMethod === 'Efectivo'
      ? `Caja abierta ${drawerMethod === 'simulated' ? '(modo demo)' : '✓'} · Ticket impreso ✓`
      : 'Ticket impreso automáticamente ✓',
    error: 'No se pudo abrir la caja. Usa el botón de respaldo.',
  }[autoStatus];

  return (
    <>
      <div className="modal-overlay">
        <div className="modal-content">
          <CheckCircle2 size={80} className="success-icon" />
          <h2 className="success-title">¡VENTA EXITOSA!</h2>

          <div className="success-summary">
            <div className="summary-amount">
              <span>Total Pagado</span>
              <span className="amount-value">${total?.toFixed(2)}</span>
            </div>

            <div className="summary-details">
              <div className="detail-row">
                <span>Método de Pago:</span>
                <span className="detail-bold">{payMethod}</span>
              </div>
              {payMethod === 'Efectivo' && (
                <>
                  <div className="detail-row">
                    <span>Monto Recibido:</span>
                    <span className="detail-bold">${montoRecibido?.toFixed(2)}</span>
                  </div>
                  <div className="detail-row change-row">
                    <span>Cambio Entregado:</span>
                    <span className="detail-bold change-value">${cambio?.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Indicador de estado automático ─────────────────────────── */}
          {autoStatus !== 'idle' && (
            <div className={`auto-status auto-status--${autoStatus}`}>
              {autoStatus === 'running' && <Loader2 size={16} className="status-spinner" />}
              {autoStatus === 'done'    && <CheckCircle2 size={16} />}
              {autoStatus === 'error'   && <AlertCircle size={16} />}
              <span>{statusLabel}</span>
            </div>
          )}

          <div className="modal-actions-horizontal">
            {/* Botón de respaldo para imprimir manualmente */}
            <button className="print-btn" onClick={handlePrint} title="Imprimir ticket manualmente">
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
        montoRecibido={montoRecibido}
        cambio={cambio}
      />
    </>
  );
};

export default SuccessModal;
