const mongoose = require('mongoose');

const teachingInnovationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'El título del proyecto de innovación es requerido'],
    trim: true,
    maxLength: [300, 'El título no puede exceder 300 caracteres']
  },
  call: {
    type: String,
    required: [true, 'La convocatoria es requerida'],
    trim: true,
    maxLength: [200, 'La convocatoria no puede exceder 200 caracteres']
  },
  principal_researcher: {
    type: String,
    required: [true, 'El investigador principal es requerido'],
    trim: true,
    maxLength: [200, 'El investigador principal no puede exceder 200 caracteres']
  },
  start_date: {
    type: Date,
    required: [true, 'La fecha de inicio es requerida']
  },
  end_date: {
    type: Date,
    required: [true, 'La fecha de finalización es requerida'],
    validate: {
      validator: function(value) {
        return !this.start_date || !value || value >= this.start_date;
      },
      message: 'La fecha de finalización debe ser posterior a la de inicio'
    }
  },
  reference: {
    type: String,
    trim: true,
    maxLength: [100, 'La referencia no puede exceder 100 caracteres']
  },
  description: {
    type: String,
    trim: true,
    maxLength: [2000, 'La descripción no puede exceder 2000 caracteres']
  },
  url: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Permitir cadena vacía
        return /^https?:\/\/.+/.test(v);
      },
      message: 'La URL debe ser válida (http/https)'
    }
  }
}, {
  timestamps: true
});

// Índices para búsquedas
teachingInnovationSchema.index({ title: 'text', description: 'text' });
teachingInnovationSchema.index({ start_date: -1 });
teachingInnovationSchema.index({ principal_researcher: 1 });

module.exports = mongoose.model('TeachingInnovation', teachingInnovationSchema);
