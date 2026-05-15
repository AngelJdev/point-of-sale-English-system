const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const existingAdmin = await User.findOne({ usuario: 'admin' });
    if (!existingAdmin) {
      await User.create({
        nombre: 'Administrador Principal',
        usuario: 'admin',
        password: 'password123',
        role: 'admin'
      });
      console.log('✅ Usuario Administrador creado exitosamente: admin / password123');
    } else {
      console.log('✅ El usuario admin ya existe.');
    }
    process.exit();
  } catch (err) {
    console.error('Error al crear el admin:', err);
    process.exit(1);
  }
};

seedAdmin();
