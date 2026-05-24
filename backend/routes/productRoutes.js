const express = require('express');
const router  = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// ── Middleware de subida de imágenes (Cloudinary + Multer) ────────────────
// uploadImage.single('imagen') procesa el campo "imagen" del FormData.
// Si no se envía imagen, el middleware simplemente deja pasar la petición
// y req.file quedará undefined (el controlador lo maneja).
const { uploadImage } = require('../config/cloudinary');

// Rutas base: /api/products
router.route('/')
  .get(getProducts)
  .post(uploadImage.single('imagen'), createProduct);   // ← multer inyecta req.file

// Rutas específicas con ID: /api/products/:id
router.route('/:id')
  .get(getProductById)
  .put(uploadImage.single('imagen'), updateProduct)     // ← multer inyecta req.file
  .delete(adminOnly, deleteProduct);

module.exports = router;
