const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  telefono: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  direccion: {
    type: String,
    trim: true
  },
  balance: {
    type: Number,
    default: 0 // Si es positivo, el cliente nos debe dinero. Si es negativo, tiene saldo a favor.
  },
  notas: {
    type: String,
    trim: true,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Client', clientSchema);
