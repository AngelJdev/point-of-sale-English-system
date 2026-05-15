const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  // Asegúrate de tener JWT_SECRET en el .env, si no, usa uno de respaldo
  return jwt.sign({ id }, process.env.JWT_SECRET || 'antigravity_secret_123', {
    expiresIn: '30d',
  });
};

// @desc    Registrar un nuevo usuario
// @route   POST /api/users
// @access  Private/Admin
const registerUser = async (req, res) => {
  const { nombre, usuario, password, role } = req.body;

  try {
    const userExists = await User.findOne({ usuario });

    if (userExists) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    const user = await User.create({
      nombre,
      usuario,
      password,
      role
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        nombre: user.nombre,
        usuario: user.usuario,
        role: user.role
      });
    } else {
      res.status(400).json({ message: 'Datos de usuario inválidos' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor al registrar usuario', error: error.message });
  }
};

// @desc    Autenticar usuario y conseguir token
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  const { usuario, password } = req.body;

  try {
    const user = await User.findOne({ usuario });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        nombre: user.nombre,
        usuario: user.usuario,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor al intentar iniciar sesión' });
  }
};

// @desc    Obtener todos los usuarios
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    // Retornamos todos los usuarios sin la contraseña
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};

// @desc    Eliminar un usuario
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      await user.deleteOne();
      res.json({ message: 'Usuario eliminado' });
    } else {
      res.status(404).json({ message: 'Usuario no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar usuario' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUsers,
  deleteUser
};
