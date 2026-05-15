const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const seedStaff = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const existing = await User.findOne({ usuario: 'cajero' });
    if (!existing) {
      await User.create({
        nombre: 'Cajero Empleado',
        usuario: 'cajero',
        password: 'password123',
        role: 'staff'
      });
      console.log('✅ Usuario básico (staff) creado: cajero / password123');
    } else {
      console.log('✅ El usuario cajero ya existe.');
    }
    process.exit();
  } catch (err) {
    console.error('Error al crear cajero:', err);
    process.exit(1);
  }
};

seedStaff();
