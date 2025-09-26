const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json());

// Conectar a MongoDB Cloud
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

connectDB();

// Rutas
app.use('/api/users', require('./routes/users'));
app.use('/api/publications', require('./routes/publications'));
app.use('/api/teaching-classes', require('./routes/teachingClasses'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/teaching-innovation', require('./routes/teachingInnovation'));
app.use('/api/final-works', require('./routes/finalWorks'));
app.use('/api/pdf', require('./routes/pdf'));
app.use('/api/stats', require('./routes/stats'));

// Ruta base
app.get('/', (req, res) => {
  res.json({ message: 'API del CV Académico funcionando correctamente' });
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Manejo de errores generales
app.use((error, req, res, next) => {
  console.error(error.stack);
  res.status(500).json({ message: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
