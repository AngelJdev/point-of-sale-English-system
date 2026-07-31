const express = require('express');
const router = express.Router();
const {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  payBalance,
  getClientTransactions,
  getClientHistory
} = require('../controllers/clientController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getClients)
  .post(protect, createClient);

router.route('/:id')
  .get(protect, getClientById)
  .put(protect, updateClient)
  .delete(protect, adminOnly, deleteClient);

router.post('/:id/pay', protect, payBalance);
router.get('/:id/transactions', protect, getClientTransactions);
router.get('/:id/history', protect, getClientHistory);

module.exports = router;
