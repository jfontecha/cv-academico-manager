const mongoose = require('mongoose');

const teachingClassSchema = new mongoose.Schema({
  academic_year: {
    type: String,
    required: [true, 'El año académico es requerido'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^\d{4}-\d{4}$/.test(v);
      },
      message: 'El año académico debe tener el formato YYYY-YYYY (ej: 2023-2024)'
    }
  },
  subject: {
    type: String,
    required: [true, 'La asignatura es requerida'],
    trim: true,
    maxLength: [200, 'El nombre de la asignatura no puede exceder 200 caracteres']
  },
  course: {
    type: String,
    required: [true, 'El curso es requerido'],
    enum: ['1', '2', '3', '4', 'posgrado', 'otros'],
    default: '1'
  },
  type: {
    type: String,
    required: [true, 'El tipo de clase es requerido'],
    enum: ['theory', 'practice', 'seminar', 'other'],
    default: 'theory'
  },
  degree: {
    type: String,
    required: [true, 'El grado/titulación es requerido'],
    trim: true,
    maxLength: [300, 'El nombre del grado no puede exceder 300 caracteres']
  },
  description: {
    type: String,
    trim: true,
    maxLength: [1000, 'La descripción no puede exceder 1000 caracteres']
  },
  semester: {
    type: String,
    enum: ['1', '2', 'anual', ''],
    default: ''
  },
  category: {
    type: String,
    enum: ['ayudantedoctor', 'contratadodoctor', 'titular', 'catedratico', 'otro'],
    default: 'titular'
  },
  teaching_language: {
    type: String,
    enum: ['castellano', 'ingles'],
    default: 'castellano'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para optimizar búsquedas
teachingClassSchema.index({ academic_year: -1 });
teachingClassSchema.index({ subject: 'text', degree: 'text' });
teachingClassSchema.index({ course: 1 });
teachingClassSchema.index({ type: 1 });

// Virtual para mostrar información completa
teachingClassSchema.virtual('fullDescription').get(function() {
  return `${this.subject} - ${this.degree} (Curso ${this.course}, ${this.type})`;
});

// Método estático para buscar por año académico
teachingClassSchema.statics.findByAcademicYear = function(academicYear) {
  return this.find({ academic_year: academicYear }).sort({ course: 1, subject: 1 });
};

// Método estático para buscar por curso
teachingClassSchema.statics.findByCourse = function(course) {
  return this.find({ course }).sort({ academic_year: -1, subject: 1 });
};

// Método estático para buscar por tipo
teachingClassSchema.statics.findByType = function(type) {
  return this.find({ type }).sort({ academic_year: -1, course: 1 });
};

// Método estático para buscar por grado
teachingClassSchema.statics.findByDegree = function(degree) {
  return this.find({ degree: new RegExp(degree, 'i') }).sort({ academic_year: -1, course: 1 });
};

// Pre-save middleware para limpiar datos
teachingClassSchema.pre('save', function(next) {
  // Limpiar espacios extra en strings
  if (this.subject) this.subject = this.subject.trim();
  if (this.degree) this.degree = this.degree.trim();
  if (this.academic_year) this.academic_year = this.academic_year.trim();
  
  next();
});

module.exports = mongoose.model('TeachingClass', teachingClassSchema);
