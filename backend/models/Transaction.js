const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: ['client_payment', 'supplier_invoice', 'supplier_payment'],
    required: true
  },
  monto: {
    type: Number,
    required: true
  },
  descripcion: {
    type: String,
    trim: true
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  // Referencias condicionales
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  // Referencia a una venta en caso de ser pago de una venta específica (opcional)
  saleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale'
  },
  // Quien registró la transacción
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
