-- =============================================
-- GestEasy - Sistema de Gestão Financeira Pessoal
-- Script de Dados Iniciais (Seed)
-- =============================================

USE GestEasy;
GO

-- =============================================
-- Procedure: Criar categorias padrão para novo usuário
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_criar_categorias_padrao')
BEGIN
    DROP PROCEDURE sp_criar_categorias_padrao;
END
GO

CREATE PROCEDURE sp_criar_categorias_padrao
    @id_usuario INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Categorias de Despesas
    INSERT INTO categorias (id_usuario, nome, tipo, cor, icone)
    VALUES 
        (@id_usuario, 'Alimentação', 'despesa', '#FF6384', 'fa-utensils'),
        (@id_usuario, 'Transporte', 'despesa', '#36A2EB', 'fa-car'),
        (@id_usuario, 'Saúde', 'despesa', '#4BC0C0', 'fa-heartbeat'),
        (@id_usuario, 'Lazer', 'despesa', '#FFCE56', 'fa-gamepad'),
        (@id_usuario, 'Educação', 'despesa', '#9966FF', 'fa-graduation-cap'),
        (@id_usuario, 'Moradia', 'despesa', '#FF9F40', 'fa-home'),
        (@id_usuario, 'Vestuário', 'despesa', '#FF6384', 'fa-tshirt'),
        (@id_usuario, 'Contas', 'despesa', '#C9CBCF', 'fa-file-invoice-dollar'),
        (@id_usuario, 'Outros', 'ambos', '#6c757d', 'fa-ellipsis-h');
    
    -- Categorias de Receitas
    INSERT INTO categorias (id_usuario, nome, tipo, cor, icone)
    VALUES 
        (@id_usuario, 'Salário', 'receita', '#28a745', 'fa-money-bill-wave'),
        (@id_usuario, 'Freelance', 'receita', '#17a2b8', 'fa-laptop-code'),
        (@id_usuario, 'Investimentos', 'receita', '#ffc107', 'fa-chart-line'),
        (@id_usuario, 'Bônus', 'receita', '#20c997', 'fa-gift');
    
    PRINT '✓ Categorias padrão criadas para o usuário ' + CAST(@id_usuario AS NVARCHAR(10));
END
GO

-- =============================================
-- View: Resumo de transações por usuário
-- =============================================
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_resumo_transacoes')
BEGIN
    DROP VIEW vw_resumo_transacoes;
END
GO

CREATE VIEW vw_resumo_transacoes AS
SELECT 
    t.id_transacao,
    t.id_usuario,
    u.nome AS nome_usuario,
    t.tipo,
    t.valor,
    t.data_transacao,
    t.descricao,
    c.nome AS categoria,
    c.cor AS cor_categoria,
    c.icone AS icone_categoria,
    t.data_criacao
FROM transacoes t
INNER JOIN usuarios u ON t.id_usuario = u.id_usuario
INNER JOIN categorias c ON t.id_categoria = c.id_categoria;
GO

-- =============================================
-- View: Orçamentos com percentual usado
-- =============================================
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_orcamentos_status')
BEGIN
    DROP VIEW vw_orcamentos_status;
END
GO

CREATE VIEW vw_orcamentos_status AS
SELECT 
    o.id_orcamento,
    o.id_usuario,
    o.id_categoria,
    c.nome AS categoria,
    c.cor AS cor_categoria,
    o.mes,
    o.ano,
    o.valor_limite,
    ISNULL(SUM(t.valor), 0) AS valor_gasto,
    CASE 
        WHEN o.valor_limite > 0 THEN 
            CAST((ISNULL(SUM(t.valor), 0) / o.valor_limite * 100) AS DECIMAL(5,2))
        ELSE 0 
    END AS percentual_usado,
    CASE 
        WHEN ISNULL(SUM(t.valor), 0) >= o.valor_limite THEN 'danger'
        WHEN ISNULL(SUM(t.valor), 0) >= o.valor_limite * 0.9 THEN 'warning'
        WHEN ISNULL(SUM(t.valor), 0) >= o.valor_limite * 0.8 THEN 'info'
        ELSE 'success'
    END AS status_alerta
FROM orcamentos o
INNER JOIN categorias c ON o.id_categoria = c.id_categoria
LEFT JOIN transacoes t ON 
    t.id_categoria = o.id_categoria 
    AND t.tipo = 'despesa'
    AND MONTH(t.data_transacao) = o.mes 
    AND YEAR(t.data_transacao) = o.ano
GROUP BY 
    o.id_orcamento, o.id_usuario, o.id_categoria, c.nome, c.cor,
    o.mes, o.ano, o.valor_limite;
GO

PRINT '';
PRINT '========================================';
PRINT 'Procedures e Views criadas com sucesso!';
PRINT '========================================';
