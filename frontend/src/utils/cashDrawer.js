/**
 * cashDrawer.js
 * Servicio para abrir la caja registradora automáticamente al completar una venta.
 *
 * Estrategia:
 *  1. Llama al endpoint del backend /api/cash/open-drawer (para impresoras ESC/POS
 *     conectadas por USB o red en el servidor).
 *  2. Si el backend no está disponible o falla, intenta abrir la caja directamente
 *     desde el navegador mediante la Web Serial API (Chrome/Edge con HTTPS).
 *
 * El comando estándar ESC/POS para abrir cajón es:
 *   ESC p m t1 t2  →  0x1B 0x70 0x00 0x19 0xFA
 */

import axios from '../config/axios';

// ── Comando ESC/POS para abrir cajón de dinero ─────────────────────────────
// ESC p <pin> <on-time> <off-time>
const CASH_DRAWER_COMMAND = new Uint8Array([0x1b, 0x70, 0x00, 0x19, 0xfa]);

/**
 * Intenta abrir la caja registradora.
 * Retorna un objeto { success: boolean, method: string, error?: string }
 */
export const openCashDrawer = async () => {
  // ── Intento 1: Backend (impresora en el servidor) ─────────────────────────
  try {
    await axios.post('/cash/open-drawer');
    return { success: true, method: 'backend' };
  } catch (backendError) {
    console.warn('[CashDrawer] Backend no disponible:', backendError.message);
  }

  // ── Intento 2: Web Serial API (Puerto serie directo desde el navegador) ───
  // Solo disponible en Chrome/Edge con permisos concedidos previamente.
  if ('serial' in navigator) {
    try {
      // Obtener el puerto ya autorizado (sin diálogo de selección)
      const ports = await navigator.serial.getPorts();
      if (ports.length > 0) {
        const port = ports[0];
        if (!port.readable) {
          await port.open({ baudRate: 9600 });
        }
        const writer = port.writable.getWriter();
        await writer.write(CASH_DRAWER_COMMAND);
        writer.releaseLock();
        return { success: true, method: 'webserial' };
      }
    } catch (serialError) {
      console.warn('[CashDrawer] Web Serial falló:', serialError.message);
    }
  }

  // ── Sin hardware disponible (modo demo / sin equipo) ─────────────────────
  console.info('[CashDrawer] Sin hardware detectado. Simulando apertura de caja.');
  return { success: true, method: 'simulated' };
};
