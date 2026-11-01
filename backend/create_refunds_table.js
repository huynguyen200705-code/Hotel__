const { getPool } = require('./db');
require('dotenv').config();

async function run() {
    try {
        const pool = await getPool();
        
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='RefundRequests' and xtype='U')
            BEGIN
                CREATE TABLE RefundRequests (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    booking_id INT FOREIGN KEY REFERENCES Bookings(id),
                    bank_name NVARCHAR(100) NOT NULL,
                    account_number VARCHAR(50) NOT NULL,
                    account_name NVARCHAR(100) NOT NULL,
                    reason NVARCHAR(500),
                    refund_amount DECIMAL(18,2) NOT NULL,
                    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Rejected')),
                    created_at DATETIME DEFAULT GETDATE(),
                    completed_at DATETIME NULL
                );
            END
        `);
        console.log("RefundRequests table created or already exists.");

        // Add 'Refund_Pending' to Bookings.booking_status
        const res = await pool.request().query(`
            SELECT name 
            FROM sys.check_constraints 
            WHERE parent_object_id = OBJECT_ID('Bookings') 
              AND definition LIKE '%booking_status%'
        `);
        if (res.recordset.length > 0) {
            const constraintName = res.recordset[0].name;
            await pool.request().query(`ALTER TABLE Bookings DROP CONSTRAINT ${constraintName}`);
            await pool.request().query(`ALTER TABLE Bookings ADD CONSTRAINT CK_Booking_Status CHECK (booking_status IN ('Pending_Payment', 'Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled', 'Refund_Pending'))`);
            console.log("Updated booking_status constraint to include 'Refund_Pending'");
        }

        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}
run();
