const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verificarToken } = require('../middleware/auth');

// Rotas públicas
router.post('/registrar', authController.registrar);
router.post('/login', authController.login);

// Rotas protegidas
router.post('/logout', verificarToken, authController.logout);
router.get('/verificar', verificarToken, authController.verificarAuth);

module.exports = router;
