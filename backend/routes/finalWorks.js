const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const FinalWork = require('../models/FinalWork');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

// Función auxiliar para determinar qué campos deben ser eliminados
const getUnsetFields = (updateData) => {
  const unsetFields = {};
  const optionalFields = ['degree', 'grade'];
  
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

// @route   GET /api/final-works
// @desc    Obtener todos los trabajos fin de estudios
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '',
      type = '',
      sortBy = 'defense_date',
      sortOrder = 'desc'
    } = req.query;
    
    // Construir filtros
    const filters = {};
    
    // Mejorar la búsqueda para usar regex si hay término de búsqueda
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filters.$or = [
        { title: searchRegex },
        { author: searchRegex }
      ];
    }
    
    // Filtro por tipo
    if (type && type.trim()) {
      filters.type = type.trim();
    }

    // Configurar ordenamiento
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Configurar paginación
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = limit === 'all' ? 0 : Math.max(1, parseInt(limit));

    let query = FinalWork.find(filters);
    
    if (limitNum > 0) {
      query = query.limit(limitNum).skip((pageNum - 1) * limitNum);
    }
    
    const finalWorks = await query.sort(sortOptions);
    const total = await FinalWork.countDocuments(filters);

    res.json({
      success: true,
      data: finalWorks,
      pagination: {
        current: pageNum,
        pages: limitNum > 0 ? Math.ceil(total / limitNum) : 1,
        total
      }
    });
  } catch (error) {
    console.error('Error al obtener trabajos fin de estudios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/final-works/stats
// @desc    Obtener estadísticas de trabajos fin de estudios
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const yearStats = await FinalWork.aggregate([
      {
        $group: {
          _id: { $year: '$defense_date' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    const typeStats = await FinalWork.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const totalWorks = await FinalWork.countDocuments();

    res.json({
      success: true,
      data: {
        yearStats,
        typeStats,
        totalWorks
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

// @route   GET /api/final-works/:id
// @desc    Obtener trabajo fin de estudios por ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const finalWork = await FinalWork.findById(req.params.id);
    
    if (!finalWork) {
      return res.status(404).json({
        success: false,
        message: 'Trabajo fin de estudios no encontrado'
      });
    }

    res.json({
      success: true,
      data: finalWork
    });
  } catch (error) {
    console.error('Error al obtener trabajo fin de estudios:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID de trabajo inválido'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   POST /api/final-works
// @desc    Crear nuevo trabajo fin de estudios
// @access  Private (admin, moderator, user)
router.post('/', [
  auth,
  authorize('admin', 'moderator', 'user'),
  body('title').trim().notEmpty().withMessage('El título es requerido'),
  body('author').trim().notEmpty().withMessage('El autor es requerido'),
  body('type').isIn(['tfg', 'tfm', 'thesis', 'other']).withMessage('Tipo de trabajo inválido'),
  body('defense_date').isISO8601().toDate().withMessage('Fecha de defensa inválida'),
  body('degree').optional({ checkFalsy: true }).trim(),
  body('grade').optional({ checkFalsy: true }).trim()
], handleValidationErrors, async (req, res) => {
  try {
    const finalWork = new FinalWork(req.body);
    await finalWork.save();

    res.status(201).json({
      success: true,
      message: 'Trabajo fin de estudios creado exitosamente',
      data: finalWork
    });
  } catch (error) {
    console.error('Error al crear trabajo fin de estudios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   PUT /api/final-works/:id
// @desc    Actualizar trabajo fin de estudios (reemplazo completo)
// @access  Private (admin, moderator, user)
router.put('/:id', [
  auth,
  authorize('admin', 'moderator', 'user'),
  body('title').trim().notEmpty().withMessage('El título es requerido'),
  body('author').trim().notEmpty().withMessage('El autor es requerido'),
  body('type').isIn(['tfg', 'tfm', 'thesis', 'other']).withMessage('Tipo de trabajo inválido'),
  body('defense_date').isISO8601().toDate().withMessage('Fecha de defensa inválida'),
  body('degree').optional({ checkFalsy: true }).trim(),
  body('grade').optional({ checkFalsy: true }).trim()
], handleValidationErrors, async (req, res) => {
  try {
    // Preparar los datos para reemplazo completo
    const updateData = {
      title: req.body.title,
      author: req.body.author,
      type: req.body.type,
      defense_date: req.body.defense_date,
      degree: req.body.degree || undefined,
      grade: req.body.grade || undefined
    };

    // Eliminar campos undefined para que Mongoose los elimine del documento
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const finalWork = await FinalWork.findByIdAndUpdate(
      req.params.id,
      { $set: updateData, $unset: getUnsetFields(updateData) },
      { new: true, runValidators: true, overwrite: false }
    );

    if (!finalWork) {
      return res.status(404).json({
        success: false,
        message: 'Trabajo fin de estudios no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Trabajo fin de estudios actualizado exitosamente',
      data: finalWork
    });
  } catch (error) {
    console.error('Error al actualizar trabajo fin de estudios:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID de trabajo inválido'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   DELETE /api/final-works/:id
// @desc    Eliminar trabajo fin de estudios
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const finalWork = await FinalWork.findByIdAndDelete(req.params.id);

    if (!finalWork) {
      return res.status(404).json({
        success: false,
        message: 'Trabajo fin de estudios no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Trabajo fin de estudios eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar trabajo fin de estudios:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID de trabajo inválido'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
