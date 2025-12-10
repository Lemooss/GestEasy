const { getConnection, sql } = require('../config/database');

// Listar categorias do usuário
const listar = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;
        const { tipo } = req.query;

        const pool = await getConnection();
        let query = `
            SELECT 
                id_categoria,
                nome,
                tipo,
                cor,
                icone,
                data_criacao
            FROM categorias
            WHERE id_usuario = @id_usuario
        `;

        const request = pool.request();
        request.input('id_usuario', sql.Int, id_usuario);

        if (tipo) {
            query += ' AND (tipo = @tipo OR tipo = \'ambos\')';
            request.input('tipo', sql.NVarChar, tipo);
        }

        query += ' ORDER BY nome ASC';

        const resultado = await request.query(query);

        res.json({
            sucesso: true,
            dados: resultado.recordset
        });

    } catch (error) {
        console.error('Erro ao listar categorias:', error);
        res.status(500).json({ 
            sucesso: false, 
            mensagem: 'Erro ao listar categorias.' 
        });
    }
};

// Buscar categoria por ID
const buscarPorId = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;
        const { id } = req.params;

        const pool = await getConnection();
        const resultado = await pool.request()
            .input('id_categoria', sql.Int, id)
            .input('id_usuario', sql.Int, id_usuario)
            .query(`
                SELECT 
                    id_categoria,
                    nome,
                    tipo,
                    cor,
                    icone,
                    data_criacao
                FROM categorias
                WHERE id_categoria = @id_categoria AND id_usuario = @id_usuario
            `);

        if (resultado.recordset.length === 0) {
            return res.status(404).json({ 
                sucesso: false, 
                mensagem: 'Categoria não encontrada.' 
            });
        }

        res.json({
            sucesso: true,
            dados: resultado.recordset[0]
        });

    } catch (error) {
        console.error('Erro ao buscar categoria:', error);
        res.status(500).json({ 
            sucesso: false, 
            mensagem: 'Erro ao buscar categoria.' 
        });
    }
};

// Criar nova categoria
const criar = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;
        const { nome, tipo = 'ambos', cor = '#6c757d', icone = 'fa-folder' } = req.body;

        // Validações
        if (!nome) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: 'Nome da categoria é obrigatório.' 
            });
        }

        if (!['receita', 'despesa', 'ambos'].includes(tipo)) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: 'Tipo deve ser "receita", "despesa" ou "ambos".' 
            });
        }

        const pool = await getConnection();

        // Verificar se categoria já existe para o usuário
        const verificaNome = await pool.request()
            .input('nome', sql.NVarChar, nome)
            .input('id_usuario', sql.Int, id_usuario)
            .query('SELECT id_categoria FROM categorias WHERE nome = @nome AND id_usuario = @id_usuario');

        if (verificaNome.recordset.length > 0) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: 'Já existe uma categoria com este nome.' 
            });
        }

        // Inserir categoria
        const resultado = await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .input('nome', sql.NVarChar, nome)
            .input('tipo', sql.NVarChar, tipo)
            .input('cor', sql.NVarChar, cor)
            .input('icone', sql.NVarChar, icone)
            .query(`
                INSERT INTO categorias (id_usuario, nome, tipo, cor, icone)
                OUTPUT INSERTED.*
                VALUES (@id_usuario, @nome, @tipo, @cor, @icone)
            `);

        res.status(201).json({
            sucesso: true,
            mensagem: 'Categoria criada com sucesso!',
            dados: resultado.recordset[0]
        });

    } catch (error) {
        console.error('Erro ao criar categoria:', error);
        res.status(500).json({ 
            sucesso: false, 
            mensagem: 'Erro ao criar categoria.' 
        });
    }
};

