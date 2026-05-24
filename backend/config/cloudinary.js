/**
 * cloudinary.js  ─  Configuración del SDK de Cloudinary
 * ─────────────────────────────────────────────────────
 * Las credenciales se leen desde variables de entorno definidas en el .env:
 *
 *   CLOUDINARY_CLOUD_NAME=tu_cloud_name
 *   CLOUDINARY_API_KEY=tu_api_key
 *   CLOUDINARY_API_SECRET=tu_api_secret
 *
 * Puedes encontrar estos valores en:
 *   https://console.cloudinary.com  →  "API Keys"
 */

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// ── 1. Configura el SDK con las credenciales del .env ─────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── 2. Define el almacenamiento en Cloudinary ─────────────────────────────
//    - folder: todas las imágenes van a "refaccionaria-inventario" en tu cuenta
//    - allowed_formats: solo acepta imágenes reales
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          'refaccionaria-inventario',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    transformation:  [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
  },
});

// ── 3. Middleware de Multer listo para usar en las rutas ───────────────────
// ── 3. Middleware de Multer listo para usar en las rutas ───────────────────
//    Límite de 10 MB por imagen (los celulares modernos sacan fotos pesadas)
const uploadImage = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  },
});

module.exports = { cloudinary, uploadImage };
