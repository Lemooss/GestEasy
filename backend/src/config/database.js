const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'YourStrong@Passw0rd',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'GestEasy',
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_CERT !== 'false',
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let pool = null;

async function getConnection() {
    try {
        if (pool) {
            return pool;
        }
        pool = await sql.connect(config);
        console.log('✓ Conectado ao SQL Server com sucesso');
        return pool;
    } catch (err) {
        console.error('✗ Erro ao conectar ao SQL Server:', err);
        throw err;
    }
}

async function closeConnection() {
    try {
        if (pool) {
            await pool.close();
            pool = null;
            console.log('✓ Conexão com SQL Server fechada');
        }
    } catch (err) {
        console.error('✗ Erro ao fechar conexão:', err);
    }
}

module.exports = {
    sql,
    getConnection,
    closeConnection
};
