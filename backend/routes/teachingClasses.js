const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const TeachingClass = require('../models/TeachingClass');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array()
    });
  }
  next();
};

// @route   GET /api/teaching-classes
// @desc    Obtener todas las clases
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      academic_year = '',
      course = '',
      type = '',
      sortBy = 'academic_year',
      sortOrder = 'desc'
    } = req.query;
    
    // Construir filtros
    const filters = {};
    
    // Mejorar la búsqueda para usar regex si hay término de búsqueda
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filters.$or = [
        { subject_name: searchRegex },
        { degree: searchRegex },
        { center: searchRegex },
        { university: searchRegex }
      ];
    }
    
    if (academic_year && academic_year.trim()) {
      filters.academic_year = academic_year.trim();
    }

    if (course && course.trim()) {
      filters.course = course.trim();
    }

    if (type && type.trim()) {
      filters.type = type.trim();
    }

    // Configurar ordenamiento
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Configurar paginación
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = limit === 'all' ? 0 : Math.max(1, parseInt(limit));

    let query = TeachingClass.find(filters);
    
    if (limitNum > 0) {
      query = query.limit(limitNum).skip((pageNum - 1) * limitNum);
    }
    
    const teachingClasses = await query.sort(sortOptions);
    const total = await TeachingClass.countDocuments(filters);

    res.json({
      success: true,
      data: teachingClasses,
      pagination: {
        current: pageNum,
        pages: limitNum > 0 ? Math.ceil(total / limitNum) : 1,
        total
      }
    });
  } catch (error) {
    console.error('Error al obtener clases:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/teaching-classes/stats
// @desc    Obtener estadísticas de clases
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const yearStats = await TeachingClass.aggregate([
      {
        $group: {
          _id: '$academic_year',
          count: { $sum: 1 },
          totalCredits: { $sum: '$credits' }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    const courseStats = await TeachingClass.aggregate([
      {
        $group: {
          _id: '$course',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const typeStats = await TeachingClass.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalClasses = await TeachingClass.countDocuments();

    res.json({
      success: true,
      data: {
        yearStats,
        courseStats,
        typeStats,
        totalClasses
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/teaching-classes/:id
// @desc    Obtener clase por ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const teachingClass = await TeachingClass.findById(req.params.id);
    
    if (!teachingClass) {
      return res.status(404).json({
        success: false,
        message: 'Clase no encontrada'
      });
    }

    res.json({
      success: true,
      data: teachingClass
    });
  } catch (error) {
    console.error('Error al obtener clase:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID de clase inválido'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   POST /api/teaching-classes
// @desc    Crear nueva clase
// @access  Private (admin, moderator, user)
router.post('/', [
  auth,
  authorize('admin', 'moderator', 'user'),
  body('academic_year').matches(/^\d{4}-\d{4}$|^\d{4}\/\d{4}$/).withMessage('Formato de año académico inválido'),
  body('subject').trim().notEmpty().withMessage('La asignatura es requerida'),
  body('course').isIn(['1', '2', '3', '4', 'posgrado', 'otros']).withMessage('El curso debe ser válido'),
  body('type').isIn(['theory', 'practice', 'seminar', 'other']).withMessage('Tipo inválido'),
  body('degree').trim().notEmpty().withMessage('El grado es requerido'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('La descripción no puede exceder 1000 caracteres'),
  body('semester').optional().isIn(['1', '2', 'anual', '']).withMessage('Semestre inválido')
], handleValidationErrors, async (req, res) => {
  try {
    const teachingClass = new TeachingClass(req.body);
    await teachingClass.save();

    res.status(201).json({
      success: true,
      message: 'Clase creada exitosamente',
      data: teachingClass
    });
  } catch (error) {
    console.error('Error al crear clase:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   PUT /api/teaching-classes/:id
// @desc    Actualizar clase
// @access  Private (admin, moderator, user)
router.put('/:id', [
  auth,
  authorize('admin', 'moderator', 'user'),
  body('academic_year').optional().matches(/^\d{4}-\d{4}$|^\d{4}\/\d{4}$/).withMessage('Formato de año académico inválido'),
  body('subject').optional().trim().notEmpty().withMessage('La asignatura no puede estar vacía'),
  body('course').optional().isIn(['1', '2', '3', '4', 'posgrado', 'otros']).withMessage('El curso debe ser válido'),
  body('type').optional().isIn(['theory', 'practice', 'seminar', 'other']).withMessage('Tipo inválido'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('La descripción no puede exceder 1000 caracteres'),
  body('semester').optional().isIn(['1', '2', 'anual', '']).withMessage('Semestre inválido')
], handleValidationErrors, async (req, res) => {
  try {
    const teachingClass = await TeachingClass.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!teachingClass) {
      return res.status(404).json({
        success: false,
        message: 'Clase no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Clase actualizada exitosamente',
      data: teachingClass
    });
  } catch (error) {
    console.error('Error al actualizar clase:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID de clase inválido'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   DELETE /api/teaching-classes/:id
// @desc    Eliminar clase
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const teachingClass = await TeachingClass.findByIdAndDelete(req.params.id);

    if (!teachingClass) {
      return res.status(404).json({
        success: false,
        message: 'Clase no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Clase eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar clase:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID de clase inválido'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
