const User = require('../models/User');

// Middleware para verificar roles específicos
const authorize = (...roles) => {
  return async (req, res, next) => {
    try {
      // Verificar si hay un usuario autenticado (debe haberse ejecutado el middleware 'auth' antes)
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Acceso no autorizado'
        });
      }

      // Obtener el usuario completo de la base de datos
      const user = await User.findById(req.user.id).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Verificar si el usuario tiene uno de los roles permitidos
      if (!roles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos suficientes para realizar esta acción'
        });
      }

      // Agregar el usuario completo al request para uso posterior
      req.currentUser = user;
      next();
    } catch (error) {
      console.error('Error en middleware de autorización:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  };
};

// Middleware específicos para diferentes tipos de permisos
const requireAdmin = authorize('admin');
const requireAdminOrModerator = authorize('admin', 'moderator');
const requireAdminModeratorOrUser = authorize('admin', 'moderator', 'user');

module.exports = {
  authorize,
  requireAdmin,
  requireAdminOrModerator,
  requireAdminModeratorOrUser
};