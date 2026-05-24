const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Rutas base: /api/products
router.route('/')
  .get(getProducts)
  .post(createProduct);

// Rutas específicas con ID: /api/products/:id
router.route('/:id')
  .get(getProductById)
  .put(updateProduct)
  .delete(adminOnly, deleteProduct);

module.exports = router;
