'''
# GestEasy – Sistema de Gestão Financeira Pessoal

![GestEasy](https://img.shields.io/badge/GestEasy-v1.0.0-blue?style=for-the-badge&logo=wallet)

**GestEasy** é uma aplicação web completa e responsiva para controle de finanças pessoais. Desenvolvida como um projeto full stack, a aplicação permite que usuários cadastrem-se, registrem suas receitas e despesas, criem categorias personalizadas, definam orçamentos e visualizem sua saúde financeira através de um dashboard intuitivo com gráficos.

---

## ✨ Funcionalidades Principais

O sistema foi projetado para ser uma ferramenta robusta e fácil de usar, implementando as seguintes funcionalidades:

- **Autenticação de Usuários (US1):**
  - Cadastro seguro com nome, e-mail (único) e senha com hash (bcrypt).
  - Login com validação e criação de sessão (JWT).
  - Timeout de sessão configurável (padrão: 30 minutos).

- **Gestão de Transações (US2, US3):**
  - CRUD completo para receitas e despesas.
  - Campos: tipo, valor, data, categoria, descrição.
  - Listagem avançada com filtros por período, tipo e categoria, busca por descrição, ordenação e paginação (50 itens/página).

- **Dashboard Financeiro (US4):**
  - Página inicial com resumo do saldo atual, total de receitas e despesas do mês.
  - Gráficos interativos para análise visual.
  - Acesso rápido às transações recentes.

- **Categorias Personalizadas (US5):**
  - CRUD completo para categorias, vinculadas ao usuário.
  - Criação de categorias padrão no momento do cadastro do usuário (ex: Alimentação, Transporte, Lazer).
  - Regra de negócio para impedir exclusão de categorias com transações vinculadas.

- **Gráficos e Relatórios (US6):**
  - **Gráfico de Pizza:** Despesas por categoria no período selecionado.
  - **Gráfico de Barras:** Comparativo de Receitas vs. Despesas por mês.
  - **Gráfico de Linha:** Evolução do saldo ao longo do tempo.

- **Orçamentos Mensais (US7):**
  - CRUD de orçamentos por categoria com valor limite.
  - Cálculo automático do percentual utilizado.
  - Alertas visuais e barra de progresso para indicar o status do orçamento (≥80% amarelo, ≥90% laranja, ≥100% vermelho).

- **Exportação de Dados (US8):**
  - Exportação da lista de transações (com filtros aplicados) para os formatos **PDF** e **CSV**.

---

## 🛠️ Stack de Tecnologias

O projeto foi construído utilizando uma stack moderna e robusta, garantindo performance e escalabilidade.

| Camada       | Tecnologia        | Descrição                                        |
|--------------|-------------------|--------------------------------------------------|
| **Frontend** | HTML5, CSS3, JS   | Estrutura, estilo e interatividade da interface. |
|              | Bootstrap 5       | Framework CSS para design responsivo e componentes.|
|              | Chart.js          | Biblioteca para criação de gráficos interativos. |
| **Backend**  | Node.js           | Ambiente de execução JavaScript no servidor.     |
|              | Express.js        | Framework para construção de APIs RESTful.       |
|              | JWT e Sessions    | Para autenticação e gerenciamento de sessão.     |
| **Banco de Dados** | SQL Server    | SGBD relacional para armazenamento dos dados.    |
| **Outros**   | Git               | Sistema de controle de versão.                   |
|              | NPM               | Gerenciador de pacotes do Node.js.               |

---

## 🚀 Como Executar o Projeto Localmente

Siga os passos abaixo para configurar e rodar o GestEasy em seu ambiente de desenvolvimento.

### Pré-requisitos

- **Node.js** (versão 14 ou superior)
- **NPM** (geralmente instalado com o Node.js)
- **SQL Server** (2017 ou superior, incluindo a versão Express ou Developer)
- **Git** (para clonar o repositório)

### 1. Clonar o Repositório

```bash
git clone <URL_DO_REPOSITORIO>
cd GestEasy
```

### 2. Configurar o Banco de Dados

1.  Abra o **SQL Server Management Studio (SSMS)** ou uma ferramenta de sua preferência.
2.  Execute o script `database/01_create_database.sql`. Este script irá:
    - Criar o banco de dados `GestEasy`.
    - Criar todas as tabelas necessárias (`usuarios`, `categorias`, `transacoes`, `orcamentos`).
    - Criar índices para otimização de consultas.
3.  Execute o script `database/02_seed_data.sql`. Este script irá:
    - Criar uma *stored procedure* `sp_criar_categorias_padrao` que é executada ao registrar um novo usuário para popular categorias iniciais.
    - Criar *views* para facilitar consultas de resumo.

### 3. Configurar o Backend

1.  Navegue até a pasta do backend:
    ```bash
    cd backend
    ```

2.  Instale as dependências do Node.js:
    ```bash
    npm install
    ```

3.  Crie uma cópia do arquivo de ambiente de exemplo:
    ```bash
    cp .env.example .env
    ```

4.  Abra o arquivo `.env` e configure as variáveis de ambiente, especialmente as do banco de dados:
    ```env
    # Configurações do Servidor
    PORT=3000

    # Configurações do Banco de Dados SQL Server
    DB_SERVER=localhost # Ou o endereço do seu servidor SQL
    DB_USER=sa # Seu usuário do SQL Server
    DB_PASSWORD=YourStrong@Passw0rd # Sua senha do SQL Server
    DB_NAME=GestEasy
    DB_ENCRYPT=false
    DB_TRUST_CERT=true

    # Configurações de Autenticação (opcional: altere os segredos)
    JWT_SECRET=seu_segredo_jwt_super_secreto_aqui_mude_em_producao
    SESSION_SECRET=seu_segredo_session_super_secreto_aqui_mude_em_producao
    SESSION_TIMEOUT=1800000 # 30 minutos em milissegundos
    ```

### 4. Iniciar a Aplicação

1.  Com o banco de dados e o backend configurados, inicie o servidor a partir da pasta `backend`:
    ```bash
    npm start
    ```

2.  O servidor irá iniciar e se conectar ao banco de dados. Você verá uma mensagem de confirmação no terminal.

3.  Abra seu navegador e acesse a aplicação em:
    [**http://localhost:3000**](http://localhost:3000)

A aplicação estará pronta para uso! Você pode se cadastrar e começar a usar o GestEasy.

---

## 📂 Estrutura de Pastas

O projeto está organizado da seguinte forma para facilitar a manutenção e o desenvolvimento:

```
GestEasy/
├── backend/                # Código-fonte do servidor Node.js
│   ├── src/
│   │   ├── config/         # Configuração de banco de dados
│   │   ├── controllers/    # Lógica de negócio e controle das rotas
│   │   ├── middleware/     # Middlewares (ex: autenticação)
│   │   ├── models/         # (Opcional) Modelos de dados
│   │   ├── routes/         # Definição das rotas da API
│   │   └── utils/          # Funções utilitárias
│   ├── .env              # Variáveis de ambiente (local)
│   ├── .env.example      # Exemplo de variáveis de ambiente
│   ├── package.json      # Dependências e scripts do backend
│   └── server.js         # Arquivo principal do servidor Express
├── database/               # Scripts SQL
│   ├── 01_create_database.sql
│   └── 02_seed_data.sql
├── frontend/               # Arquivos da interface do usuário
│   ├── css/              # Folhas de estilo
│   ├── js/               # Scripts JavaScript
│   ├── index.html        # Página inicial (landing page)
│   ├── login.html        # Página de login
│   └── ...               # Demais páginas HTML
└── README.md               # Este arquivo
```

---

## 📝 Autor

Este projeto foi desenvolvido por **Manus**, um desenvolvedor full stack sênior.

'''
