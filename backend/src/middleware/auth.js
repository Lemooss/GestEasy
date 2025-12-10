const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware para verificar autenticação via JWT
const verificarToken = (req, res, next) => {
    try {
        // Verificar token no header Authorization
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ 
                sucesso: false, 
                mensagem: 'Token não fornecido. Acesso negado.' 
            });
        }

        // Verificar e decodificar token
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).json({ 
                    sucesso: false, 
                    mensagem: 'Token inválido ou expirado.' 
                });
            }

            // Adicionar dados do usuário ao request
            req.usuario = decoded;
            next();
        });
    } catch (error) {
        console.error('Erro no middleware de autenticação:', error);
        return res.status(500).json({ 
            sucesso: false, 
            mensagem: 'Erro ao verificar autenticação.' 
        });
    }
};

// Middleware para verificar sessão
const verificarSessao = (req, res, next) => {
    if (req.session && req.session.usuario) {
        next();
    } else {
        return res.status(401).json({ 
            sucesso: false, 
            mensagem: 'Sessão expirada. Faça login novamente.' 
        });
    }
};

module.exports = {
    verificarToken,
    verificarSessao
};
