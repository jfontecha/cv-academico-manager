const express = require('express');
const router = express.Router();
const Publication = require('../models/Publication');
const Project = require('../models/Project');
const TeachingClass = require('../models/TeachingClass');
const TeachingInnovation = require('../models/TeachingInnovation');
const FinalWork = require('../models/FinalWork');
const auth = require('../middleware/auth');

// @route   GET api/stats/last-update
// @desc    Obtener la última actualización de cualquier elemento del CV
// @access  Private
router.get('/last-update', auth, async (req, res) => {
  try {
    // Array para almacenar todas las fechas de actualización
    const updateDates = [];

    // Obtener las fechas más recientes de cada colección
    const collections = [
      { model: Publication, name: 'publications' },
      { model: Project, name: 'projects' },
      { model: TeachingClass, name: 'teachingClasses' },
      { model: TeachingInnovation, name: 'teachingInnovation' },
      { model: FinalWork, name: 'finalWorks' }
    ];

    // Buscar la fecha más reciente en cada colección
    for (const collection of collections) {
      try {
        const latestDoc = await collection.model
          .findOne()
          .sort({ updatedAt: -1 })
          .select('updatedAt')
          .lean();

        if (latestDoc && latestDoc.updatedAt) {
          updateDates.push({
            collection: collection.name,
            updatedAt: latestDoc.updatedAt
          });
        }
      } catch (error) {
        console.error(`Error al obtener fecha de ${collection.name}:`, error);
      }
    }

    // Encontrar la fecha más reciente de todas las colecciones
    let lastUpdate = null;
    let lastUpdateCollection = null;

    if (updateDates.length > 0) {
      const mostRecent = updateDates.reduce((latest, current) => {
        return new Date(current.updatedAt) > new Date(latest.updatedAt) ? current : latest;
      });

      lastUpdate = mostRecent.updatedAt;
      lastUpdateCollection = mostRecent.collection;
    }

    res.json({
      success: true,
      data: {
        lastUpdate,
        lastUpdateCollection,
        collectionsChecked: collections.length,
        updatesFound: updateDates.length
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas de actualización:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;