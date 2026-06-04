const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  storeName: {
    type: String,
    default: 'Mi Tienda'
  },
  address: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  receiptMessage: {
    type: String,
    default: '¡Gracias por su compra!'
  },
  taxRate: {
    type: Number,
    default: 0 // Porcentaje, ej. 16 para 16%
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
