const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Publication = require('../models/Publication');
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

// @route   GET /api/publications
// @desc    Obtener todas las publicaciones
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      type = '', 
      year = '',
      quartile = '',
      sortBy = 'year_publication',
      sortOrder = 'desc'
    } = req.query;
    
    // Construir filtros
    const filters = {};
    
    // Mejorar la búsqueda para usar regex si hay término de búsqueda
    if (search && search.trim()) {
      // Usar regex para búsqueda más flexible que funciona sin índice de texto
      const searchRegex = new RegExp(search.trim(), 'i');
      filters.$or = [
        { title: searchRegex },
        { authors: searchRegex },
        { publication: searchRegex },
        { info_publication: searchRegex }
      ];
    }
    
    if (type && type.trim()) {
      filters.type = type.trim();
    }

    if (year && year.trim()) {
      const yearNum = parseInt(year.trim());
      if (!isNaN(yearNum)) {
        filters.year_publication = yearNum;
      }
    }

    if (quartile && quartile.trim()) {
      filters.quartile = quartile.trim();
    }

    // Configurar ordenamiento
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Configurar paginación
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = limit === 'all' ? 0 : Math.max(1, parseInt(limit));

    let query = Publication.find(filters);
    
    if (limitNum > 0) {
      query = query.limit(limitNum).skip((pageNum - 1) * limitNum);
    }
    
    const publications = await query.sort(sortOptions);
    const total = await Publication.countDocuments(filters);

    res.json({
      success: true,
      data: publications,
      pagination: {
        current: pageNum,
        pages: limitNum > 0 ? Math.ceil(total / limitNum) : 1,
        total
      }
    });
  } catch (error) {
    console.error('Error al obtener publicaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/publications/stats
// @desc    Obtener estadísticas de publicaciones
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const typeStats = await Publication.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    const yearStats = await Publication.aggregate([
      {
        $group: {
          _id: '$year_publication',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 10 }
    ]);

    const quartileStats = await Publication.aggregate([
      { $match: { quartile: { $ne: '' } } },
      {
        $group: {
          _id: '$quartile',
          count: { $sum: 1 },
          avgIF: { $avg: '$if' }
        }
      }
    ]);

    const totalPublications = await Publication.countDocuments();

    res.json({
      success: true,
      data: {
        typeStats,
        yearStats,
        quartileStats,
        totalPublications
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

// @route   GET /api/publications/:id
// @desc    Obtener publicación por ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const publication = await Publication.findById(req.params.id);
    
    if (!publication) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    res.json({
      success: true,
      data: publication
    });
  } catch (error) {
    console.error('Error al obtener publicación:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID de publicación inválido'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   POST /api/publications
// @desc    Crear nueva publicación
// @access  Private (admin, moderator, user)
router.post('/', [
  auth,
  authorize('admin', 'moderator', 'user'),
  body('title').trim().notEmpty().withMessage('El título es requerido'),
  body('authors').trim().notEmpty().withMessage('Los autores son requeridos'),
  body('type').isIn(['journal', 'conference', 'keynote', 'book', 'chapter', 'other']).withMessage('Tipo inválido'),
  body('publication').trim().notEmpty().withMessage('La publicación es requerida'),
  body('year_publication').isInt({ min: 1990, max: new Date().getFullYear() + 5 }).withMessage('Año inválido')
], handleValidationErrors, async (req, res) => {
  try {
    const publication = new Publication(req.body);
    await publication.save();

    res.status(201).json({
      success: true,
      message: 'Publicación creada exitosamente',
      data: publication
    });
  } catch (error) {
    console.error('Error al crear publicación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   PUT /api/publications/:id
// @desc    Actualizar publicación
// @access  Private (admin, moderator, user)
router.put('/:id', [
  auth,
  authorize('admin', 'moderator', 'user'),
  body('title').optional().trim().notEmpty().withMessage('El título no puede estar vacío'),
  body('authors').optional().trim().notEmpty().withMessage('Los autores no pueden estar vacíos'),
  body('type').optional().isIn(['journal', 'conference', 'keynote', 'book', 'chapter', 'other']).withMessage('Tipo inválido'),
  body('year_publication').optional().isInt({ min: 1990, max: new Date().getFullYear() + 5 }).withMessage('Año inválido')
], handleValidationErrors, async (req, res) => {
  try {
    const publication = await Publication.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!publication) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Publicación actualizada exitosamente',
      data: publication
    });
  } catch (error) {
    console.error('Error al actualizar publicación:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID de publicación inválido'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   DELETE /api/publications/:id
// @desc    Eliminar publicación
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const publication = await Publication.findByIdAndDelete(req.params.id);

    if (!publication) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Publicación eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar publicación:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID de publicación inválido'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
