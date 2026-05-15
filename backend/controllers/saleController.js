const Sale = require('../models/Sale');
const Product = require('../models/Product');
const DailyCut = require('../models/DailyCut');
const mongoose = require('mongoose');

const createSale = async (req, res) => {
  // Iniciamos una sesión de MongoDB para asegurar que todo pase o se cancele completo (Transacción)
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items, subtotal, impuestos, total, metodo_pago } = req.body;

    if (!items || items.length === 0) {
      throw new Error('El carrito está vacío');
    }

    // 1. Validar y descontar inventario
    for (let item of items) {
      const product = await Product.findById(item.producto_id).session(session);
      
      if (!product) {
        throw new Error(`Producto no encontrado: ${item.producto_id}`);
      }

      if (product.stock_actual < item.cantidad) {
        throw new Error(`Stock insuficiente para el producto: ${product.nombre}. Disponible: ${product.stock_actual}`);
      }

      product.stock_actual -= item.cantidad;
      await product.save({ session });
    }

    // 2. Crear el registro de la venta (ticket)
    const newSale = new Sale({
      items,
      subtotal,
      impuestos,
      total,
      metodo_pago
    });

    const savedSale = await newSale.save({ session });

    // Si todo salió bien, guardamos cambios en la DB
    await session.commitTransaction();
    session.endSession();

    res.status(201).json(savedSale);
  } catch (error) {
    // Si hubo un error (ej. falta de stock de última hora), deshacemos todo
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: 'Error procesando la venta', error: error.message });
  }
};

const getDailySales = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const sales = await Sale.find({
      fecha: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      estado: 'completada'
    }).sort({ fecha: -1 });

    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el corte del día', error: error.message });
  }
};

// @desc    Finalizar el corte de caja del día
// @route   POST /api/sales/close-cut
// @access  Private (Admin/Staff)
const closeDailyCut = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Obtener ventas del día
    const sales = await Sale.find({
      fecha: {
        $gte: today,
        $lte: endOfDay
      },
      estado: 'completada'
    });

    const totalIngresos = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalTickets = sales.length;

    if (totalTickets === 0) {
      return res.status(400).json({ message: 'No hay ventas hoy para cerrar corte.' });
    }

    // Verificar si ya existe un corte hoy
    const existingCut = await DailyCut.findOne({
      fecha_corte: {
        $gte: today,
        $lte: endOfDay
      }
    });

    if (existingCut) {
      existingCut.total_ingresos = totalIngresos;
      existingCut.total_tickets = totalTickets;
      existingCut.cerrado_por = req.user ? req.user._id : null;
      await existingCut.save();
      return res.status(200).json({ message: 'Corte de caja actualizado exitosamente con las ventas imprevistas.', cut: existingCut });
    }

    // Crear el corte
    const cut = await DailyCut.create({
      total_ingresos: totalIngresos,
      total_tickets: totalTickets,
      cerrado_por: req.user ? req.user._id : null
    });

    res.status(201).json({ message: 'Corte de caja finalizado exitosamente.', cut });
  } catch (error) {
    res.status(500).json({ message: 'Error al finalizar el corte de caja', error: error.message });
  }
};

// @desc    Obtener historial de cortes (mensual/general)
// @route   GET /api/sales/monthly-cuts
// @access  Private (Admin)
const getMonthlyCuts = async (req, res) => {
  try {
    // Por simplicidad, traemos los últimos 30 cortes (1 mes) ordenados por fecha descendente
    const cuts = await DailyCut.find().sort({ fecha_corte: -1 }).limit(30).populate('cerrado_por', 'nombre usuario');
    res.status(200).json(cuts);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener historial de cortes', error: error.message });
  }
};

// @desc    Obtener historial de todas las ventas con paginación
// @route   GET /api/sales
// @access  Private
const getSalesHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      // Intentar buscar por los últimos caracteres del ID (Folio)
      // O por el ID completo si es un ObjectId válido
      query = {
        $or: [
          { _id: mongoose.Types.ObjectId.isValid(search) ? search : undefined },
          // Búsqueda aproximada por ID convertido a string
          { $expr: { $regexMatch: { input: { $toString: "$_id" }, regex: search, options: "i" } } }
        ].filter(condition => Object.values(condition)[0] !== undefined)
      };
    }

    const totalSales = await Sale.countDocuments(query);
    
    // Poblamos los items para tener los nombres de los productos al reimprimir
    const sales = await Sale.find(query)
      .populate('items.producto_id', 'nombre codigo_interno')
      .sort({ fecha: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      sales,
      currentPage: page,
      totalPages: Math.ceil(totalSales / limit),
      totalSales
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener historial de ventas', error: error.message });
  }
};

// @desc    Procesar la devolución de una venta
// @route   POST /api/sales/:id/return
// @access  Private (Admin)
const returnSale = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const sale = await Sale.findById(id).session(session);

    if (!sale) {
      throw new Error('Venta no encontrada');
    }

    if (sale.estado === 'devuelta') {
      throw new Error('Esta venta ya fue devuelta anteriormente');
    }

    // 1. Regresar artículos al inventario
    for (let item of sale.items) {
      const product = await Product.findById(item.producto_id).session(session);
      if (product) {
        product.stock_actual += item.cantidad;
        await product.save({ session });
      }
    }

    // 2. Marcar como devuelta
    sale.estado = 'devuelta';
    await sale.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({ message: 'Devolución procesada exitosamente. El inventario ha sido actualizado.', sale });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: 'Error al procesar la devolución', error: error.message });
  }
};

module.exports = {
  createSale,
  getDailySales,
  closeDailyCut,
  getMonthlyCuts,
  getSalesHistory,
  returnSale
};
