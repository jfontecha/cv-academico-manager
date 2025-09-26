const mongoose = require('mongoose');

const publicationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'El título es requerido'],
    trim: true,
    maxLength: [500, 'El título no puede exceder 500 caracteres']
  },
  authors: {
    type: String,
    required: [true, 'Los autores son requeridos'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'El tipo de publicación es requerido'],
    enum: ['journal', 'conference', 'keynote', 'book', 'chapter', 'other'],
    default: 'journal'
  },
  publication: {
    type: String,
    required: [true, 'El nombre de la publicación es requerido'],
    trim: true
  },
  info_publication: {
    type: String,
    trim: true,
    default: ''
  },
  year_publication: {
    type: Number,
    required: [true, 'El año de publicación es requerido'],
    min: [1900, 'El año debe ser mayor a 1900'],
    max: [new Date().getFullYear() + 5, 'El año no puede ser muy futuro']
  },
  if: {
    type: Number,
    default: null,
    min: [0, 'El factor de impacto debe ser positivo']
  },
  quartile: {
    type: String,
    enum: ['Q1', 'Q2', 'Q3', 'Q4', ''],
    default: ''
  },
  doi: {
    type: String,
    trim: true,
    default: ''
  },
  url: {
    type: String,
    trim: true,
    default: '',
    validate: {
      validator: function(v) {
        if (!v) return true; // Permitir cadena vacía
        return /^https?:\/\/.+/.test(v);
      },
      message: 'La URL debe ser válida (http/https)'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para optimizar búsquedas
publicationSchema.index({ title: 'text', authors: 'text' });
publicationSchema.index({ year_publication: -1 });
publicationSchema.index({ type: 1 });
publicationSchema.index({ quartile: 1 });

// Virtual para mostrar información completa
publicationSchema.virtual('fullCitation').get(function() {
  return `${this.authors} (${this.year_publication}). ${this.title}. ${this.publication}${this.info_publication ? '. ' + this.info_publication : ''}`;
});

// Método estático para buscar por año
publicationSchema.statics.findByYear = function(year) {
  return this.find({ year_publication: year }).sort({ title: 1 });
};

// Método estático para buscar por tipo
publicationSchema.statics.findByType = function(type) {
  return this.find({ type }).sort({ year_publication: -1 });
};

// Método estático para buscar por cuartil
publicationSchema.statics.findByQuartile = function(quartile) {
  return this.find({ quartile }).sort({ year_publication: -1 });
};

// Pre-save middleware para limpiar datos
publicationSchema.pre('save', function(next) {
  // Limpiar espacios extra en strings
  if (this.title) this.title = this.title.trim();
  if (this.authors) this.authors = this.authors.trim();
  if (this.publication) this.publication = this.publication.trim();
  if (this.info_publication) this.info_publication = this.info_publication.trim();
  if (this.doi) this.doi = this.doi.trim();
  if (this.url) this.url = this.url.trim();
  
  next();
});

module.exports = mongoose.model('Publication', publicationSchema);
