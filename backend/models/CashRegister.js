const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  concepto: {
    type: String,
    required: true
  },
  monto: {
    type: Number,
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now
  }
});

const cashRegisterSchema = new mongoose.Schema({
  fecha: {
    type: Date,
    default: Date.now
  },
  fondo_inicial: {
    type: Number,
    required: true
  },
  ingresos_ventas: {
    type: Number,
    default: 0
  },
  salidas_efectivo: [expenseSchema],
  total_esperado: {
    type: Number
  },
  estado: {
    type: String,
    enum: ['abierta', 'cerrada'],
    default: 'abierta'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CashRegister', cashRegisterSchema);
