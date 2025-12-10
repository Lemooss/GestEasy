const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');

// Todas as rotas requerem autenticação
router.use(verificarToken);

router.get('/pdf', exportController.exportarPDF);
router.get('/csv', exportController.exportarCSV);

module.exports = router;
