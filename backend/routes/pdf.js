const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');
const Publication = require('../models/Publication');
const Project = require('../models/Project');
const TeachingClass = require('../models/TeachingClass');
const TeachingInnovation = require('../models/TeachingInnovation');
const FinalWork = require('../models/FinalWork');
const auth = require('../middleware/auth');

// @route   GET /api/pdf/health
// @desc    Verificar que Puppeteer esté funcionando
// @access  Public
router.get('/health', async (req, res) => {
  try {
    console.log('🔍 Verificando salud de Puppeteer...');
    
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    const version = await browser.version();
    await browser.close();

    console.log('✅ Puppeteer funcionando correctamente, versión:', version);
    
    res.json({
      success: true,
      message: 'Puppeteer está funcionando correctamente',
      version: version,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error en verificación de Puppeteer:', {
      message: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Error en Puppeteer',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// @route   GET /api/pdf/generate
// @desc    Generar PDF completo del currículum
// @access  Private
router.get('/generate', auth, async (req, res) => {
  try {
    // Obtener todos los datos
    const [publications, projects, teachingClasses, teachingInnovation, finalWorks] = await Promise.all([
      Publication.find().sort({ year_publication: -1 }),
      Project.find().sort({ start_date: -1 }),
      TeachingClass.find().sort({ academic_year: -1 }),
      TeachingInnovation.find().sort({ year: -1 }),
      FinalWork.find().sort({ defense_date: -1 })
    ]);

    // Generar HTML para el PDF
    const htmlContent = generateCurriculumHTML({
      publications,
      projects,
      teachingClasses,
      teachingInnovation,
      finalWorks
    });

    // Generar PDF con Puppeteer - Configuración para producción
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });

    await browser.close();

    console.log('PDF autenticado generado exitosamente, tamaño:', pdfBuffer.length, 'bytes');
    console.log('Tipo de pdfBuffer:', typeof pdfBuffer, 'Es Buffer:', Buffer.isBuffer(pdfBuffer));

    // Asegurar que es un Buffer
    const finalBuffer = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);

    // Configurar headers para descarga
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="curriculum_jesus_fontecha.pdf"',
      'Content-Length': finalBuffer.length,
      'Cache-Control': 'no-cache'
    });

    res.end(finalBuffer, 'binary');

  } catch (error) {
    console.error('❌ Error detallado al generar PDF autenticado:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      message: 'Error al generar el PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
    });
  }
});

// @route   GET /api/pdf/public
// @desc    Generar PDF completo del currículum (versión pública temporal)
// @access  Public
router.get('/public', async (req, res) => {
  try {
    // Obtener todos los datos
    const [publications, projects, teachingClasses, teachingInnovation, finalWorks] = await Promise.all([
      Publication.find().sort({ year_publication: -1 }),
      Project.find().sort({ start_date: -1 }),
      TeachingClass.find().sort({ academic_year: -1 }),
      TeachingInnovation.find().sort({ year: -1 }),
      FinalWork.find().sort({ defense_date: -1 })
    ]);

    // Generar HTML para el PDF
    const htmlContent = generateCurriculumHTML({
      publications,
      projects,
      teachingClasses,
      teachingInnovation,
      finalWorks
    });

    // Generar PDF con Puppeteer - Configuración para producción
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });

    await browser.close();

    console.log('PDF público generado exitosamente, tamaño:', pdfBuffer.length, 'bytes');
    console.log('Tipo de pdfBuffer:', typeof pdfBuffer, 'Es Buffer:', Buffer.isBuffer(pdfBuffer));

    // Asegurar que es un Buffer
    const finalBuffer = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);

    // Configurar headers para descarga
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="curriculum_jesus_fontecha.pdf"',
      'Content-Length': finalBuffer.length,
      'Cache-Control': 'no-cache'
    });

    res.end(finalBuffer, 'binary');

  } catch (error) {
    console.error('❌ Error detallado al generar PDF público:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      message: 'Error al generar el PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
    });
  }
});

