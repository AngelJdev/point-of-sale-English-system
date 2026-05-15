const fs = require('fs');
const https = require('https');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');

const images = [
  { name: 'balatas', url: 'https://images.unsplash.com/photo-1486262715619-679ce4e808cd?q=80&w=800', match: /Balatas/i },
  { name: 'aceite', url: 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?q=80&w=800', match: /Aceite|Líquido|Anticongelante/i },
  { name: 'bateria', url: 'https://images.unsplash.com/photo-1620916053303-347ff6bdc91a?q=80&w=800', match: /Batería/i },
  { name: 'bujias', url: 'https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?q=80&w=800', match: /Bujías|Bomba|Banda/i },
  { name: 'amortiguador', url: 'https://images.unsplash.com/photo-1600705722908-bab1e61c0b4d?q=80&w=800', match: /Amortiguador/i },
  { name: 'filtro', url: 'https://images.unsplash.com/photo-1635832715878-831e5ed17436?q=80&w=800', match: /Filtro/i }
];

const destFolder = path.join(__dirname, '../frontend/public/images');
if (!fs.existsSync(destFolder)) {
  fs.mkdirSync(destFolder, { recursive: true });
}

const downloadImage = (url, filepath) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, (res2) => {
          res2.pipe(fs.createWriteStream(filepath))
             .on('error', reject)
             .once('close', () => resolve(filepath));
        }).on('error', reject);
      } else if (res.statusCode === 200) {
        res.pipe(fs.createWriteStream(filepath))
           .on('error', reject)
           .once('close', () => resolve(filepath));
      } else {
        res.resume();
        reject(new Error(`Fallo con status code: ${res.statusCode}`));
      }
    }).on('error', reject);
  });
};

const updateDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const products = await Product.find({});
    
    for (let img of images) {
      try {
        console.log(`Descargando ${img.name}.jpg...`);
        await downloadImage(img.url, path.join(destFolder, `${img.name}.jpg`));
      } catch (e) {
        console.error(`Fallo al descargar ${img.name}: ${e.message}`);
      }
    }

    let count = 0;
    for (let product of products) {
      let foundImg = 'https://m.media-amazon.com/images/I/41M1iT9G-VL._AC_UF894,1000_QL80_.jpg'; // fallback
      for (let img of images) {
        if (img.match.test(product.nombre)) {
          foundImg = `/images/${img.name}.jpg`;
          break;
        }
      }
      product.imageUrl = foundImg;
      await product.save();
      count++;
    }
    console.log(`✅ Base de datos actualizada con imágenes locales guardadas en public/images para ${count} productos.`);
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

updateDB();
