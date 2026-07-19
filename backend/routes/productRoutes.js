const express = require('express');
const router  = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  extractData,
  bulkUpdatePrices
} = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// ── Middleware de subida de imágenes (Cloudinary + Multer) ────────────────
const { uploadImage } = require('../config/cloudinary');

// Wrapper para capturar errores de multer (ej. falta de credenciales de Cloudinary en Vercel)
const handleUploadError = (uploadMiddleware) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err) {
        console.error('Error de subida de imagen:', err);
        return res.status(500).json({ 
          message: 'Error al subir la imagen. Verifica que CLOUDINARY_CLOUD_NAME y demás variables estén configuradas en Vercel.', 
          error: err.message 
        });
      }
      next();
    });
  };
};

// Rutas base: /api/products
router.route('/')
  .get(getProducts)
  .post(handleUploadError(uploadImage.single('imagen')), createProduct);

// Ruta de extracción de datos (Múltiples imágenes)
router.route('/extract-data')
  .post(handleUploadError(uploadImage.array('imagenes', 10)), extractData);

// Ruta de actualización masiva
router.route('/bulk/update-prices')
  .put(bulkUpdatePrices);

// Rutas específicas con ID: /api/products/:id
router.route('/:id')
  .get(getProductById)
  .put(handleUploadError(uploadImage.single('imagen')), updateProduct)
  .delete(adminOnly, deleteProduct);

module.exports = router;
