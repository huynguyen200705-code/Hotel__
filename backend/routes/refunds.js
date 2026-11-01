const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../db');

// GET all refund requests
router.get('/', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT rr.*, b.booking_code, b.total_amount, c.full_name as customer_name, c.phone
            FROM RefundRequests rr
            JOIN Bookings b ON rr.booking_id = b.id
            JOIN Customers c ON b.customer_id = c.id
            ORDER BY rr.created_at DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// PUT complete a refund
router.put('/:id/complete', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Find refund request
            const rrRes = await transaction.request()
                .input('id', sql.Int, id)
                .query(`SELECT * FROM RefundRequests WHERE id = @id`);
                
            if (rrRes.recordset.length === 0) throw new Error('Không tìm thấy yêu cầu hoàn tiền');
            const rr = rrRes.recordset[0];
            
            if (rr.status !== 'Pending') throw new Error('Yêu cầu này đã được xử lý');

            // Update Refund status
            await transaction.request()
                .input('id', sql.Int, id)
                .query(`UPDATE RefundRequests SET status = 'Completed', completed_at = GETDATE() WHERE id = @id`);

            // Update Booking status to Cancelled and PaymentStatus to Refunded
            await transaction.request()
                .input('booking_id', sql.Int, rr.booking_id)
                .query(`UPDATE Bookings SET booking_status = 'Cancelled', payment_status = 'Refunded' WHERE id = @booking_id`);

            // Log
            const bRes = await transaction.request().input('booking_id', sql.Int, rr.booking_id).query(`SELECT customer_id FROM Bookings WHERE id = @booking_id`);
            if (bRes.recordset.length > 0) {
                await transaction.request()
                    .input('customer_id', sql.Int, bRes.recordset[0].customer_id)
                    .input('action', sql.NVarChar, 'Hoàn tiền thành công')
                    .input('note', sql.NVarChar, `Số tiền: ${rr.refund_amount} vào tài khoản ${rr.account_number}`)
                    .query(`INSERT INTO CustomerLogs (customer_id, action, note) VALUES (@customer_id, @action, @note)`);
            }

            await transaction.commit();
            res.json({ message: 'Hoàn tiền thành công' });
        } catch (e) {
            await transaction.rollback();
            throw e;
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message || 'Lỗi server' });
    }
});

module.exports = router;
