const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'El título del proyecto es requerido'],
    trim: true,
    maxLength: [300, 'El título no puede exceder 300 caracteres']
  },
  reference: {
    type: String,
    trim: true,
    maxLength: [100, 'La referencia no puede exceder 100 caracteres']
  },
  funding_agency: {
    type: String,
    required: [true, 'La entidad financiadora es requerida'],
    trim: true,
    maxLength: [200, 'La entidad financiadora no puede exceder 200 caracteres']
  },
  principal_investigator: {
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
        return !this.start_date || value >= this.start_date;
      },
      message: 'La fecha de finalización debe ser posterior a la de inicio'
    }
  },
  budget: {
    type: Number,
    min: [0, 'El presupuesto no puede ser negativo']
  },
  description: {
    type: String,
    maxLength: [2000, 'La descripción no puede exceder 2000 caracteres']
  },
  url: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+/, 'URL inválida']
  }
}, {
  timestamps: true
});

// Índices para búsquedas
projectSchema.index({ title: 'text', description: 'text' });
projectSchema.index({ start_date: -1 });

module.exports = mongoose.model('Project', projectSchema);
