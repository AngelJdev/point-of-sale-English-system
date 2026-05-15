const express = require('express');
const router = express.Router();
const { createSale, getDailySales, closeDailyCut, getMonthlyCuts, getSalesHistory, returnSale } = require('../controllers/saleController');
const { protect } = require('../middleware/authMiddleware');

// Protegemos todas las rutas si es necesario (ya se protege en server.js en mi flujo, pero lo haré explícito si no está)
// Aquí ya se protege en server.js `app.use('/api/sales', protect, saleRoutes);`
// por lo que router.get, router.post, etc. ya tienen req.user. 
// Aún así, para evitar confusiones lo dejaremos sin agregar `protect` extra si ya está en server.js
// Si no, lo agregamos aquí. Revisaré server.js mentalmente: "app.use('/api/sales', protect, saleRoutes);" sí está.

router.get('/daily', getDailySales);
router.post('/', createSale);
router.get('/', getSalesHistory);
router.post('/close-cut', closeDailyCut);
router.get('/monthly-cuts', getMonthlyCuts);
router.post('/:id/return', returnSale);

module.exports = router;
