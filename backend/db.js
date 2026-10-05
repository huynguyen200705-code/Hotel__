const sql = require('mssql');
require('dotenv').config();

// Build config based on whether it's a named instance or not
const serverStr = process.env.DB_SERVER || 'localhost';

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || 'HotelCRM',
    requestTimeout: 30000,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// Handle named instance like .\SQLEXPRESS or localhost\SQLEXPRESS
if (serverStr.includes('\\')) {
    const [host, instance] = serverStr.split('\\');
    config.server = (host === '.' || host === '') ? 'localhost' : host;
    config.options.instanceName = instance;
} else {
    config.server = serverStr === '.' ? 'localhost' : serverStr;
    config.port = parseInt(process.env.DB_PORT) || 1433;
}

console.log(`🔌 Connecting to SQL Server: ${config.server}${config.options.instanceName ? '\\' + config.options.instanceName : ':' + (config.port || 1433)} / DB: ${config.database}`);

let poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log(`✅ Connected to SQL Server database: ${config.database}`);
        return pool;
    })
    .catch(err => {
        console.error('❌ Database Connection Failed!');
        console.error('   Error:', err.message);
        console.error('   → Kiểm tra SQL Server đang chạy, database đã tạo, và thông tin trong .env');
        return null;
    });

// Helper: lấy pool hoặc throw lỗi 503 rõ ràng
async function getPool() {
    const pool = await poolPromise;
    if (!pool) {
        const err = new Error('Không thể kết nối database. Kiểm tra SQL Server và file .env!');
        err.statusCode = 503;
        throw err;
    }
    return pool;
}

module.exports = {
    sql,
    poolPromise,
    getPool
};
