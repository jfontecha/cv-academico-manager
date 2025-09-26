const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const TeachingInnovation = require('../models/TeachingInnovation');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

// Función auxiliar para determinar qué campos deben ser eliminados
const getUnsetFields = (updateData) => {
  const unsetFields = {};
  const optionalFields = ['reference', 'description', 'url'];
  
  optionalFields.forEach(field => {
    if (!(field in updateData)) {
      unsetFields[field] = 1;
    }
  });
  
  return unsetFields;
};

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

// @route   GET /api/teaching-innovation
// @desc    Obtener todos los proyectos de innovación docente
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '',
      sortBy = 'start_date',
      sortOrder = 'desc'
    } = req.query;
    
    // Construir filtros
    const filters = {};
    
    // Mejorar la búsqueda para usar regex si hay término de búsqueda
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filters.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { participants: searchRegex }
      ];
    }

    // Configurar ordenamiento
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Configurar paginación
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = limit === 'all' ? 0 : Math.max(1, parseInt(limit));

    let query = TeachingInnovation.find(filters);
    
    if (limitNum > 0) {
      query = query.limit(limitNum).skip((pageNum - 1) * limitNum);
    }
    
    const teachingInnovations = await query.sort(sortOptions);
    const total = await TeachingInnovation.countDocuments(filters);

    res.json({
      success: true,
      data: teachingInnovations,
      pagination: {
        current: pageNum,
        pages: limitNum > 0 ? Math.ceil(total / limitNum) : 1,
        total
      }
    });
  } catch (error) {
    console.error('Error al obtener proyectos de innovación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/teaching-innovation/stats
// @desc    Obtener estadísticas de innovación docente
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const yearStats = await TeachingInnovation.aggregate([
      {
        $group: {
          _id: { $year: '$start_date' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    const totalProjects = await TeachingInnovation.countDocuments();

    res.json({
      success: true,
      data: {
        yearStats,
        totalProjects
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

// @route   GET /api/teaching-innovation/:id
// @desc    Obtener proyecto de innovación por ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const teachingInnovation = await TeachingInnovation.findById(req.params.id);
    
    if (!teachingInnovation) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto de innovación no encontrado'
      });
    }

    res.json({
      success: true,
      data: teachingInnovation
    });
  } catch (error) {
    console.error('Error al obtener proyecto de innovación:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID de proyecto inválido'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   POST /api/teaching-innovation
// @desc    Crear nuevo proyecto de innovación
// @access  Private (admin, moderator, user)
router.post('/', [
  auth,
  authorize('admin', 'moderator', 'user'),
  body('title').trim().notEmpty().withMessage('El título es requerido'),
  body('call').trim().notEmpty().withMessage('La convocatoria es requerida'),
  body('principal_researcher').trim().notEmpty().withMessage('El investigador principal es requerido'),
  body('start_date').isISO8601().toDate().withMessage('Fecha de inicio inválida'),
  body('end_date').isISO8601().toDate().withMessage('Fecha de fin inválida'),
  body('reference').optional({ checkFalsy: true }).trim(),
  body('description').optional({ checkFalsy: true }).trim(),
  body('url').optional({ checkFalsy: true }).custom((value) => {
    if (!value || value.trim() === '') return true;
    if (!/^https?:\/\/.+/.test(value)) {
      throw new Error('URL inválida');
    }
    return true;
  })
], handleValidationErrors, async (req, res) => {
  try {
    const teachingInnovation = new TeachingInnovation(req.body);
    await teachingInnovation.save();

    res.status(201).json({
      success: true,
      message: 'Proyecto de innovación creado exitosamente',
      data: teachingInnovation
    });
  } catch (error) {
    console.error('Error al crear proyecto de innovación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   PUT /api/teaching-innovation/:id
// @desc    Actualizar proyecto de innovación (reemplazo completo)
// @access  Private (admin, moderator, user)
router.put('/:id', [
  auth,
  authorize('admin', 'moderator', 'user'),
  body('title').trim().notEmpty().withMessage('El título es requerido'),
  body('call').trim().notEmpty().withMessage('La convocatoria es requerida'),
  body('principal_researcher').trim().notEmpty().withMessage('El investigador principal es requerido'),
  body('start_date').isISO8601().toDate().withMessage('Fecha de inicio inválida'),
  body('end_date').isISO8601().toDate().withMessage('Fecha de fin inválida'),
  body('reference').optional({ checkFalsy: true }).trim(),
  body('description').optional({ checkFalsy: true }).trim(),
  body('url').optional({ checkFalsy: true }).custom((value) => {
    if (!value || value.trim() === '') return true;
    if (!/^https?:\/\/.+/.test(value)) {
      throw new Error('URL inválida');
    }
    return true;
  })
], handleValidationErrors, async (req, res) => {
  try {
    // Preparar los datos para reemplazo completo
    const updateData = {
      title: req.body.title,
      call: req.body.call,
      principal_researcher: req.body.principal_researcher,
      start_date: req.body.start_date,
      end_date: req.body.end_date,
      reference: req.body.reference || undefined,
      description: req.body.description || undefined,
      url: req.body.url || undefined
    };

    // Eliminar campos undefined para que Mongoose los elimine del documento
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const teachingInnovation = await TeachingInnovation.findByIdAndUpdate(
      req.params.id,
      { $set: updateData, $unset: getUnsetFields(updateData) },
      { new: true, runValidators: true, overwrite: false }
    );

    if (!teachingInnovation) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto de innovación no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Proyecto de innovación actualizado exitosamente',
      data: teachingInnovation
    });
  } catch (error) {
    console.error('Error al actualizar proyecto de innovación:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID de proyecto inválido'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   DELETE /api/teaching-innovation/:id
// @desc    Eliminar proyecto de innovación
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const teachingInnovation = await TeachingInnovation.findByIdAndDelete(req.params.id);

    if (!teachingInnovation) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto de innovación no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Proyecto de innovación eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar proyecto de innovación:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID de proyecto inválido'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
