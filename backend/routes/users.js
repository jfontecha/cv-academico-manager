const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/authorize');

const router = express.Router();

// NOTA: Se ha removido temporalmente la autenticación de algunas rutas para propósitos de demo
// En producción, todas las rutas CRUD de usuarios deben estar protegidas con auth middleware

// @route   POST /api/users/register
// @desc    Registrar nuevo usuario
// @access  Public
router.post('/register', [
  check('username', 'El nombre de usuario es requerido')
    .notEmpty()
    .isLength({ min: 3, max: 30 }),
  check('email', 'Por favor ingrese un email válido')
    .isEmail(),
  check('password', 'La contraseña debe tener al menos 6 caracteres')
    .isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Datos inválidos',
        errors: errors.array() 
      });
    }

    const { username, email, password, role } = req.body;

    // Verificar si el usuario ya existe
    let user = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (user) {
      return res.status(400).json({ 
        success: false, 
        message: 'El usuario o email ya existe' 
      });
    }

    // Crear nuevo usuario
    user = new User({
      username,
      email,
      password,
      role: role || 'user'
    });

    await user.save();

    // Crear JWT
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({
          success: true,
          message: 'Usuario registrado exitosamente',
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          }
        });
      }
    );
  } catch (error) {
    console.error('Error en registro:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Error del servidor' 
    });
  }
});

// @route   POST /api/users/login
// @desc    Iniciar sesión
// @access  Public
router.post('/login', [
  check('email', 'Por favor ingrese un email válido').isEmail(),
  check('password', 'La contraseña es requerida').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Datos inválidos',
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Verificar si el usuario existe
    let user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Credenciales inválidas' 
      });
    }

    // Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Credenciales inválidas' 
      });
    }

    // Actualizar último acceso
    user.lastAccess = new Date();
    await user.save();

    // Crear JWT
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({
          success: true,
          message: 'Login exitoso',
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            lastAccess: user.lastAccess,
            createdAt: user.createdAt
          }
        });
      }
    );
  } catch (error) {
    console.error('Error en login:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Error del servidor' 
    });
  }
});

// @route   GET /api/users/profile
// @desc    Obtener perfil del usuario
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Error del servidor' 
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Actualizar perfil del usuario
// @access  Private
router.put('/profile', [
  auth,
  check('username', 'El nombre de usuario debe tener entre 3 y 30 caracteres')
    .optional()
    .isLength({ min: 3, max: 30 }),
  check('email', 'Por favor ingrese un email válido')
    .optional()
    .isEmail(),
  check('role', 'El rol debe ser user, admin, moderator o guest')
    .optional()
    .isIn(['user', 'admin', 'moderator', 'guest'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Datos inválidos',
        errors: errors.array() 
      });
    }

    const { username, email, role } = req.body;
    const userId = req.user.id;

    // Verificar si el usuario existe
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }

    // Verificar que el nuevo username/email no esté en uso
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'El nombre de usuario ya está en uso' 
        });
      }
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'El email ya está en uso' 
        });
      }
    }

    // Actualizar campos
    if (username) user.username = username;
    if (email) user.email = email;
    if (role) user.role = role;

    await user.save();

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        lastAccess: user.lastAccess
      }
    });
  } catch (error) {
    console.error('Error actualizando perfil:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Error del servidor' 
    });
  }
});

// @route   PUT /api/users/change-password
// @desc    Cambiar contraseña del usuario
// @access  Private
router.put('/change-password', [
  auth,
  check('currentPassword', 'La contraseña actual es requerida').exists(),
  check('newPassword', 'La nueva contraseña debe tener al menos 6 caracteres')
    .isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Datos inválidos',
        errors: errors.array() 
      });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Obtener usuario con contraseña
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }

    // Verificar contraseña actual
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Contraseña actual incorrecta' 
      });
    }

    // Actualizar contraseña
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error cambiando contraseña:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Error del servidor' 
    });
  }
});

// @route   POST /api/users
// @desc    Crear nuevo usuario (solo admin)
// @access  Private
router.post('/', [
  auth,
  check('username', 'El nombre de usuario es requerido')
    .notEmpty()
    .isLength({ min: 3, max: 30 }),
  check('email', 'Por favor ingrese un email válido')
    .isEmail(),
  check('password', 'La contraseña debe tener al menos 6 caracteres')
    .isLength({ min: 6 }),
  check('role', 'El rol debe ser user, admin, moderator o guest')
    .optional()
    .isIn(['user', 'admin', 'moderator', 'guest'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Datos inválidos',
        errors: errors.array() 
      });
    }

    const { username, email, password, role } = req.body;

    // Verificar si el usuario ya existe
    let existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'El usuario o email ya existe' 
      });
    }

    // Crear nuevo usuario
    const user = new User({
      username,
      email,
      password,
      role: role || 'user'
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: user
    });
  } catch (error) {
    console.error('Error creando usuario:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Error del servidor' 
    });
  }
});

// @route   GET /api/users
// @desc    Obtener todos los usuarios (solo usuarios autenticados)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    
    // Construir filtros
    const filters = {};
    
    if (search) {
      filters.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      filters.role = role;
    }
    
    // Calcular paginación
    const skip = (page - 1) * limit;
    const total = await User.countDocuments(filters);
    const users = await User.find(filters)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Error del servidor' 
    });
  }
});

// @route   GET /api/users/:id
// @desc    Obtener usuario por ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error obteniendo usuario:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Error del servidor' 
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Actualizar usuario por ID (solo admin)
// @access  Private
router.put('/:id', [
  auth,
  check('username', 'El nombre de usuario debe tener entre 3 y 30 caracteres')
    .optional()
    .isLength({ min: 3, max: 30 }),
  check('email', 'Por favor ingrese un email válido')
    .optional()
    .isEmail(),
  check('role', 'El rol debe ser user, admin, moderator o guest')
    .optional()
    .isIn(['user', 'admin', 'moderator', 'guest'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Datos inválidos',
        errors: errors.array() 
      });
    }

    const { username, email, role } = req.body;
    const userId = req.params.id;

    // Verificar si el usuario existe
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }

    // Verificar que el nuevo username/email no esté en uso
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(400).json({ 
          success: false, 
          message: 'El nombre de usuario ya está en uso' 
        });
      }
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(400).json({ 
          success: false, 
          message: 'El email ya está en uso' 
        });
      }
    }

    // Actualizar campos
    if (username) user.username = username;
    if (email) user.email = email;
    if (role) user.role = role;

    await user.save();

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: user
    });
  } catch (error) {
    console.error('Error actualizando usuario:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Error del servidor' 
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Eliminar usuario (solo admin)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    await User.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando usuario:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Error del servidor' 
    });
  }
});

module.exports = router;
