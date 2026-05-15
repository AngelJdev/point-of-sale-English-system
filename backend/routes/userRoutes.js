const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUsers, deleteUser } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Rutas para la gestión de usuarios
router.post('/login', loginUser);
router.route('/').post(protect, registerUser).get(protect, getUsers);
router.route('/:id').delete(protect, deleteUser);

module.exports = router;
