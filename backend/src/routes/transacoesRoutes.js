const express = require('express');
const router = express.Router();
const transacoesController = require('../controllers/transacoesController');

// Todas as rotas requerem autenticação
router.use(verificarToken);

router.get('/', transacoesController.listar);
router.get('/:id', transacoesController.buscarPorId);
router.post('/', transacoesController.criar);
router.put('/:id', transacoesController.atualizar);
router.delete('/:id', transacoesController.deletar);

module.exports = router;
