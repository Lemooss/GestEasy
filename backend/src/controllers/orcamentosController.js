const { getConnection, sql } = require('../config/database');

// Listar orçamentos
const listar = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;
        const { mes, ano } = req.query;

        const pool = await getConnection();
        const request = pool.request();
        request.input('id_usuario', sql.Int, id_usuario);

        let condicaoPeriodo = '';
        
        if (mes && ano) {
            condicaoPeriodo = 'AND o.mes = @mes AND o.ano = @ano';
            request.input('mes', sql.Int, mes);
            request.input('ano', sql.Int, ano);
        } else {
            // Mês atual por padrão
            condicaoPeriodo = 'AND o.mes = MONTH(GETDATE()) AND o.ano = YEAR(GETDATE())';
        }

        const resultado = await request.query(`
            SELECT 
                id_orcamento,
                id_categoria,
                categoria,
                cor_categoria,
                mes,
                ano,
                valor_limite,
                valor_gasto,
                percentual_usado,
                status_alerta
            FROM vw_orcamentos_status
            WHERE id_usuario = @id_usuario ${condicaoPeriodo}
            ORDER BY percentual_usado DESC
        `);

        res.json({
            sucesso: true,
            dados: resultado.recordset.map(item => ({
                ...item,
                valor_limite: parseFloat(item.valor_limite),
                valor_gasto: parseFloat(item.valor_gasto),
                percentual_usado: parseFloat(item.percentual_usado)
            }))
        });

    } catch (error) {
        console.error('Erro ao listar orçamentos:', error);
        res.status(500).json({ 
            sucesso: false, 
            mensagem: 'Erro ao listar orçamentos.' 
        });
    }
};

// Buscar orçamento por ID
const buscarPorId = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;
        const { id } = req.params;

        const pool = await getConnection();
        const resultado = await pool.request()
            .input('id_orcamento', sql.Int, id)
            .input('id_usuario', sql.Int, id_usuario)
            .query(`
                SELECT 
                    id_orcamento,
                    id_categoria,
                    categoria,
                    cor_categoria,
                    mes,
                    ano,
                    valor_limite,
                    valor_gasto,
                    percentual_usado,
                    status_alerta
                FROM vw_orcamentos_status
                WHERE id_orcamento = @id_orcamento AND id_usuario = @id_usuario
            `);

        if (resultado.recordset.length === 0) {
            return res.status(404).json({ 
                sucesso: false, 
                mensagem: 'Orçamento não encontrado.' 
            });
        }

        const orcamento = resultado.recordset[0];

        res.json({
            sucesso: true,
            dados: {
                ...orcamento,
                valor_limite: parseFloat(orcamento.valor_limite),
                valor_gasto: parseFloat(orcamento.valor_gasto),
                percentual_usado: parseFloat(orcamento.percentual_usado)
            }
        });

    } catch (error) {
        console.error('Erro ao buscar orçamento:', error);
        res.status(500).json({ 
            sucesso: false, 
            mensagem: 'Erro ao buscar orçamento.' 
        });
    }
};

// Criar novo orçamento
const criar = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;
        const { id_categoria, mes, ano, valor_limite } = req.body;

        // Validações
        if (!id_categoria || !mes || !ano || !valor_limite) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: 'Categoria, mês, ano e valor limite são obrigatórios.' 
            });
        }

        if (mes < 1 || mes > 12) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: 'Mês deve estar entre 1 e 12.' 
            });
        }

        if (ano < 2000) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: 'Ano inválido.' 
            });
        }

        if (parseFloat(valor_limite) <= 0) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: 'Valor limite deve ser maior que zero.' 
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

        // Verificar se já existe orçamento para esta categoria neste período
        const verificaOrcamento = await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .input('id_categoria', sql.Int, id_categoria)
            .input('mes', sql.Int, mes)
            .input('ano', sql.Int, ano)
            .query(`
                SELECT id_orcamento 
                FROM orcamentos 
                WHERE id_usuario = @id_usuario 
                    AND id_categoria = @id_categoria 
                    AND mes = @mes 
                    AND ano = @ano
            `);

        if (verificaOrcamento.recordset.length > 0) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: 'Já existe um orçamento para esta categoria neste período.' 
            });
        }

        // Inserir orçamento
        const resultado = await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .input('id_categoria', sql.Int, id_categoria)
            .input('mes', sql.Int, mes)
            .input('ano', sql.Int, ano)
            .input('valor_limite', sql.Decimal(15, 2), valor_limite)
            .query(`
                INSERT INTO orcamentos (id_usuario, id_categoria, mes, ano, valor_limite)
                OUTPUT INSERTED.*
                VALUES (@id_usuario, @id_categoria, @mes, @ano, @valor_limite)
            `);

        res.status(201).json({
            sucesso: true,
            mensagem: 'Orçamento criado com sucesso!',
            dados: resultado.recordset[0]
        });

    } catch (error) {
        console.error('Erro ao criar orçamento:', error);
        res.status(500).json({ 
            sucesso: false, 
            mensagem: 'Erro ao criar orçamento.' 
        });
    }
};

