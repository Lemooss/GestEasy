-- =============================================
-- GestEasy - Sistema de Gestão Financeira Pessoal
-- Script de Criação do Banco de Dados
-- =============================================

-- Criar banco de dados
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'GestEasy')
BEGIN
    CREATE DATABASE GestEasy;
    PRINT '✓ Banco de dados GestEasy criado com sucesso';
END
ELSE
BEGIN
    PRINT '! Banco de dados GestEasy já existe';
END
GO

USE GestEasy;
GO

-- =============================================
-- Tabela: usuarios
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'usuarios')
BEGIN
    CREATE TABLE usuarios (
        id_usuario INT IDENTITY(1,1) PRIMARY KEY,
        nome NVARCHAR(100) NOT NULL,
        email NVARCHAR(100) NOT NULL UNIQUE,
        senha_hash NVARCHAR(255) NOT NULL,
        data_criacao DATETIME DEFAULT GETDATE(),
        data_atualizacao DATETIME DEFAULT GETDATE(),
        ativo BIT DEFAULT 1
    );
    PRINT '✓ Tabela usuarios criada com sucesso';
END
ELSE
BEGIN
    PRINT '! Tabela usuarios já existe';
END
GO

-- =============================================
-- Tabela: categorias
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'categorias')
BEGIN
    CREATE TABLE categorias (
        id_categoria INT IDENTITY(1,1) PRIMARY KEY,
        id_usuario INT NOT NULL,
        nome NVARCHAR(50) NOT NULL,
        tipo NVARCHAR(10) CHECK (tipo IN ('receita', 'despesa', 'ambos')) DEFAULT 'ambos',
        cor NVARCHAR(7) DEFAULT '#6c757d',
        icone NVARCHAR(50) DEFAULT 'fa-folder',
        data_criacao DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
        CONSTRAINT UQ_categoria_usuario UNIQUE (id_usuario, nome)
    );
    PRINT '✓ Tabela categorias criada com sucesso';
END
ELSE
BEGIN
    PRINT '! Tabela categorias já existe';
END
GO

-- =============================================
-- Tabela: transacoes
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'transacoes')
BEGIN
    CREATE TABLE transacoes (
        id_transacao INT IDENTITY(1,1) PRIMARY KEY,
        id_usuario INT NOT NULL,
        id_categoria INT NOT NULL,
        tipo NVARCHAR(10) NOT NULL CHECK (tipo IN ('receita', 'despesa')),
        valor DECIMAL(15, 2) NOT NULL CHECK (valor > 0),
        data_transacao DATE NOT NULL,
        descricao NVARCHAR(255),
        data_criacao DATETIME DEFAULT GETDATE(),
        data_atualizacao DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
        FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria)
    );
    PRINT '✓ Tabela transacoes criada com sucesso';
END
ELSE
BEGIN
    PRINT '! Tabela transacoes já existe';
END
GO

-- =============================================
-- Tabela: orcamentos
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'orcamentos')
BEGIN
    CREATE TABLE orcamentos (
        id_orcamento INT IDENTITY(1,1) PRIMARY KEY,
        id_usuario INT NOT NULL,
        id_categoria INT NOT NULL,
        mes INT NOT NULL CHECK (mes BETWEEN 1 AND 12),
        ano INT NOT NULL CHECK (ano >= 2000),
        valor_limite DECIMAL(15, 2) NOT NULL CHECK (valor_limite > 0),
        data_criacao DATETIME DEFAULT GETDATE(),
        data_atualizacao DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
        FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria),
        CONSTRAINT UQ_orcamento_categoria_periodo UNIQUE (id_usuario, id_categoria, mes, ano)
    );
    PRINT '✓ Tabela orcamentos criada com sucesso';
END
ELSE
BEGIN
    PRINT '! Tabela orcamentos já existe';
END
GO

-- =============================================
-- Índices para otimização de consultas
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_transacoes_usuario_data')
BEGIN
    CREATE INDEX IX_transacoes_usuario_data ON transacoes(id_usuario, data_transacao DESC);
    PRINT '✓ Índice IX_transacoes_usuario_data criado';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_transacoes_categoria')
BEGIN
    CREATE INDEX IX_transacoes_categoria ON transacoes(id_categoria);
    PRINT '✓ Índice IX_transacoes_categoria criado';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_categorias_usuario')
BEGIN
    CREATE INDEX IX_categorias_usuario ON categorias(id_usuario);
    PRINT '✓ Índice IX_categorias_usuario criado';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_orcamentos_usuario_periodo')
BEGIN
    CREATE INDEX IX_orcamentos_usuario_periodo ON orcamentos(id_usuario, ano, mes);
    PRINT '✓ Índice IX_orcamentos_usuario_periodo criado';
END
GO

PRINT '';
PRINT '========================================';
PRINT 'Banco de dados GestEasy configurado!';
PRINT '========================================';
