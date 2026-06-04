const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  producto_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  cantidad: {
    type: Number,
    required: true,
    min: 1
  },
  precio: {
    type: Number,
    required: true,
    min: 0
  }
});

const saleSchema = new mongoose.Schema({
  items: [saleItemSchema],
  subtotal: {
    type: Number,
    required: true
  },
  impuestos: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  metodo_pago: {
    type: String,
    enum: ['Efectivo', 'Tarjeta', 'Crédito'],
    default: 'Efectivo'
  },
  cliente_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  estado: {
    type: String,
    enum: ['completada', 'devuelta'],
    default: 'completada'
  }
});

module.exports = mongoose.model('Sale', saleSchema);
