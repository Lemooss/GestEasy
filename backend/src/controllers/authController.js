const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getConnection, sql } = require('../config/database');
require('dotenv').config();

const SALT_ROUNDS = 10;

// Registrar novo usuário
const registrar = async (req, res) => {
    try {
        const { nome, email, senha } = req.body;

        // Validações
        if (!nome || !email || !senha) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: 'Nome, email e senha são obrigatórios.' 
            });
        }

        if (senha.length < 6) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: 'A senha deve ter no mínimo 6 caracteres.' 
            });
        }

        const pool = await getConnection();

        // Verificar se email já existe
        const verificaEmail = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT id_usuario FROM usuarios WHERE email = @email');

        if (verificaEmail.recordset.length > 0) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: 'Este email já está cadastrado.' 
            });
        }

        // Hash da senha
        const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

        // Inserir usuário
        const resultado = await pool.request()
            .input('nome', sql.NVarChar, nome)
            .input('email', sql.NVarChar, email)
            .input('senha_hash', sql.NVarChar, senhaHash)
            .query(`
                INSERT INTO usuarios (nome, email, senha_hash)
                OUTPUT INSERTED.id_usuario, INSERTED.nome, INSERTED.email
                VALUES (@nome, @email, @senha_hash)
            `);

        const novoUsuario = resultado.recordset[0];

        // Criar categorias padrão
        await pool.request()
            .input('id_usuario', sql.Int, novoUsuario.id_usuario)
            .execute('sp_criar_categorias_padrao');

        // Gerar token JWT
        const token = jwt.sign(
            { 
                id_usuario: novoUsuario.id_usuario, 
                email: novoUsuario.email,
                nome: novoUsuario.nome
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            sucesso: true,
            mensagem: 'Usuário cadastrado com sucesso!',
            dados: {
                id_usuario: novoUsuario.id_usuario,
                nome: novoUsuario.nome,
                email: novoUsuario.email,
                token
            }
        });

    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        res.status(500).json({ 
            sucesso: false, 
            mensagem: 'Erro ao cadastrar usuário.' 
        });
    }
};

// Login de usuário
const login = async (req, res) => {
    try {
        const { email, senha } = req.body;

        // Validações
        if (!email || !senha) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: 'Email e senha são obrigatórios.' 
            });
        }

        const pool = await getConnection();

        // Buscar usuário
        const resultado = await pool.request()
            .input('email', sql.NVarChar, email)
            .query(`
                SELECT id_usuario, nome, email, senha_hash, ativo
                FROM usuarios
                WHERE email = @email
            `);

        if (resultado.recordset.length === 0) {
            return res.status(401).json({ 
                sucesso: false, 
                mensagem: 'Email ou senha incorretos.' 
            });
        }

        const usuario = resultado.recordset[0];

        // Verificar se usuário está ativo
        if (!usuario.ativo) {
            return res.status(403).json({ 
                sucesso: false, 
                mensagem: 'Usuário inativo. Entre em contato com o suporte.' 
            });
        }

        // Verificar senha
        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

        if (!senhaValida) {
            return res.status(401).json({ 
                sucesso: false, 
                mensagem: 'Email ou senha incorretos.' 
            });
        }

        // Gerar token JWT
        const token = jwt.sign(
            { 
                id_usuario: usuario.id_usuario, 
                email: usuario.email,
                nome: usuario.nome
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Criar sessão
        req.session.usuario = {
            id_usuario: usuario.id_usuario,
            nome: usuario.nome,
            email: usuario.email
        };

        res.json({
            sucesso: true,
            mensagem: 'Login realizado com sucesso!',
            dados: {
                id_usuario: usuario.id_usuario,
                nome: usuario.nome,
                email: usuario.email,
                token
            }
        });

    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({ 
            sucesso: false, 
            mensagem: 'Erro ao fazer login.' 
        });
    }
};

// Logout
const logout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.error('Erro ao destruir sessão:', err);
                return res.status(500).json({ 
                    sucesso: false, 
                    mensagem: 'Erro ao fazer logout.' 
                });
            }

            res.json({
                sucesso: true,
                mensagem: 'Logout realizado com sucesso!'
            });
        });
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        res.status(500).json({ 
            sucesso: false, 
            mensagem: 'Erro ao fazer logout.' 
        });
    }
};

// Verificar autenticação
const verificarAuth = async (req, res) => {
    try {
        res.json({
            sucesso: true,
            dados: {
                id_usuario: req.usuario.id_usuario,
                nome: req.usuario.nome,
                email: req.usuario.email
            }
        });
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        res.status(500).json({ 
            sucesso: false, 
            mensagem: 'Erro ao verificar autenticação.' 
        });
    }
};

module.exports = {
    registrar,
    login,
    logout,
    verificarAuth
};