// Función para generar el HTML del currículum
function generateCurriculumHTML(data) {
  const { publications, projects, teachingClasses, teachingInnovation, finalWorks } = data;
  
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Currículum Vitae - Jesús Fontecha Diezma</title>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 100%;
                margin: 0;
                padding: 0;
            }
            
            .header {
                text-align: center;
                border-bottom: 3px solid #4F46E5;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            
            .header h1 {
                color: #4F46E5;
                font-size: 28px;
                margin: 0;
                font-weight: bold;
            }
            
            .header h2 {
                color: #666;
                font-size: 18px;
                margin: 5px 0;
                font-weight: normal;
            }
            
            .section {
                margin-bottom: 30px;
                page-break-inside: avoid;
            }
            
            .section-title {
                color: #4F46E5;
                font-size: 20px;
                font-weight: bold;
                border-bottom: 2px solid #4F46E5;
                padding-bottom: 5px;
                margin-bottom: 15px;
            }
            
            .item {
                margin-bottom: 15px;
                padding: 10px;
                border-left: 3px solid #E5E7EB;
                background-color: #F9FAFB;
            }
            
            .item-title {
                font-weight: bold;
                color: #1F2937;
                font-size: 14px;
                margin-bottom: 5px;
            }
            
            .item-details {
                font-size: 12px;
                color: #6B7280;
                margin-bottom: 3px;
            }
            
            .item-authors {
                font-style: italic;
                color: #374151;
                font-size: 12px;
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
                margin-bottom: 20px;
            }
            
            .stat-box {
                background: #F3F4F6;
                padding: 15px;
                border-radius: 8px;
                text-align: center;
            }
            
            .stat-number {
                font-size: 24px;
                font-weight: bold;
                color: #4F46E5;
            }
            
            .stat-label {
                font-size: 12px;
                color: #6B7280;
                margin-top: 5px;
            }
            
            .no-data {
                color: #9CA3AF;
                font-style: italic;
                text-align: center;
                padding: 20px;
            }
            
            @media print {
                body {
                    font-size: 12px;
                }
                .section {
                    page-break-inside: avoid;
                }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Jesús Fontecha Diezma</h1>
            <h2>Currículum Vitae Académico</h2>
            <p style="color: #666; font-size: 14px;">Generado el ${new Date().toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</p>
        </div>

        <!-- Resumen Estadístico -->
        <div class="section">
            <h3 class="section-title">Resumen</h3>
            <div class="stats-grid">
                <div class="stat-box">
                    <div class="stat-number">${publications.length}</div>
                    <div class="stat-label">Publicaciones</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">${projects.length}</div>
                    <div class="stat-label">Proyectos de Investigación</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">${teachingClasses.length}</div>
                    <div class="stat-label">Clases Impartidas</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">${teachingInnovation.length}</div>
                    <div class="stat-label">Proyectos Docentes</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">${finalWorks.length}</div>
                    <div class="stat-label">Trabajos Fin de Estudios</div>
                </div>
            </div>
        </div>

        <!-- Publicaciones -->
        <div class="section">
            <h3 class="section-title">Publicaciones</h3>
            ${publications.length > 0 ? publications.map(pub => `
                <div class="item">
                    <div class="item-title">${pub.title}</div>
                    <div class="item-details">
                        <strong>Tipo:</strong> ${pub.type} | 
                        <strong>Año:</strong> ${pub.year_publication} | 
                        <strong>Revista:</strong> ${pub.journal || 'N/A'}
                        ${pub.quartile ? ` | <strong>Cuartil:</strong> ${pub.quartile}` : ''}
                        ${pub.if ? ` | <strong>Factor Impacto:</strong> ${pub.if}` : ''}
                    </div>
                    ${pub.authors ? `<div class="item-authors">Autores: ${pub.authors}</div>` : ''}
                    ${pub.doi ? `<div class="item-details"><strong>DOI:</strong> ${pub.doi}</div>` : ''}
                </div>
            `).join('') : '<div class="no-data">No hay publicaciones registradas</div>'}
        </div>

        <!-- Proyectos de Investigación -->
        <div class="section">
            <h3 class="section-title">Proyectos de Investigación</h3>
            ${projects.length > 0 ? projects.map(project => `
                <div class="item">
                    <div class="item-title">${project.title}</div>
                    <div class="item-details">
                        <strong>Tipo:</strong> ${project.type} | 
                        <strong>Duración:</strong> ${new Date(project.start_date).getFullYear()} - ${project.end_date ? new Date(project.end_date).getFullYear() : 'Actualidad'}
                        ${project.budget ? ` | <strong>Presupuesto:</strong> ${project.budget.toLocaleString('es-ES')}€` : ''}
                    </div>
                    ${project.reference ? `<div class="item-details"><strong>Referencia:</strong> ${project.reference}</div>` : ''}
                    ${project.description ? `<div class="item-authors">${project.description}</div>` : ''}
                </div>
            `).join('') : '<div class="no-data">No hay proyectos de investigación registrados</div>'}
        </div>

        <!-- Clases Impartidas -->
        <div class="section">
            <h3 class="section-title">Clases Impartidas</h3>
            ${teachingClasses.length > 0 ? teachingClasses.map(classe => `
                <div class="item">
                    <div class="item-title">${classe.subject}</div>
                    <div class="item-details">
                        <strong>Año Académico:</strong> ${classe.academic_year} | 
                        <strong>Curso:</strong> ${classe.course} | 
                        <strong>Tipo:</strong> ${classe.type}
                        ${classe.hours ? ` | <strong>Horas:</strong> ${classe.hours}` : ''}
                    </div>
                    ${classe.degree ? `<div class="item-details"><strong>Titulación:</strong> ${classe.degree}</div>` : ''}
                </div>
            `).join('') : '<div class="no-data">No hay clases registradas</div>'}
        </div>

        <!-- Proyectos Docentes -->
        <div class="section">
            <h3 class="section-title">Proyectos de Innovación Docente</h3>
            ${teachingInnovation.length > 0 ? teachingInnovation.map(innovation => `
                <div class="item">
                    <div class="item-title">${innovation.title}</div>
                    <div class="item-details">
                        <strong>Año:</strong> ${innovation.year} | 
                        <strong>Tipo:</strong> ${innovation.type}
                    </div>
                    ${innovation.reference ? `<div class="item-details"><strong>Referencia:</strong> ${innovation.reference}</div>` : ''}
                    ${innovation.description ? `<div class="item-authors">${innovation.description}</div>` : ''}
                </div>
            `).join('') : '<div class="no-data">No hay proyectos de innovación docente registrados</div>'}
        </div>

        <!-- Trabajos Fin de Estudios -->
        <div class="section">
            <h3 class="section-title">Trabajos Fin de Estudios Dirigidos</h3>
            ${finalWorks.length > 0 ? finalWorks.map(work => `
                <div class="item">
                    <div class="item-title">${work.title}</div>
                    <div class="item-details">
                        <strong>Tipo:</strong> ${work.type} | 
                        <strong>Defensa:</strong> ${new Date(work.defense_date).toLocaleDateString('es-ES')} | 
                        <strong>Estudiante:</strong> ${work.student_name}
                        ${work.grade ? ` | <strong>Calificación:</strong> ${work.grade}` : ''}
                    </div>
                    ${work.degree ? `<div class="item-details"><strong>Titulación:</strong> ${work.degree}</div>` : ''}
                </div>
            `).join('') : '<div class="no-data">No hay trabajos fin de estudios registrados</div>'}
        </div>

        <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #E5E7EB; padding-top: 20px;">
            <p>Este documento fue generado automáticamente desde el sistema de gestión de CV académico</p>
        </div>
    </body>
    </html>
  `;
}

module.exports = router;