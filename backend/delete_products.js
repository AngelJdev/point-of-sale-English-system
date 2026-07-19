require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const deleteProducts = async () => {
  try {
    console.log('⏳ Conectando a la base de datos...');
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('🗑️ Eliminando todos los productos...');
    const result = await Product.deleteMany({});
    
    console.log(`✅ ¡Eliminación exitosa! Se eliminaron ${result.deletedCount} productos de la base de datos.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al eliminar los productos:', error);
    process.exit(1);
  }
};

deleteProducts();
