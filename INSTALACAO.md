# 📦 Guia Completo de Instalação - GestEasy

Este guia fornece instruções detalhadas para configurar e executar o **GestEasy** em seu ambiente local.

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado em seu sistema:

### 1. Node.js e NPM
- **Versão mínima:** Node.js 14.x ou superior
- **Download:** [https://nodejs.org/](https://nodejs.org/)
- **Verificar instalação:**
  ```bash
  node --version
  npm --version
  ```

### 2. SQL Server
- **Versões suportadas:** SQL Server 2017 ou superior
- **Edições:** Express, Developer ou Enterprise
- **Download:** [https://www.microsoft.com/sql-server/sql-server-downloads](https://www.microsoft.com/sql-server/sql-server-downloads)
- **Ferramentas recomendadas:**
  - SQL Server Management Studio (SSMS)
  - Azure Data Studio

### 3. Git (opcional)
- Para clonar o repositório
- **Download:** [https://git-scm.com/](https://git-scm.com/)

---

## 🔧 Passo a Passo de Instalação

### Passo 1: Obter o Código-fonte

Se você recebeu o projeto compactado, extraia os arquivos em uma pasta de sua preferência.

Se o projeto está em um repositório Git:
```bash
git clone <URL_DO_REPOSITORIO>
cd GestEasy
```

### Passo 2: Configurar o Banco de Dados SQL Server

#### 2.1. Conectar ao SQL Server

Abra o **SQL Server Management Studio (SSMS)** ou **Azure Data Studio** e conecte-se à sua instância do SQL Server.

**Informações de conexão padrão:**
- **Servidor:** `localhost` ou `.\SQLEXPRESS` (para SQL Server Express)
- **Autenticação:** Windows Authentication ou SQL Server Authentication
- **Usuário:** `sa` (se usar SQL Server Authentication)

#### 2.2. Executar Scripts de Criação

1. Abra o arquivo `database/01_create_database.sql` no SSMS ou Azure Data Studio.

2. Execute o script completo. Este script irá:
   - Criar o banco de dados `GestEasy`
   - Criar as tabelas: `usuarios`, `categorias`, `transacoes`, `orcamentos`
   - Criar índices para otimização de consultas

3. Verifique se o banco foi criado com sucesso:
   ```sql
   USE GestEasy;
   SELECT * FROM sys.tables;
   ```

4. Abra o arquivo `database/02_seed_data.sql` e execute-o. Este script irá:
   - Criar a stored procedure `sp_criar_categorias_padrao`
   - Criar views para consultas otimizadas

#### 2.3. Verificar Configurações de Conexão

Certifique-se de que o SQL Server está configurado para aceitar conexões TCP/IP:

1. Abra o **SQL Server Configuration Manager**
2. Navegue até **SQL Server Network Configuration** > **Protocols for [SUA_INSTANCIA]**
3. Habilite **TCP/IP**
4. Reinicie o serviço do SQL Server

### Passo 3: Configurar o Backend

#### 3.1. Instalar Dependências

Navegue até a pasta do backend e instale as dependências:

```bash
cd backend
npm install
```

Este comando instalará todos os pacotes necessários listados no `package.json`:
- express
- mssql
- bcrypt
- jsonwebtoken
- express-session
- dotenv
- cors
- pdfkit
- csv-writer
- e outros...

#### 3.2. Configurar Variáveis de Ambiente

1. Copie o arquivo de exemplo:
   ```bash
   cp .env.example .env
   ```

2. Abra o arquivo `.env` em um editor de texto e configure as variáveis:

   ```env
   # Configurações do Servidor
   PORT=3000
   NODE_ENV=development

   # Configurações do Banco de Dados SQL Server
   DB_SERVER=localhost
   # Para SQL Server Express, use: .\SQLEXPRESS
   DB_USER=sa
   DB_PASSWORD=SuaSenhaAqui
   DB_NAME=GestEasy
   DB_ENCRYPT=false
   DB_TRUST_CERT=true

   # Configurações de Autenticação
   JWT_SECRET=seu_segredo_jwt_super_secreto_aqui_mude_em_producao
   SESSION_SECRET=seu_segredo_session_super_secreto_aqui_mude_em_producao
   SESSION_TIMEOUT=1800000
   ```

   **Importante:**
   - Substitua `DB_PASSWORD` pela senha do seu usuário SQL Server
   - Se estiver usando SQL Server Express, ajuste `DB_SERVER` para `.\SQLEXPRESS`
   - Em produção, **SEMPRE** altere os segredos (`JWT_SECRET` e `SESSION_SECRET`)

### Passo 4: Iniciar a Aplicação

#### 4.1. Modo de Desenvolvimento

Para iniciar o servidor em modo de desenvolvimento (com reinicialização automática):

```bash
npm run dev
```

#### 4.2. Modo de Produção

Para iniciar o servidor em modo de produção:

```bash
npm start
```

#### 4.3. Verificar Inicialização

Você deverá ver uma mensagem semelhante a esta no terminal:

```
========================================
   GestEasy - Sistema de Gestão Financeira
========================================
✓ Conectado ao SQL Server com sucesso
✓ Servidor rodando na porta 3000
✓ Ambiente: development
✓ URL: http://localhost:3000
========================================
```

### Passo 5: Acessar a Aplicação

Abra seu navegador e acesse:

**[http://localhost:3000](http://localhost:3000)**

Você será redirecionado para a página inicial do GestEasy.

---

## 🧪 Testando a Aplicação

### Criar Primeiro Usuário

1. Clique em **"Começar Agora"** ou acesse diretamente [http://localhost:3000/registro.html](http://localhost:3000/registro.html)
2. Preencha o formulário de cadastro:
   - Nome completo
   - E-mail (único)
   - Senha (mínimo 6 caracteres)
3. Clique em **"Cadastrar"**

Após o cadastro, você será automaticamente logado e redirecionado para o Dashboard.

### Explorar Funcionalidades

- **Dashboard:** Visualize o resumo financeiro e gráficos
- **Transações:** Adicione receitas e despesas
- **Categorias:** Gerencie suas categorias personalizadas
- **Orçamentos:** Defina limites de gastos por categoria

---

## 🔍 Solução de Problemas

### Erro de Conexão com o Banco de Dados

**Sintoma:** Mensagem de erro ao iniciar o servidor: "Erro ao conectar ao SQL Server"

**Soluções:**
1. Verifique se o SQL Server está rodando:
   - Abra **Services** (services.msc)
   - Procure por "SQL Server (MSSQLSERVER)" ou "SQL Server (SQLEXPRESS)"
   - Certifique-se de que o status está "Running"

2. Verifique as credenciais no arquivo `.env`:
   - `DB_SERVER`, `DB_USER`, `DB_PASSWORD` estão corretos?
   - Para SQL Server Express, use `.\SQLEXPRESS` como servidor

3. Verifique se o TCP/IP está habilitado (veja Passo 2.3)

### Erro de Porta em Uso

**Sintoma:** "Error: listen EADDRINUSE: address already in use :::3000"

**Solução:**
1. Altere a porta no arquivo `.env`:
   ```env
   PORT=3001
   ```
2. Ou finalize o processo que está usando a porta 3000

### Módulos Não Encontrados

**Sintoma:** "Error: Cannot find module 'express'"

**Solução:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

---

## 🚀 Próximos Passos

Após a instalação bem-sucedida:

1. **Explore a aplicação** e familiarize-se com todas as funcionalidades
2. **Personalize as categorias** de acordo com suas necessidades
3. **Configure orçamentos** para controlar seus gastos
4. **Exporte relatórios** para análise externa

---

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação completa no arquivo `README.md`.

**Bom uso do GestEasy!** 💰✨
