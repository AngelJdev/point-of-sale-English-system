const fs = require('fs');
const https = require('https');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');

// URLs directas de Wikipedia Commons que SÍ existen y son fotos de refacciones
const images = [
  { name: 'balatas', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Brake_pad.jpg/800px-Brake_pad.jpg', match: /Balatas/i },
  { name: 'bujias', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Spark_plug.jpg/800px-Spark_plug.jpg', match: /Bujías/i },
  { name: 'filtro_aceite', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Oil_filter.jpg/800px-Oil_filter.jpg', match: /Filtro de Aceite/i },
  { name: 'bateria', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Car_battery.jpg/800px-Car_battery.jpg', match: /Batería/i },
  { name: 'amortiguador', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Shock_absorber.jpg/800px-Shock_absorber.jpg', match: /Amortiguador/i },
  { name: 'bomba_agua', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Water_pump_for_car_engine.jpg/800px-Water_pump_for_car_engine.jpg', match: /Bomba/i },
  { name: 'banda', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Timing_belt_and_pulleys.jpg/800px-Timing_belt_and_pulleys.jpg', match: /Banda/i },
  { name: 'liquido_frenos', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Brake_fluid.jpg/800px-Brake_fluid.jpg', match: /Líquido|Aceite/i }
];

const destFolder = path.join(__dirname, '../frontend/public/images');
if (!fs.existsSync(destFolder)) {
  fs.mkdirSync(destFolder, { recursive: true });
}

const downloadImage = (url, filepath) => {
  return new Promise((resolve, reject) => {
    const options = {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
      }
    };
    https.get(url, options, (res) => {
      if (res.statusCode === 200) {
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
      // Imagen del tornillo como default si no hace match
      let foundImg = 'https://m.media-amazon.com/images/I/41M1iT9G-VL._AC_UF894,1000_QL80_.jpg';
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