// Atualizar orçamento
const atualizar = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;
        const { id } = req.params;
        const { valor_limite, mes, ano } = req.body;

        // Validações
        if (mes && (mes < 1 || mes > 12)) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: 'Mês deve estar entre 1 e 12.' 
            });
        }

        if (ano && ano < 2000) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: 'Ano inválido.' 
            });
        }

        if (valor_limite && parseFloat(valor_limite) <= 0) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: 'Valor limite deve ser maior que zero.' 
            });
        }

        const pool = await getConnection();

        // Verificar se orçamento existe e pertence ao usuário
        const verificaOrcamento = await pool.request()
            .input('id_orcamento', sql.Int, id)
            .input('id_usuario', sql.Int, id_usuario)
            .query('SELECT id_orcamento, id_categoria FROM orcamentos WHERE id_orcamento = @id_orcamento AND id_usuario = @id_usuario');

        if (verificaOrcamento.recordset.length === 0) {
            return res.status(404).json({ 
                sucesso: false, 
                mensagem: 'Orçamento não encontrado.' 
            });
        }

        // Se mes/ano foram alterados, verificar duplicidade
        if (mes || ano) {
            const orcamentoAtual = verificaOrcamento.recordset[0];
            const verificaDuplicidade = await pool.request()
                .input('id_usuario', sql.Int, id_usuario)
                .input('id_categoria', sql.Int, orcamentoAtual.id_categoria)
                .input('mes', sql.Int, mes || null)
                .input('ano', sql.Int, ano || null)
                .input('id_orcamento', sql.Int, id)
                .query(`
                    SELECT id_orcamento 
                    FROM orcamentos 
                    WHERE id_usuario = @id_usuario 
                        AND id_categoria = @id_categoria 
                        AND mes = ISNULL(@mes, mes)
                        AND ano = ISNULL(@ano, ano)
                        AND id_orcamento != @id_orcamento
                `);

            if (verificaDuplicidade.recordset.length > 0) {
                return res.status(400).json({ 
                    sucesso: false, 
                    mensagem: 'Já existe um orçamento para esta categoria neste período.' 
                });
            }
        }

        // Construir query de atualização
        let camposAtualizar = [];
        const request = pool.request();
        request.input('id_orcamento', sql.Int, id);
        request.input('id_usuario', sql.Int, id_usuario);

        if (valor_limite) {
            camposAtualizar.push('valor_limite = @valor_limite');
            request.input('valor_limite', sql.Decimal(15, 2), valor_limite);
        }

        if (mes) {
            camposAtualizar.push('mes = @mes');
            request.input('mes', sql.Int, mes);
        }

        if (ano) {
            camposAtualizar.push('ano = @ano');
            request.input('ano', sql.Int, ano);
        }

        camposAtualizar.push('data_atualizacao = GETDATE()');

        if (camposAtualizar.length === 1) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: 'Nenhum campo para atualizar.' 
            });
        }

        const query = `
            UPDATE orcamentos
            SET ${camposAtualizar.join(', ')}
            OUTPUT INSERTED.*
            WHERE id_orcamento = @id_orcamento AND id_usuario = @id_usuario
        `;

        const resultado = await request.query(query);

        res.json({
            sucesso: true,
            mensagem: 'Orçamento atualizado com sucesso!',
            dados: resultado.recordset[0]
        });

    } catch (error) {
        console.error('Erro ao atualizar orçamento:', error);
        res.status(500).json({ 
            sucesso: false, 
            mensagem: 'Erro ao atualizar orçamento.' 
        });
    }
};

// Deletar orçamento
const deletar = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;
        const { id } = req.params;

        const pool = await getConnection();

        // Verificar se orçamento existe e pertence ao usuário
        const verificaOrcamento = await pool.request()
            .input('id_orcamento', sql.Int, id)
            .input('id_usuario', sql.Int, id_usuario)
            .query('SELECT id_orcamento FROM orcamentos WHERE id_orcamento = @id_orcamento AND id_usuario = @id_usuario');

        if (verificaOrcamento.recordset.length === 0) {
            return res.status(404).json({ 
                sucesso: false, 
                mensagem: 'Orçamento não encontrado.' 
            });
        }

        // Deletar orçamento
        await pool.request()
            .input('id_orcamento', sql.Int, id)
            .input('id_usuario', sql.Int, id_usuario)
            .query('DELETE FROM orcamentos WHERE id_orcamento = @id_orcamento AND id_usuario = @id_usuario');

        res.json({
            sucesso: true,
            mensagem: 'Orçamento deletado com sucesso!'
        });

    } catch (error) {
        console.error('Erro ao deletar orçamento:', error);
        res.status(500).json({ 
            sucesso: false, 
            mensagem: 'Erro ao deletar orçamento.' 
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
