import React from 'react';
import { Settings, Wrench, Droplet, CarFront } from 'lucide-react';
import './Receipt.css';

const Receipt = ({ cart = [], payMethod = '', subtotal = 0, impuestos = 0, total = 0, montoRecibido = 0, cambio = 0, date = new Date() }) => {
  return (
    <div id="printable-receipt" className="receipt-container">
      <div className="receipt-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
            <Settings size={20} />
            <Droplet size={20} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h2 className="store-name" style={{ fontSize: '15px', margin: '0', fontWeight: 'bold' }}>HULES, BANDAS Y ACEITES</h2>
            <h1 className="store-name" style={{ fontSize: '28px', margin: '5px 0', letterSpacing: '2px', fontWeight: '900' }}>"REYNA"</h1>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
            <Wrench size={20} />
            <CarFront size={20} />
          </div>
        </div>
        <p className="store-desc">Reyna Meléndez Jilote</p>
        <p className="store-rfc">RFC: MEJR590510NU6</p>
        <p className="store-address">Adolfo Lopez Mateos No. 106, Col. San Isidro<br/>Xicotepec de Juarez, Pue. C.P. 73080</p>
        <p className="store-phone">Tel. 764 764 90 99</p>
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
        <p className="rights-reserved" style={{ fontSize: '10px', marginTop: '10px' }}>Derechos reservados para NEXUS SOLUTIONS</p>
        <div className="barcode-placeholder">
          ||||||||||||||||||||||||||||
        </div>
      </div>
    </div>
  );
};

export default Receipt;
