const sql = require('mssql');
const config = { 
  user: 'sa', 
  password: 'Admin@123456', 
  server: '127.0.0.1', 
  database: 'HotelCRM', 
  port: 51348, 
  options: { encrypt: false, trustServerCertificate: true } 
};

async function createTable() {
  try {
    const pool = await sql.connect(config);
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CustomerAccounts' and xtype='U')
      CREATE TABLE CustomerAccounts (
          id INT IDENTITY(1,1) PRIMARY KEY,
          email VARCHAR(100) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          full_name NVARCHAR(100) NOT NULL,
          phone VARCHAR(20),
          customer_id INT NULL,
          role VARCHAR(20) DEFAULT 'Customer' CHECK (role = 'Customer'),
          status BIT DEFAULT 1,
          created_at DATETIME DEFAULT GETDATE()
      );
    `);
    console.log('CustomerAccounts table checked/created successfully.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
createTable();
