const mongoose = require('mongoose');
const TeachingClass = require('./models/TeachingClass');
require('dotenv').config();

// Configuración de MongoDB
const MONGODB_URI = process.env.MONGODB_URI;

async function migrateTeachingClassesLanguage() {
  try {
    if (!MONGODB_URI) {
      console.error('❌ ERROR: MONGODB_URI no está configurado');
      return;
    }

    // Conectar a MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado a MongoDB');

    // Actualizar todas las clases que no tengan idioma definido
    const result = await TeachingClass.updateMany(
      { language: { $exists: false } },
      { $set: { language: 'castellano' } }
    );

    console.log(`Clases actualizadas con idioma: ${result.modifiedCount}`);
    
    // Verificar el resultado
    const classes = await TeachingClass.find({}, 'subject language category academic_year').limit(5);
    console.log('Primeras 5 clases con su idioma y categoría:');
    classes.forEach(classItem => {
      console.log(`- ${classItem.subject} (${classItem.academic_year}): ${classItem.language} | ${classItem.category}`);
    });

  } catch (error) {
    console.error('Error en la migración:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado de MongoDB');
  }
}

// Ejecutar la migración
migrateTeachingClassesLanguage();