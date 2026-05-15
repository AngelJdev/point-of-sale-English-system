require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const updateImages = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('⏳ Conectando a MongoDB...');
    
    // Asignamos la imagen del tornillo como ejemplo base para todos los productos
    const defaultImageUrl = 'https://m.media-amazon.com/images/I/41M1iT9G-VL._AC_UF894,1000_QL80_.jpg';
    
    await Product.updateMany({}, { 
      $set: { 
        imageUrl: defaultImageUrl 
      } 
    });

    console.log(`🎉 ¡Imágenes web actualizadas con éxito para los 1000 productos!`);
    process.exit();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

updateImages();
