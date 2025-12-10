const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verificarToken } = require('../middleware/auth');

// Todas as rotas requerem autenticação
router.use(verificarToken);

router.get('/resumo', dashboardController.obterResumo);
router.get('/despesas-por-categoria', dashboardController.obterDespesasPorCategoria);
router.get('/receitas-despesas-mes', dashboardController.obterReceitasDespesasPorMes);
router.get('/evolucao-saldo', dashboardController.obterEvolucaoSaldo);
router.get('/transacoes-recentes', dashboardController.obterTransacoesRecentes);

module.exports = router;
