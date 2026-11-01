const { getPool } = require('./db');
require('dotenv').config();

async function run() {
    try {
        const pool = await getPool();
        
        // Add created_at
        try {
            await pool.request().query(`ALTER TABLE Bookings ADD created_at DATETIME DEFAULT GETDATE();`);
            console.log("Added created_at to Bookings");
        } catch(e) { console.log(e.message) }

        // Add expires_at
        try {
            await pool.request().query(`ALTER TABLE Bookings ADD expires_at DATETIME;`);
            console.log("Added expires_at to Bookings");
        } catch(e) { console.log(e.message) }
        
        // Modify constraint for booking_status
        // Find constraint name
        const res = await pool.request().query(`
            SELECT name 
            FROM sys.check_constraints 
            WHERE parent_object_id = OBJECT_ID('Bookings') 
              AND definition LIKE '%booking_status%'
        `);
        if (res.recordset.length > 0) {
            const constraintName = res.recordset[0].name;
            await pool.request().query(`ALTER TABLE Bookings DROP CONSTRAINT ${constraintName}`);
            await pool.request().query(`ALTER TABLE Bookings ADD CONSTRAINT CK_Booking_Status CHECK (booking_status IN ('Pending_Payment', 'Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled'))`);
            console.log("Updated booking_status constraint to include 'Pending_Payment'");
        }
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}
run();