// Atualizar categoria
const atualizar = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;
        const { id } = req.params;
        const { nome, tipo, cor, icone } = req.body;

        // Validações
        if (tipo && !['receita', 'despesa', 'ambos'].includes(tipo)) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: 'Tipo deve ser "receita", "despesa" ou "ambos".' 
            });
        }

        const pool = await getConnection();

        // Verificar se categoria existe e pertence ao usuário
        const verificaCategoria = await pool.request()
            .input('id_categoria', sql.Int, id)
            .input('id_usuario', sql.Int, id_usuario)
            .query('SELECT id_categoria FROM categorias WHERE id_categoria = @id_categoria AND id_usuario = @id_usuario');

        if (verificaCategoria.recordset.length === 0) {
            return res.status(404).json({ 
                sucesso: false, 
                mensagem: 'Categoria não encontrada.' 
            });
        }

        // Se nome foi informado, verificar duplicidade
        if (nome) {
            const verificaNome = await pool.request()
                .input('nome', sql.NVarChar, nome)
                .input('id_usuario', sql.Int, id_usuario)
                .input('id_categoria', sql.Int, id)
                .query('SELECT id_categoria FROM categorias WHERE nome = @nome AND id_usuario = @id_usuario AND id_categoria != @id_categoria');

            if (verificaNome.recordset.length > 0) {
                return res.status(400).json({ 
                    sucesso: false, 
                    mensagem: 'Já existe uma categoria com este nome.' 
                });
            }
        }

        // Construir query de atualização
        let camposAtualizar = [];
        const request = pool.request();
        request.input('id_categoria', sql.Int, id);
        request.input('id_usuario', sql.Int, id_usuario);

        if (nome) {
            camposAtualizar.push('nome = @nome');
            request.input('nome', sql.NVarChar, nome);
        }

        if (tipo) {
            camposAtualizar.push('tipo = @tipo');
            request.input('tipo', sql.NVarChar, tipo);
        }

        if (cor) {
            camposAtualizar.push('cor = @cor');
            request.input('cor', sql.NVarChar, cor);
        }

        if (icone) {
            camposAtualizar.push('icone = @icone');
            request.input('icone', sql.NVarChar, icone);
        }

        if (camposAtualizar.length === 0) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: 'Nenhum campo para atualizar.' 
            });
        }

        const query = `
            UPDATE categorias
            SET ${camposAtualizar.join(', ')}
            OUTPUT INSERTED.*
            WHERE id_categoria = @id_categoria AND id_usuario = @id_usuario
        `;

        const resultado = await request.query(query);

        res.json({
            sucesso: true,
            mensagem: 'Categoria atualizada com sucesso!',
            dados: resultado.recordset[0]
        });

    } catch (error) {
        console.error('Erro ao atualizar categoria:', error);
        res.status(500).json({ 
            sucesso: false, 
            mensagem: 'Erro ao atualizar categoria.' 
        });
    }
};

// Deletar categoria
const deletar = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;
        const { id } = req.params;

        const pool = await getConnection();

        // Verificar se categoria existe e pertence ao usuário
        const verificaCategoria = await pool.request()
            .input('id_categoria', sql.Int, id)
            .input('id_usuario', sql.Int, id_usuario)
            .query('SELECT id_categoria FROM categorias WHERE id_categoria = @id_categoria AND id_usuario = @id_usuario');

        if (verificaCategoria.recordset.length === 0) {
            return res.status(404).json({ 
                sucesso: false, 
                mensagem: 'Categoria não encontrada.' 
            });
        }

        // Verificar se existem transações ou orçamentos vinculados
        const verificaVinculos = await pool.request()
            .input('id_categoria', sql.Int, id)
            .query(`
                SELECT 
                    (SELECT COUNT(*) FROM transacoes WHERE id_categoria = @id_categoria) AS total_transacoes,
                    (SELECT COUNT(*) FROM orcamentos WHERE id_categoria = @id_categoria) AS total_orcamentos
            `);

        const vinculos = verificaVinculos.recordset[0];

        if (vinculos.total_transacoes > 0 || vinculos.total_orcamentos > 0) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: `Não é possível deletar esta categoria pois existem ${vinculos.total_transacoes} transação(ões) e ${vinculos.total_orcamentos} orçamento(s) vinculados.` 
            });
        }

        // Deletar categoria
        await pool.request()
            .input('id_categoria', sql.Int, id)
            .input('id_usuario', sql.Int, id_usuario)
            .query('DELETE FROM categorias WHERE id_categoria = @id_categoria AND id_usuario = @id_usuario');

        res.json({
            sucesso: true,
            mensagem: 'Categoria deletada com sucesso!'
        });

    } catch (error) {
        console.error('Erro ao deletar categoria:', error);
        res.status(500).json({ 
            sucesso: false, 
            mensagem: 'Erro ao deletar categoria.' 
        });
    }
};

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar
};
