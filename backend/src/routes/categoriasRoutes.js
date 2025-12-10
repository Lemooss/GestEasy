const express = require('express');
const router = express.Router();
const categoriasController = require('../controllers/categoriasController');
const { verificarToken } = require('../middleware/auth');

// Todas as rotas requerem autenticação
router.use(verificarToken);

router.get('/', categoriasController.listar);
router.get('/:id', categoriasController.buscarPorId);
router.post('/', categoriasController.criar);
router.put('/:id', categoriasController.atualizar);
router.delete('/:id', categoriasController.deletar);

module.exports = router;
