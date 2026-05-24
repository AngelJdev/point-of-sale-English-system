import React from 'react';
import './Receipt.css';

const Receipt = ({ cart = [], payMethod = '', subtotal = 0, impuestos = 0, total = 0, montoRecibido = 0, cambio = 0, date = new Date() }) => {
  return (
    <div id="printable-receipt" className="receipt-container">
      <div className="receipt-header">
        <h2 className="store-name">PUNTO DE VENTA</h2>
        <p className="store-desc">Sistema Integral de Refaccionaria</p>
        <p className="store-rfc">RFC: XEXX010101000</p>
        <div className="divider"></div>
        <p className="receipt-title">COMPROBANTE DE VENTA</p>
        <p className="receipt-date">{date.toLocaleDateString()} - {date.toLocaleTimeString()}</p>
        <div className="divider"></div>
      </div>

      <div className="receipt-body">
        <table className="receipt-items">
          <thead>
            <tr>
              <th className="qty">CANT</th>
              <th className="desc">ARTÍCULO</th>
              <th className="amt">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {cart.map((item, index) => (
              <tr key={index}>
                <td className="qty">{item.quantity}</td>
                <td className="desc">
                  <span className="item-name">{item.nombre}</span>
                  <span className="item-price">${item.precio_publico.toFixed(2)} c/u</span>
                </td>
                <td className="amt">${(item.quantity * item.precio_publico).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="receipt-footer">
        <div className="divider"></div>
        <div className="totals">
          <div className="total-row"><span>SUBTOTAL:</span> <span>${subtotal.toFixed(2)}</span></div>
          <div className="total-row"><span>IVA (16%):</span> <span>${impuestos.toFixed(2)}</span></div>
          <div className="total-row grand-total"><span>TOTAL PAGADO:</span> <span>${total.toFixed(2)}</span></div>
        </div>
        <div className="pay-method">
          <span>PAGO EN:</span> <span>{payMethod.toUpperCase()}</span>
        </div>
        {payMethod === 'Efectivo' && (
          <>
            <div className="total-row"><span>SU PAGO:</span> <span>${montoRecibido.toFixed(2)}</span></div>
            <div className="total-row"><span>CAMBIO:</span> <span>${cambio.toFixed(2)}</span></div>
          </>
        )}
        <div className="divider dotted"></div>
        <p className="policy">Revise sus piezas al momento de la entrega.</p>
        <p className="policy bold">No hay devoluciones en partes eléctricas.</p>
        <p className="greeting">¡GRACIAS POR SU COMPRA!</p>
        <div className="barcode-placeholder">
           ||||||||||||||||||||||||||||
        </div>
      </div>
    </div>
  );
};

export default Receipt;
