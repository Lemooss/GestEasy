const { getConnection, sql } = require('../config/database');

// Listar transações com filtros e paginação
const listar = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;
        const { 
            data_inicial, 
            data_final, 
            categoria, 
            tipo, 
            busca,
            ordenar_por = 'data_transacao',
            ordem = 'DESC',
            pagina = 1,
            limite = 50
        } = req.query;

        const pool = await getConnection();
        let query = `
            SELECT 
                t.id_transacao,
                t.tipo,
                t.valor,
                t.data_transacao,
                t.descricao,
                c.id_categoria,
                c.nome AS categoria,
                c.cor AS cor_categoria,
                c.icone AS icone_categoria
            FROM transacoes t
            INNER JOIN categorias c ON t.id_categoria = c.id_categoria
            WHERE t.id_usuario = @id_usuario
        `;

        const request = pool.request();
        request.input('id_usuario', sql.Int, id_usuario);

        // Filtros
        if (data_inicial) {
            query += ' AND t.data_transacao >= @data_inicial';
            request.input('data_inicial', sql.Date, data_inicial);
        }

        if (data_final) {
            query += ' AND t.data_transacao <= @data_final';
            request.input('data_final', sql.Date, data_final);
        }

        if (categoria) {
            query += ' AND t.id_categoria = @id_categoria';
            request.input('id_categoria', sql.Int, categoria);
        }

        if (tipo) {
            query += ' AND t.tipo = @tipo';
            request.input('tipo', sql.NVarChar, tipo);
        }

        if (busca) {
            query += ' AND t.descricao LIKE @busca';
            request.input('busca', sql.NVarChar, `%${busca}%`);
        }

        // Ordenação
        const colunasPermitidas = ['data_transacao', 'valor', 'tipo'];
        const colunaOrdenacao = colunasPermitidas.includes(ordenar_por) ? ordenar_por : 'data_transacao';
        const direcaoOrdenacao = ordem.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        
        query += ` ORDER BY t.${colunaOrdenacao} ${direcaoOrdenacao}`;

        // Paginação
        const offset = (parseInt(pagina) - 1) * parseInt(limite);
        query += ` OFFSET @offset ROWS FETCH NEXT @limite ROWS ONLY`;
        request.input('offset', sql.Int, offset);
        request.input('limite', sql.Int, parseInt(limite));

        const resultado = await request.query(query);

        // Contar total de registros
        let queryTotal = `
            SELECT COUNT(*) as total
            FROM transacoes t
            WHERE t.id_usuario = @id_usuario
        `;

        const requestTotal = pool.request();
        requestTotal.input('id_usuario', sql.Int, id_usuario);

        if (data_inicial) {
            queryTotal += ' AND t.data_transacao >= @data_inicial';
            requestTotal.input('data_inicial', sql.Date, data_inicial);
        }

        if (data_final) {
            queryTotal += ' AND t.data_transacao <= @data_final';
            requestTotal.input('data_final', sql.Date, data_final);
        }

        if (categoria) {
            queryTotal += ' AND t.id_categoria = @id_categoria';
            requestTotal.input('id_categoria', sql.Int, categoria);
        }

        if (tipo) {
            queryTotal += ' AND t.tipo = @tipo';
            requestTotal.input('tipo', sql.NVarChar, tipo);
        }

        if (busca) {
            queryTotal += ' AND t.descricao LIKE @busca';
            requestTotal.input('busca', sql.NVarChar, `%${busca}%`);
        }

        const resultadoTotal = await requestTotal.query(queryTotal);
        const total = resultadoTotal.recordset[0].total;

        res.json({
            sucesso: true,
            dados: resultado.recordset,
            paginacao: {
                pagina_atual: parseInt(pagina),
                limite: parseInt(limite),
                total_registros: total,
                total_paginas: Math.ceil(total / parseInt(limite))
            }
        });

    } catch (error) {
        console.error('Erro ao listar transações:', error);
        res.status(500).json({ 
            sucesso: false, 
            mensagem: 'Erro ao listar transações.' 
        });
    }
};

// Buscar transação por ID
const buscarPorId = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;
        const { id } = req.params;

        const pool = await getConnection();
        const resultado = await pool.request()
            .input('id_transacao', sql.Int, id)
            .input('id_usuario', sql.Int, id_usuario)
            .query(`
                SELECT 
                    t.id_transacao,
                    t.tipo,
                    t.valor,
                    t.data_transacao,
                    t.descricao,
                    c.id_categoria,
                    c.nome AS categoria,
                    c.cor AS cor_categoria
                FROM transacoes t
                INNER JOIN categorias c ON t.id_categoria = c.id_categoria
                WHERE t.id_transacao = @id_transacao AND t.id_usuario = @id_usuario
            `);

        if (resultado.recordset.length === 0) {
            return res.status(404).json({ 
                sucesso: false, 
                mensagem: 'Transação não encontrada.' 
            });
        }

        res.json({
            sucesso: true,
            dados: resultado.recordset[0]
        });

    } catch (error) {
        console.error('Erro ao buscar transação:', error);
        res.status(500).json({ 
            sucesso: false, 
            mensagem: 'Erro ao buscar transação.' 
        });
    }
};

