const mongoose = require('mongoose');

const dailyCutSchema = new mongoose.Schema({
  fecha_corte: {
    type: Date,
    default: Date.now,
  },
  total_ingresos: {
    type: Number,
    required: true,
  },
  total_tickets: {
    type: Number,
    required: true,
  },
  cerrado_por: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }
}, { timestamps: true });

module.exports = mongoose.model('DailyCut', dailyCutSchema);
