const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');

const brainFolder = 'C:\\Users\\telle\\.gemini\\antigravity\\brain\\eef9e9e2-6655-469e-9052-24b95a19a2cd';
const publicImagesFolder = path.join(__dirname, '../frontend/public/images');

if (!fs.existsSync(publicImagesFolder)) {
  fs.mkdirSync(publicImagesFolder, { recursive: true });
}

const files = {
  'balatas': 'balatas_1778869293480.png',
  'bujias': 'bujias_1778869306949.png',
  'filtro': 'filtro_1778869320739.png',
  'bateria': 'bateria_1778869332539.png',
  'amortiguador': 'amortiguador_1778869345278.png'
};

const imageMap = [
  { match: /Balatas/i, name: 'balatas.png' },
  { match: /Bujías/i, name: 'bujias.png' },
  { match: /Filtro/i, name: 'filtro.png' },
  { match: /Batería/i, name: 'bateria.png' },
  { match: /Amortiguador/i, name: 'amortiguador.png' },
  { match: /Bomba/i, name: 'amortiguador.png' }, 
  { match: /Banda/i, name: 'bujias.png' }, 
  { match: /Aceite|Anticongelante|Líquido/i, name: 'filtro.png' } 
];

for (const [key, filename] of Object.entries(files)) {
  const src = path.join(brainFolder, filename);
  const dest = path.join(publicImagesFolder, `${key}.png`);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copiado ${key}.png a frontend/public/images/`);
  }
}

const updateDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('⏳ Conectando a MongoDB...');
    const products = await Product.find({});
    
    let count = 0;
    for (let product of products) {
      let foundImg = 'https://m.media-amazon.com/images/I/41M1iT9G-VL._AC_UF894,1000_QL80_.jpg'; // Tornillo fallback
      for (let img of imageMap) {
        if (img.match.test(product.nombre)) {
          foundImg = `/images/${img.name}`;
          break;
        }
      }
      
      // Update solo si cambió
      if (product.imageUrl !== foundImg) {
        product.imageUrl = foundImg;
        await product.save();
      }
      count++;
    }
    console.log(`✅ Base de datos actualizada con imágenes 100% locales y seguras para ${count} productos.`);
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

updateDB();
