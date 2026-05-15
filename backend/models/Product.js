const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  codigo_interno: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  codigo_barras: {
    type: String,
    trim: true
  },
  numero_parte_oem: {
    type: String,
    trim: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    trim: true
  },
  marca: {
    type: String,
    trim: true
  },
  compatibilidad: [{
    type: String,
    trim: true
  }],
  precio_publico: {
    type: Number,
    required: true,
    min: 0
  },
  precio_taller: {
    type: Number,
    min: 0
  },
  stock_actual: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  stock_minimo: {
    type: Number,
    default: 0,
    min: 0
  },
  ubicacion_fisica: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
