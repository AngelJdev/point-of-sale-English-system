const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Obtener el token del header
      token = req.headers.authorization.split(' ')[1];

      // Decodificar y verificar el token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'antigravity_secret_123');

      // Buscar al usuario y excluir la contraseña, adjuntarlo a req.user
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'No autorizado, token fallido o expirado' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'No autorizado, no hay token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador' });
  }
};

module.exports = { protect, adminOnly };
