const PDFDocument = require('pdfkit');
const { createObjectCsvWriter } = require('csv-writer');
const { getConnection, sql } = require('../config/database');
const path = require('path');
const fs = require('fs');

// Exportar transações para PDF
const exportarPDF = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;
        const { data_inicial, data_final, categoria, tipo } = req.query;

        const pool = await getConnection();
        let query = `
            SELECT 
                t.data_transacao,
                t.tipo,
                c.nome AS categoria,
                t.descricao,
                t.valor
            FROM transacoes t
            INNER JOIN categorias c ON t.id_categoria = c.id_categoria
            WHERE t.id_usuario = @id_usuario
        `;

        const request = pool.request();
        request.input('id_usuario', sql.Int, id_usuario);

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

        query += ' ORDER BY t.data_transacao DESC';

        const resultado = await request.query(query);
        const transacoes = resultado.recordset;

        // Criar PDF
        const doc = new PDFDocument({ margin: 50 });

        // Configurar headers para download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=transacoes.pdf');

        doc.pipe(res);

        // Cabeçalho
        doc.fontSize(20).text('GestEasy - Relatório de Transações', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, { align: 'center' });
        doc.moveDown();

        // Filtros aplicados
        if (data_inicial || data_final || categoria || tipo) {
            doc.fontSize(12).text('Filtros Aplicados:', { underline: true });
            if (data_inicial) doc.fontSize(10).text(`Data Inicial: ${data_inicial}`);
            if (data_final) doc.fontSize(10).text(`Data Final: ${data_final}`);
            if (tipo) doc.fontSize(10).text(`Tipo: ${tipo}`);
            doc.moveDown();
        }

        // Tabela de transações
        doc.fontSize(12).text('Transações:', { underline: true });
        doc.moveDown(0.5);

        if (transacoes.length === 0) {
            doc.fontSize(10).text('Nenhuma transação encontrada.', { align: 'center' });
        } else {
            // Cabeçalho da tabela
            const tableTop = doc.y;
            doc.fontSize(9).font('Helvetica-Bold');
            doc.text('Data', 50, tableTop);
            doc.text('Tipo', 120, tableTop);
            doc.text('Categoria', 180, tableTop);
            doc.text('Descrição', 270, tableTop);
            doc.text('Valor', 450, tableTop);

            doc.moveDown(0.5);
            doc.font('Helvetica');

            let totalReceitas = 0;
            let totalDespesas = 0;

            transacoes.forEach((transacao, i) => {
                const y = doc.y;
                
                // Quebra de página se necessário
                if (y > 700) {
                    doc.addPage();
                }

                const dataFormatada = new Date(transacao.data_transacao).toLocaleDateString('pt-BR');
                const valorFormatado = parseFloat(transacao.valor).toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                });

                doc.fontSize(8);
                doc.text(dataFormatada, 50, doc.y);
                doc.text(transacao.tipo, 120, y);
                doc.text(transacao.categoria, 180, y, { width: 80 });
                doc.text(transacao.descricao || '-', 270, y, { width: 170 });
                doc.text(valorFormatado, 450, y);

                if (transacao.tipo === 'receita') {
                    totalReceitas += parseFloat(transacao.valor);
                } else {
                    totalDespesas += parseFloat(transacao.valor);
                }

                doc.moveDown(0.3);
            });

            // Totais
            doc.moveDown();
            doc.fontSize(10).font('Helvetica-Bold');
            doc.text(`Total de Receitas: ${totalReceitas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, { align: 'right' });
            doc.text(`Total de Despesas: ${totalDespesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, { align: 'right' });
            doc.text(`Saldo: ${(totalReceitas - totalDespesas).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, { align: 'right' });
        }

        doc.end();

    } catch (error) {
        console.error('Erro ao exportar PDF:', error);
        res.status(500).json({ 
            sucesso: false, 
            mensagem: 'Erro ao exportar PDF.' 
        });
    }
};

// Exportar transações para CSV
const exportarCSV = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;
        const { data_inicial, data_final, categoria, tipo } = req.query;

        const pool = await getConnection();
        let query = `
            SELECT 
                t.data_transacao,
                t.tipo,
                c.nome AS categoria,
                t.descricao,
                t.valor
            FROM transacoes t
            INNER JOIN categorias c ON t.id_categoria = c.id_categoria
            WHERE t.id_usuario = @id_usuario
        `;

        const request = pool.request();
        request.input('id_usuario', sql.Int, id_usuario);

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

        query += ' ORDER BY t.data_transacao DESC';

        const resultado = await request.query(query);
        const transacoes = resultado.recordset;

        // Criar arquivo CSV temporário
        const timestamp = Date.now();
        const csvPath = path.join(__dirname, `../../temp_transacoes_${timestamp}.csv`);

        // Garantir que o diretório existe
        const dir = path.dirname(csvPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const csvWriter = createObjectCsvWriter({
            path: csvPath,
            header: [
                { id: 'data_transacao', title: 'Data' },
                { id: 'tipo', title: 'Tipo' },
                { id: 'categoria', title: 'Categoria' },
                { id: 'descricao', title: 'Descrição' },
                { id: 'valor', title: 'Valor' }
            ],
            encoding: 'utf8'
        });

        // Formatar dados
        const dadosFormatados = transacoes.map(t => ({
            data_transacao: new Date(t.data_transacao).toLocaleDateString('pt-BR'),
            tipo: t.tipo,
            categoria: t.categoria,
            descricao: t.descricao || '',
            valor: parseFloat(t.valor).toFixed(2)
        }));

        await csvWriter.writeRecords(dadosFormatados);

        // Enviar arquivo
        res.download(csvPath, 'transacoes.csv', (err) => {
            // Deletar arquivo temporário após download
            if (fs.existsSync(csvPath)) {
                fs.unlinkSync(csvPath);
            }

            if (err) {
                console.error('Erro ao enviar CSV:', err);
                if (!res.headersSent) {
                    res.status(500).json({ 
                        sucesso: false, 
                        mensagem: 'Erro ao exportar CSV.' 
                    });
                }
            }
        });

    } catch (error) {
        console.error('Erro ao exportar CSV:', error);
        res.status(500).json({ 
            sucesso: false, 
            mensagem: 'Erro ao exportar CSV.' 
        });
    }
};

module.exports = {
    exportarPDF,
    exportarCSV
};
