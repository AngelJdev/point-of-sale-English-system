const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  contacto: {
    type: String, // Nombre de la persona de contacto
    trim: true
  },
  telefono: {
    type: String,
    trim: true
  },
  empresa: {
    type: String,
    trim: true
  },
  balanceOwed: {
    type: Number,
    default: 0 // Cuánto dinero le debemos a este proveedor
  }
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);
