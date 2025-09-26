const mongoose = require('mongoose');

const finalWorkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'El título del trabajo es requerido'],
    trim: true,
    maxLength: [300, 'El título no puede exceder 300 caracteres']
  },
  author: {
    type: String,
    required: [true, 'El autor del trabajo es requerido'],
    trim: true,
    maxLength: [200, 'El autor no puede exceder 200 caracteres']
  },
  type: {
    type: String,
    required: [true, 'El tipo de trabajo es requerido'],
    enum: {
      values: ['tfg', 'tfm', 'thesis', 'other'],
      message: 'El tipo debe ser tfg, tfm, thesis o other'
    }
  },
  degree: {
    type: String,
    trim: true,
    maxLength: [200, 'La titulación no puede exceder 200 caracteres']
  },
  defense_date: {
    type: Date,
    required: [true, 'La fecha de defensa es requerida']
  },
  grade: {
    type: String,
    trim: true,
    maxLength: [100, 'La calificación no puede exceder 100 caracteres']
  }
}, {
  timestamps: true
});

// Índices para búsquedas
finalWorkSchema.index({ title: 'text', author: 'text' });
finalWorkSchema.index({ defense_date: -1 });
finalWorkSchema.index({ type: 1 });
finalWorkSchema.index({ author: 1 });

module.exports = mongoose.model('FinalWork', finalWorkSchema);
