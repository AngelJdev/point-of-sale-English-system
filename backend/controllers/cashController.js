const CashRegister = require('../models/CashRegister');
const { SerialPort } = (() => { try { return require('serialport'); } catch { return {}; } })();
const Sale = require('../models/Sale'); // Assuming Sale model exists for checking sales

// Obtener la caja activa actual
const getCurrentRegister = async (req, res) => {
  try {
    const activeRegister = await CashRegister.findOne({ estado: 'abierta' });
    if (!activeRegister) {
      return res.status(200).json(null); // No hay caja abierta
    }
    
    // Calcular ventas en efectivo desde que se abrió la caja
    // IMPORTANTE: se excluyen ventas devueltas para que el total esperado
    // baje correctamente cuando se procesa una devolución.
    const sales = await Sale.find({ 
      fecha: { $gte: activeRegister.fecha },
      metodo_pago: 'Efectivo',
      estado: 'completada'          // ← excluye devoluciones
    });

    const totalVentasEfectivo = sales.reduce((acc, sale) => acc + sale.total, 0);
    const totalSalidas = activeRegister.salidas_efectivo.reduce((acc, salida) => acc + salida.monto, 0);
    const totalEsperado = activeRegister.fondo_inicial + totalVentasEfectivo - totalSalidas;

    const registerData = activeRegister.toObject();
    registerData.ingresos_ventas = totalVentasEfectivo;
    registerData.total_esperado = totalEsperado;

    res.status(200).json(registerData);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener la caja activa', error: error.message });
  }
};

// Abrir nueva caja
const openRegister = async (req, res) => {
  try {
    const { fondo_inicial } = req.body;
    
    // Verificar si ya hay una abierta
    const activeRegister = await CashRegister.findOne({ estado: 'abierta' });
    if (activeRegister) {
      return res.status(400).json({ message: 'Ya existe una caja abierta actualmente' });
    }

    const newRegister = await CashRegister.create({
      fondo_inicial,
      total_esperado: fondo_inicial
    });

    res.status(201).json(newRegister);
  } catch (error) {
    res.status(500).json({ message: 'Error al abrir la caja', error: error.message });
  }
};

// Agregar un gasto a la caja
const addExpense = async (req, res) => {
  try {
    const { concepto, monto } = req.body;
    const activeRegister = await CashRegister.findOne({ estado: 'abierta' });
    
    if (!activeRegister) {
      return res.status(400).json({ message: 'No hay ninguna caja abierta' });
    }

    activeRegister.salidas_efectivo.push({ concepto, monto });
    await activeRegister.save();

    res.status(200).json(activeRegister);
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar el gasto', error: error.message });
  }
};

// Cerrar caja
const closeRegister = async (req, res) => {
  try {
    const activeRegister = await CashRegister.findOne({ estado: 'abierta' });
    if (!activeRegister) {
      return res.status(400).json({ message: 'No hay caja abierta para cerrar' });
    }

    // Calcular totales al cerrar caja.
    // Se excluyen ventas devueltas para reflejar el dinero real en caja.
    const sales = await Sale.find({ 
      fecha: { $gte: activeRegister.fecha },
      metodo_pago: 'Efectivo',
      estado: 'completada'          // ← excluye devoluciones
    });

    const totalVentasEfectivo = sales.reduce((acc, sale) => acc + sale.total, 0);
    const totalSalidas = activeRegister.salidas_efectivo.reduce((acc, salida) => acc + salida.monto, 0);

    const totalEsperado = activeRegister.fondo_inicial + totalVentasEfectivo - totalSalidas;

    activeRegister.ingresos_ventas = totalVentasEfectivo;
    activeRegister.total_esperado = totalEsperado;
    activeRegister.estado = 'cerrada';

    await activeRegister.save();

    res.status(200).json(activeRegister);
  } catch (error) {
    res.status(500).json({ message: 'Error al cerrar la caja', error: error.message });
  }
};

// ── Abrir cajón de dinero (comando ESC/POS) ──────────────────────────────
// ESC p <pin> <on-time> <off-time>  →  0x1B 0x70 0x00 0x19 0xFA
const DRAWER_CMD = Buffer.from([0x1b, 0x70, 0x00, 0x19, 0xfa]);

const openDrawer = async (req, res) => {
  const portPath = process.env.PRINTER_PORT; // Ej: 'COM3' en Windows, '/dev/ttyUSB0' en Linux

  // Si no hay puerto configurado → modo simulado (desarrollo / sin equipo)
  if (!portPath || !SerialPort) {
    console.info('[CashDrawer] Sin puerto configurado. Simulando apertura de cajón.');
    return res.status(200).json({ success: true, method: 'simulated', message: 'Cajón abierto (simulado)' });
  }

  try {
    const port = new SerialPort({ path: portPath, baudRate: 9600, autoOpen: false });
    await new Promise((resolve, reject) => port.open(err => err ? reject(err) : resolve()));
    await new Promise((resolve, reject) => port.write(DRAWER_CMD, err => err ? reject(err) : resolve()));
    await new Promise((resolve, reject) => port.drain(err => err ? reject(err) : resolve()));
    port.close();
    return res.status(200).json({ success: true, method: 'serial', message: 'Cajón abierto correctamente' });
  } catch (error) {
    console.error('[CashDrawer] Error al abrir cajón:', error.message);
    return res.status(500).json({ success: false, message: 'Error al abrir el cajón', error: error.message });
  }
};

module.exports = {
  getCurrentRegister,
  openRegister,
  addExpense,
  closeRegister,
  openDrawer
};
