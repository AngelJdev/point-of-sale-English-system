import React from 'react';
import './Help.css';
import { HelpCircle, ShoppingCart, PackageSearch, Wallet, BarChart3 } from 'lucide-react';

const Help = () => {
  return (
    <div className="help-container">
      <div className="help-header">
        <div className="help-title">
          <HelpCircle size={48} />
          <h1>Centro de Ayuda</h1>
        </div>
        <p>Aprende paso a paso cómo utilizar cada sección de tu Punto de Venta.</p>
      </div>

      <div className="help-content">
        <section className="help-section">
          <h2><ShoppingCart size={28} className="icon-bounce" /> 1. Venta (Punto de Venta)</h2>
          <div className="help-card">
            <h3>¿Para qué sirve?</h3>
            <p>Es la "caja registradora" de tu tienda. Aquí es donde le cobras a los clientes.</p>
            <h3>¿Cómo funciona paso a paso?</h3>
            <ol>
              <li>En el buscador (barra superior), escribe el nombre, código o escanea el producto con tu lector de código de barras.</li>
              <li>Al presionar "Enter" o dar clic, el producto "caerá" a la lista de abajo (tu carrito).</li>
              <li>Si te equivocas, puedes darle al botón de eliminar (basurero rojo) o cambiar la cantidad si el cliente lleva 2 o más manzanas... ¡perdón, piezas!</li>
              <li>A la derecha verás el <strong>Total a Cobrar</strong>. Escribe con cuánto billete te están pagando en "Efectivo Recibido".</li>
              <li>Presiona "Cobrar" y listo. El sistema descontará esos productos de tu inventario automáticamente y sumará el dinero a la caja.</li>
            </ol>
          </div>
        </section>

        <section className="help-section">
          <h2><PackageSearch size={28} className="icon-pulse" /> 2. Productos (Inventario)</h2>
          <div className="help-card">
            <h3>¿Para qué sirve?</h3>
            <p>Es el "almacén" de tu sistema. Aquí guardas la lista de todo lo que vendes y cuánto te queda.</p>
            <h3>¿Qué significan los precios?</h3>
            <ul>
              <li><strong>Precio de Compra:</strong> A cuánto te lo vende a ti tu proveedor. (Esto el cliente nunca lo ve).</li>
              <li><strong>Precio Venta General:</strong> El precio normal al que se lo das a cualquier cliente que entra por la puerta.</li>
              <li><strong>Precio Especial:</strong> Un precio más bajo por si le vendes por mayoreo a un mecánico o cliente frecuente.</li>
            </ul>
            <h3>El Semáforo de Existencias</h3>
            <p>En tu lista de productos verás que el número de Stock (cuántos tienes) se pinta de colores:</p>
            <ul>
              <li><span className="badge badge-green">Verde</span> Tienes suficientes productos.</li>
              <li><span className="badge badge-yellow">Amarillo</span> Tienes exactamente el mínimo que configuraste. (¡Ojo!).</li>
              <li><span className="badge badge-red">Rojo</span> Tienes menos del mínimo. ¡Urge que le compres más a tu proveedor!</li>
              <li><span className="badge badge-purple">Morado</span> Tienes 0. Se agotó por completo.</li>
            </ul>
          </div>
        </section>

        <section className="help-section">
          <h2><Wallet size={28} className="icon-bounce" /> 3. Caja Chica</h2>
          <div className="help-card">
            <h3>¿Para qué sirve?</h3>
            <p>Es el cajón donde guardas el dinero físico. El sistema lleva la cuenta matemática, pero a veces tú metes o sacas dinero por tu cuenta.</p>
            <h3>¿Cómo se usa?</h3>
            <ul>
              <li><strong>Entrada de Dinero:</strong> Si sacas $500 pesos de tu cartera y los pones en la caja para tener cambio (morralla), lo registras aquí.</li>
              <li><strong>Salida de Dinero:</strong> Si tomaste $200 pesos de la caja para pagarle al del agua o comprar las cocas, regístralo como "Salida" para que al final del día no te falte dinero y pienses que se perdió.</li>
            </ul>
          </div>
        </section>

        <section className="help-section">
          <h2><BarChart3 size={28} className="icon-pulse" /> 4. Reportes e Historial</h2>
          <div className="help-card">
            <h3>¿Para qué sirve?</h3>
            <p>Es el "cuaderno de cuentas" del jefe.</p>
            <ul>
              <li><strong>Historial:</strong> Es una lista de todos los tickets. Si un cliente te pide devolución y quieres ver a qué hora se le vendió y qué se le cobró, lo buscas aquí.</li>
              <li><strong>Reportes:</strong> Te suma todo el dinero del día, de la semana o del mes. Te dice cuáles son las piezas que más se venden para que siempre tengas de esas, y te da el balance total.</li>
            </ul>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Help;
