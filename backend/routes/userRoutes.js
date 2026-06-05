const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUsers, deleteUser } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 10, // Límite de 10 peticiones por IP
  message: { message: 'Demasiados intentos de inicio de sesión, por favor intenta de nuevo en 1 minuto' }
});

// Rutas para la gestión de usuarios
router.post('/login', loginLimiter, loginUser);
router.route('/').post(protect, adminOnly, registerUser).get(protect, adminOnly, getUsers);
router.route('/:id').delete(protect, adminOnly, deleteUser);

module.exports = router;
