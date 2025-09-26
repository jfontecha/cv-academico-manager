const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
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

// @route   GET /api/projects
// @desc    Obtener todos los proyectos
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      year = '',
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
        { participants: searchRegex },
        { entity: searchRegex }
      ];
    }

    if (year && year.trim()) {
      const yearNum = parseInt(year.trim());
      if (!isNaN(yearNum)) {
        const startYear = new Date(`${yearNum}-01-01`);
        const endYear = new Date(`${yearNum}-12-31`);
        filters.$or = filters.$or ? [
          ...filters.$or,
          { start_date: { $gte: startYear, $lte: endYear } },
          { end_date: { $gte: startYear, $lte: endYear } }
        ] : [
          { start_date: { $gte: startYear, $lte: endYear } },
          { end_date: { $gte: startYear, $lte: endYear } }
        ];
      }
    }

    // Configurar ordenamiento
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Configurar paginación
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = limit === 'all' ? 0 : Math.max(1, parseInt(limit));

    let query = Project.find(filters);
    
    if (limitNum > 0) {
      query = query.limit(limitNum).skip((pageNum - 1) * limitNum);
    }
    
    const projects = await query.sort(sortOptions);
    const total = await Project.countDocuments(filters);

    res.json({
      success: true,
      data: projects,
      pagination: {
        current: pageNum,
        pages: limitNum > 0 ? Math.ceil(total / limitNum) : 1,
        total
      }
    });
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/projects/stats
// @desc    Obtener estadísticas de proyectos
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const yearStats = await Project.aggregate([
      {
        $group: {
          _id: { $year: '$start_date' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 10 }
    ]);

    const totalProjects = await Project.countDocuments();
    const totalBudget = await Project.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$budget' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        yearStats,
        totalProjects,
        totalBudget: totalBudget[0]?.total || 0
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

// @route   GET /api/projects/:id
// @desc    Obtener proyecto por ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Error al obtener proyecto:', error);
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

// @route   POST /api/projects
// @desc    Crear nuevo proyecto
// @access  Private (admin, moderator, user)
router.post('/', [
  auth,
  authorize('admin', 'moderator', 'user'),
  body('title').trim().notEmpty().withMessage('El título es requerido'),
  body('funding_agency').trim().notEmpty().withMessage('La entidad financiadora es requerida'),
  body('principal_investigator').trim().notEmpty().withMessage('El investigador principal es requerido'),
  body('start_date').isISO8601().withMessage('Fecha de inicio inválida'),
  body('end_date').isISO8601().withMessage('Fecha de finalización inválida')
], handleValidationErrors, async (req, res) => {
  try {
    const project = new Project(req.body);
    await project.save();

    res.status(201).json({
      success: true,
      message: 'Proyecto creado exitosamente',
      data: project
    });
  } catch (error) {
    console.error('Error al crear proyecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   PUT /api/projects/:id
// @desc    Actualizar proyecto
// @access  Private (admin, moderator, user)
router.put('/:id', [
  auth,
  authorize('admin', 'moderator', 'user'),
  body('title').optional().trim().notEmpty().withMessage('El título no puede estar vacío'),
  body('start_date').optional().isISO8601().withMessage('Fecha de inicio inválida'),
  body('end_date').optional().isISO8601().withMessage('Fecha de finalización inválida')
], handleValidationErrors, async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Proyecto actualizado exitosamente',
      data: project
    });
  } catch (error) {
    console.error('Error al actualizar proyecto:', error);
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

// @route   DELETE /api/projects/:id
// @desc    Eliminar proyecto
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Proyecto eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar proyecto:', error);
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
