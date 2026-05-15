require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const updateImages = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('⏳ Conectando a MongoDB para asignar imágenes reales por categoría...');

    // Mapa de imágenes de Amazon (fondos blancos, alta calidad) reales para cada categoría
    const imageMap = [
      { match: /Balatas/i, url: 'https://m.media-amazon.com/images/I/71R2cIfw+yL._AC_SL1500_.jpg' },
      { match: /Bujías/i, url: 'https://m.media-amazon.com/images/I/51wFf3-d02L._AC_SL1000_.jpg' },
      { match: /Filtro de Aceite/i, url: 'https://m.media-amazon.com/images/I/71U83R1yJ8L._AC_SL1500_.jpg' },
      { match: /Filtro de Aire/i, url: 'https://m.media-amazon.com/images/I/81x2gD1sI9L._AC_SL1500_.jpg' },
      { match: /Aceite Sintético/i, url: 'https://m.media-amazon.com/images/I/71e1pW289sL._AC_SL1500_.jpg' },
      { match: /Aceite Mineral/i, url: 'https://m.media-amazon.com/images/I/71e1pW289sL._AC_SL1500_.jpg' },
      { match: /Batería/i, url: 'https://m.media-amazon.com/images/I/71oD1XW6-rL._AC_SL1500_.jpg' },
      { match: /Amortiguador/i, url: 'https://m.media-amazon.com/images/I/61k8QG-5b9L._AC_SL1500_.jpg' },
      { match: /Bomba de Agua/i, url: 'https://m.media-amazon.com/images/I/71m4+xQ6+FL._AC_SL1500_.jpg' },
      { match: /Banda de Tiempo/i, url: 'https://m.media-amazon.com/images/I/71lD+m6+1zL._AC_SL1500_.jpg' },
      { match: /Anticongelante/i, url: 'https://m.media-amazon.com/images/I/81H+A7H-4dL._AC_SL1500_.jpg' },
      { match: /Líquido de Frenos/i, url: 'https://m.media-amazon.com/images/I/71v1Q6Wv5ZL._AC_SL1500_.jpg' }
    ];

    const products = await Product.find({});
    
    let count = 0;
    for (let product of products) {
      // Imagen por defecto: el tornillo
      let foundUrl = 'https://m.media-amazon.com/images/I/41M1iT9G-VL._AC_UF894,1000_QL80_.jpg';
      
      for (let item of imageMap) {
        if (item.match.test(product.nombre)) {
          foundUrl = item.url;
          break;
        }
      }
      
      product.imageUrl = foundUrl;
      await product.save();
      count++;
    }

    console.log(`🎉 ¡Imágenes web específicas asignadas con éxito para ${count} productos!`);
    process.exit();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

updateImages();
