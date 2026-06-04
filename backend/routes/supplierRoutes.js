const express = require('express');
const router = express.Router();
const {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  addInvoice,
  paySupplier,
  getSupplierTransactions
} = require('../controllers/supplierController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Solo administradores o personal autorizado debería manejar proveedores, 
// pero usaremos `protect` para que el usuario que lo requiere (el admin) lo pueda hacer. 
// Asumo que si es dueño, usa admin.
router.route('/')
  .get(protect, adminOnly, getSuppliers)
  .post(protect, adminOnly, createSupplier);

router.route('/:id')
  .get(protect, adminOnly, getSupplierById)
  .put(protect, adminOnly, updateSupplier)
  .delete(protect, adminOnly, deleteSupplier);

router.post('/:id/invoice', protect, adminOnly, addInvoice);
router.post('/:id/pay', protect, adminOnly, paySupplier);
router.get('/:id/transactions', protect, adminOnly, getSupplierTransactions);

module.exports = router;