// Criar nova transação
const criar = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;
        const { tipo, valor, data_transacao, id_categoria, descricao } = req.body;

        // Validações
        if (!tipo || !valor || !data_transacao || !id_categoria) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: 'Tipo, valor, data e categoria são obrigatórios.' 
            });
        }

        if (!['receita', 'despesa'].includes(tipo)) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: 'Tipo deve ser "receita" ou "despesa".' 
            });
        }

        if (parseFloat(valor) <= 0) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: 'Valor deve ser maior que zero.' 
            });
        }

        const pool = await getConnection();

        // Verificar se categoria pertence ao usuário
        const verificaCategoria = await pool.request()
            .input('id_categoria', sql.Int, id_categoria)
            .input('id_usuario', sql.Int, id_usuario)
            .query('SELECT id_categoria FROM categorias WHERE id_categoria = @id_categoria AND id_usuario = @id_usuario');

        if (verificaCategoria.recordset.length === 0) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: 'Categoria inválida.' 
            });
        }

        // Inserir transação
        const resultado = await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .input('id_categoria', sql.Int, id_categoria)
            .input('tipo', sql.NVarChar, tipo)
            .input('valor', sql.Decimal(15, 2), valor)
            .input('data_transacao', sql.Date, data_transacao)
            .input('descricao', sql.NVarChar, descricao || null)
            .query(`
                INSERT INTO transacoes (id_usuario, id_categoria, tipo, valor, data_transacao, descricao)
                OUTPUT INSERTED.*
                VALUES (@id_usuario, @id_categoria, @tipo, @valor, @data_transacao, @descricao)
            `);

        res.status(201).json({
            sucesso: true,
            mensagem: 'Transação criada com sucesso!',
            dados: resultado.recordset[0]
        });

    } catch (error) {
        console.error('Erro ao criar transação:', error);
        res.status(500).json({ 
            sucesso: false, 
            mensagem: 'Erro ao criar transação.' 
        });
    }
};

// Atualizar transação
const atualizar = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;
        const { id } = req.params;
        const { tipo, valor, data_transacao, id_categoria, descricao } = req.body;

        // Validações
        if (tipo && !['receita', 'despesa'].includes(tipo)) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: 'Tipo deve ser "receita" ou "despesa".' 
            });
        }

        if (valor && parseFloat(valor) <= 0) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: 'Valor deve ser maior que zero.' 
            });
        }

        const pool = await getConnection();

        // Verificar se transação existe e pertence ao usuário
        const verificaTransacao = await pool.request()
            .input('id_transacao', sql.Int, id)
            .input('id_usuario', sql.Int, id_usuario)
            .query('SELECT id_transacao FROM transacoes WHERE id_transacao = @id_transacao AND id_usuario = @id_usuario');

        if (verificaTransacao.recordset.length === 0) {
            return res.status(404).json({ 
                sucesso: false, 
                mensagem: 'Transação não encontrada.' 
            });
        }

        // Se categoria foi informada, verificar se pertence ao usuário
        if (id_categoria) {
            const verificaCategoria = await pool.request()
                .input('id_categoria', sql.Int, id_categoria)
                .input('id_usuario', sql.Int, id_usuario)
                .query('SELECT id_categoria FROM categorias WHERE id_categoria = @id_categoria AND id_usuario = @id_usuario');

            if (verificaCategoria.recordset.length === 0) {
                return res.status(400).json({ 
                    sucesso: false, 
                    mensagem: 'Categoria inválida.' 
                });
            }
        }

        // Construir query de atualização
        let camposAtualizar = [];
        const request = pool.request();
        request.input('id_transacao', sql.Int, id);
        request.input('id_usuario', sql.Int, id_usuario);

        if (tipo) {
            camposAtualizar.push('tipo = @tipo');
            request.input('tipo', sql.NVarChar, tipo);
        }

        if (valor) {
            camposAtualizar.push('valor = @valor');
            request.input('valor', sql.Decimal(15, 2), valor);
        }

        if (data_transacao) {
            camposAtualizar.push('data_transacao = @data_transacao');
            request.input('data_transacao', sql.Date, data_transacao);
        }

        if (id_categoria) {
            camposAtualizar.push('id_categoria = @id_categoria');
            request.input('id_categoria', sql.Int, id_categoria);
        }

        if (descricao !== undefined) {
            camposAtualizar.push('descricao = @descricao');
            request.input('descricao', sql.NVarChar, descricao);
        }

        camposAtualizar.push('data_atualizacao = GETDATE()');

        if (camposAtualizar.length === 1) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: 'Nenhum campo para atualizar.' 
            });
        }

        const query = `
            UPDATE transacoes
            SET ${camposAtualizar.join(', ')}
            OUTPUT INSERTED.*
            WHERE id_transacao = @id_transacao AND id_usuario = @id_usuario
        `;

        const resultado = await request.query(query);

        res.json({
            sucesso: true,
            mensagem: 'Transação atualizada com sucesso!',
            dados: resultado.recordset[0]
        });

    } catch (error) {
        console.error('Erro ao atualizar transação:', error);
        res.status(500).json({ 
            sucesso: false, 
            mensagem: 'Erro ao atualizar transação.' 
        });
    }
};

// Deletar transação
const deletar = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;
        const { id } = req.params;

        const pool = await getConnection();

        // Verificar se transação existe e pertence ao usuário
        const verificaTransacao = await pool.request()
            .input('id_transacao', sql.Int, id)
            .input('id_usuario', sql.Int, id_usuario)
            .query('SELECT id_transacao FROM transacoes WHERE id_transacao = @id_transacao AND id_usuario = @id_usuario');

        if (verificaTransacao.recordset.length === 0) {
            return res.status(404).json({ 
                sucesso: false, 
                mensagem: 'Transação não encontrada.' 
            });
        }

        // Deletar transação
        await pool.request()
            .input('id_transacao', sql.Int, id)
            .input('id_usuario', sql.Int, id_usuario)
            .query('DELETE FROM transacoes WHERE id_transacao = @id_transacao AND id_usuario = @id_usuario');

        res.json({
            sucesso: true,
            mensagem: 'Transação deletada com sucesso!'
        });

    } catch (error) {
        console.error('Erro ao deletar transação:', error);
        res.status(500).json({ 
            sucesso: false, 
            mensagem: 'Erro ao deletar transação.' 
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
