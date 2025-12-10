const express = require('express');
const cors = require('cors');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const { getConnection, closeConnection } = require('./config/database');

// Importar rotas
const authRoutes = require('./routes/authRoutes');
const transacoesRoutes = require('./routes/transacoesRoutes');
const categoriasRoutes = require('./routes/categoriasRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const orcamentosRoutes = require('./routes/orcamentosRoutes');
const exportRoutes = require('./routes/exportRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configurar sessão
app.use(session({
    secret: process.env.SESSION_SECRET || 'gesteasy_session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: parseInt(process.env.SESSION_TIMEOUT) || 1800000, // 30 minutos
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    }
}));

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../../frontend')));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/transacoes', transacoesRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/orcamentos', orcamentosRoutes);
app.use('/api/export', exportRoutes);

// Rota de health check
app.get('/api/health', (req, res) => {
    res.json({ 
        sucesso: true, 
        mensagem: 'GestEasy API está funcionando!',
        timestamp: new Date().toISOString()
    });
});

// Rota raiz - servir index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

// Tratamento de rotas não encontradas
app.use((req, res) => {
    res.status(404).json({ 
        sucesso: false, 
        mensagem: 'Rota não encontrada.' 
    });
});

// Tratamento de erros
app.use((err, req, res, next) => {
    console.error('Erro não tratado:', err);
    res.status(500).json({ 
        sucesso: false, 
        mensagem: 'Erro interno do servidor.' 
    });
});

// Inicializar servidor
const iniciarServidor = async () => {
    try {
        // Testar conexão com banco de dados
        await getConnection();
        
        app.listen(PORT, () => {
            console.log('');
            console.log('========================================');
            console.log('   GestEasy - Sistema de Gestão Financeira');
            console.log('========================================');
            console.log(`✓ Servidor rodando na porta ${PORT}`);
            console.log(`✓ Ambiente: ${process.env.NODE_ENV || 'development'}`);
            console.log(`✓ URL: http://localhost:${PORT}`);
            console.log('========================================');
            console.log('');
        });
    } catch (error) {
        console.error('✗ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
};

// Tratamento de encerramento
process.on('SIGINT', async () => {
    console.log('\n\nEncerrando servidor...');
    await closeConnection();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n\nEncerrando servidor...');
    await closeConnection();
    process.exit(0);
});

// Iniciar
iniciarServidor();

module.exports = app;
