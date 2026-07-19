require('dotenv').config();
const mongoose = require('mongoose');
const Supplier = require('./models/Supplier');

const countSuppliers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const count = await Supplier.countDocuments();
    const suppliers = await Supplier.find({}, 'nombre');
    console.log(`Hay ${count} proveedores en la BD.`);
    console.log(suppliers.map(s => s.nombre).join(', '));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
countSuppliers();
