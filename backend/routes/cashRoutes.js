const express = require('express');
const router = express.Router();
const { getCurrentRegister, openRegister, addExpense, closeRegister, openDrawer } = require('../controllers/cashController');
const { protect } = require('../middleware/authMiddleware');

router.get('/current', protect, getCurrentRegister);
router.post('/open', protect, openRegister);
router.post('/expense', protect, addExpense);
router.post('/close', protect, closeRegister);
router.post('/open-drawer', protect, openDrawer); // Abre el cajón de dinero físico (ESC/POS)

module.exports = router;
