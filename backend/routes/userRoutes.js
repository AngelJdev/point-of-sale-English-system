const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUsers, deleteUser } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Límite de 5 peticiones por IP
  message: { message: 'Demasiados intentos de inicio de sesión, por favor intenta de nuevo en 15 minutos' }
});

// Rutas para la gestión de usuarios
router.post('/login', loginUser);
router.route('/').post(protect, adminOnly, registerUser).get(protect, adminOnly, getUsers);
router.route('/:id').delete(protect, adminOnly, deleteUser);

module.exports = router;
