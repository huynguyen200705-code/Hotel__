const { getPool } = require('./db');

async function migrate() {
  try {
    const pool = await getPool();
    await pool.request().query(`
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Rooms' AND COLUMN_NAME = 'image_url'
      )
      BEGIN
        ALTER TABLE Rooms ADD image_url NVARCHAR(1000) NULL;
        PRINT 'Added image_url column to Rooms table';
      END
    `);
    console.log('Migration successful: image_url ready');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();