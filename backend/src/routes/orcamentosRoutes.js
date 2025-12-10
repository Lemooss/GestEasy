const express = require('express');
const router = express.Router();
const orcamentosController = require('../controllers/orcamentosController');

// Todas as rotas requerem autenticação
router.use(verificarToken);

router.get('/', orcamentosController.listar);
router.get('/:id', orcamentosController.buscarPorId);
router.post('/', orcamentosController.criar);
router.put('/:id', orcamentosController.atualizar);
router.delete('/:id', orcamentosController.deletar);

module.exports = router;
