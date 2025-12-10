const { getConnection, sql } = require('../config/database');

// Obter resumo financeiro
const obterResumo = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;
        const { mes, ano } = req.query;

        const pool = await getConnection();
        const request = pool.request();
        request.input('id_usuario', sql.Int, id_usuario);

        let condicaoPeriodo = '';
        
        if (mes && ano) {
            condicaoPeriodo = 'AND MONTH(data_transacao) = @mes AND YEAR(data_transacao) = @ano';
            request.input('mes', sql.Int, mes);
            request.input('ano', sql.Int, ano);
        } else {
            // Mês atual por padrão
            condicaoPeriodo = 'AND MONTH(data_transacao) = MONTH(GETDATE()) AND YEAR(data_transacao) = YEAR(GETDATE())';
        }

        // Buscar totais de receitas e despesas
        const resultado = await request.query(`
            SELECT 
                ISNULL(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0) AS total_receitas,
                ISNULL(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0) AS total_despesas,
                ISNULL(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE -valor END), 0) AS saldo
            FROM transacoes
            WHERE id_usuario = @id_usuario ${condicaoPeriodo}
        `);

        const resumo = resultado.recordset[0];

        res.json({
            sucesso: true,
            dados: {
                total_receitas: parseFloat(resumo.total_receitas),
                total_despesas: parseFloat(resumo.total_despesas),
                saldo: parseFloat(resumo.saldo),
                mes: mes || new Date().getMonth() + 1,
                ano: ano || new Date().getFullYear()
            }
        });

    } catch (error) {
        console.error('Erro ao obter resumo:', error);
        res.status(500).json({ 
            sucesso: false, 
            mensagem: 'Erro ao obter resumo financeiro.' 
        });
    }
};

// Obter despesas por categoria (para gráfico de pizza)
const obterDespesasPorCategoria = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;
        const { mes, ano } = req.query;

        const pool = await getConnection();
        const request = pool.request();
        request.input('id_usuario', sql.Int, id_usuario);

        let condicaoPeriodo = '';
        
        if (mes && ano) {
            condicaoPeriodo = 'AND MONTH(t.data_transacao) = @mes AND YEAR(t.data_transacao) = @ano';
            request.input('mes', sql.Int, mes);
            request.input('ano', sql.Int, ano);
        } else {
            condicaoPeriodo = 'AND MONTH(t.data_transacao) = MONTH(GETDATE()) AND YEAR(t.data_transacao) = YEAR(GETDATE())';
        }

        const resultado = await request.query(`
            SELECT 
                c.nome AS categoria,
                c.cor,
                SUM(t.valor) AS total
            FROM transacoes t
            INNER JOIN categorias c ON t.id_categoria = c.id_categoria
            WHERE t.id_usuario = @id_usuario 
                AND t.tipo = 'despesa'
                ${condicaoPeriodo}
            GROUP BY c.nome, c.cor
            ORDER BY total DESC
        `);

        res.json({
            sucesso: true,
            dados: resultado.recordset.map(item => ({
                categoria: item.categoria,
                cor: item.cor,
                total: parseFloat(item.total)
            }))
        });

    } catch (error) {
        console.error('Erro ao obter despesas por categoria:', error);
        res.status(500).json({ 
            sucesso: false, 
            mensagem: 'Erro ao obter despesas por categoria.' 
        });
    }
};

// Obter receitas vs despesas por mês (para gráfico de barras)
const obterReceitasDespesasPorMes = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;
        const { ano } = req.query;

        const pool = await getConnection();
        const request = pool.request();
        request.input('id_usuario', sql.Int, id_usuario);

        let condicaoAno = '';
        
        if (ano) {
            condicaoAno = 'AND YEAR(data_transacao) = @ano';
            request.input('ano', sql.Int, ano);
        } else {
            condicaoAno = 'AND YEAR(data_transacao) = YEAR(GETDATE())';
        }

        const resultado = await request.query(`
            SELECT 
                MONTH(data_transacao) AS mes,
                ISNULL(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0) AS receitas,
                ISNULL(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0) AS despesas
            FROM transacoes
            WHERE id_usuario = @id_usuario ${condicaoAno}
            GROUP BY MONTH(data_transacao)
            ORDER BY mes
        `);

        // Preencher todos os 12 meses
        const meses = Array.from({ length: 12 }, (_, i) => ({
            mes: i + 1,
            receitas: 0,
            despesas: 0
        }));

        resultado.recordset.forEach(item => {
            meses[item.mes - 1] = {
                mes: item.mes,
                receitas: parseFloat(item.receitas),
                despesas: parseFloat(item.despesas)
            };
        });

        res.json({
            sucesso: true,
            dados: meses
        });

    } catch (error) {
        console.error('Erro ao obter receitas e despesas por mês:', error);
        res.status(500).json({ 
            sucesso: false, 
            mensagem: 'Erro ao obter receitas e despesas por mês.' 
        });
    }
};

// Obter evolução do saldo (para gráfico de linha)
const obterEvolucaoSaldo = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;
        const { ano } = req.query;

        const pool = await getConnection();
        const request = pool.request();
        request.input('id_usuario', sql.Int, id_usuario);

        let condicaoAno = '';
        
        if (ano) {
            condicaoAno = 'AND YEAR(data_transacao) = @ano';
            request.input('ano', sql.Int, ano);
        } else {
            condicaoAno = 'AND YEAR(data_transacao) = YEAR(GETDATE())';
        }

        const resultado = await request.query(`
            SELECT 
                MONTH(data_transacao) AS mes,
                ISNULL(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE -valor END), 0) AS saldo_mes
            FROM transacoes
            WHERE id_usuario = @id_usuario ${condicaoAno}
            GROUP BY MONTH(data_transacao)
            ORDER BY mes
        `);

        // Calcular saldo acumulado
        let saldoAcumulado = 0;
        const meses = Array.from({ length: 12 }, (_, i) => {
            const mesData = resultado.recordset.find(item => item.mes === i + 1);
            if (mesData) {
                saldoAcumulado += parseFloat(mesData.saldo_mes);
            }
            return {
                mes: i + 1,
                saldo: saldoAcumulado
            };
        });

        res.json({
            sucesso: true,
            dados: meses
        });

    } catch (error) {
        console.error('Erro ao obter evolução do saldo:', error);
        res.status(500).json({ 
            sucesso: false, 
            mensagem: 'Erro ao obter evolução do saldo.' 
        });
    }
};

// Obter transações recentes
const obterTransacoesRecentes = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;
        const { limite = 10 } = req.query;

        const pool = await getConnection();
        const resultado = await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .input('limite', sql.Int, parseInt(limite))
            .query(`
                SELECT TOP (@limite)
                    t.id_transacao,
                    t.tipo,
                    t.valor,
                    t.data_transacao,
                    t.descricao,
                    c.nome AS categoria,
                    c.cor AS cor_categoria,
                    c.icone AS icone_categoria
                FROM transacoes t
                INNER JOIN categorias c ON t.id_categoria = c.id_categoria
                WHERE t.id_usuario = @id_usuario
                ORDER BY t.data_transacao DESC, t.id_transacao DESC
            `);

        res.json({
            sucesso: true,
            dados: resultado.recordset
        });

    } catch (error) {
        console.error('Erro ao obter transações recentes:', error);
        res.status(500).json({ 
            sucesso: false, 
            mensagem: 'Erro ao obter transações recentes.' 
        });
    }
};

module.exports = {
    obterResumo,
    obterDespesasPorCategoria,
    obterReceitasDespesasPorMes,
    obterEvolucaoSaldo,
    obterTransacoesRecentes
};
