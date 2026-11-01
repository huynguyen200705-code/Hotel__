const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../db');

// GET AI price suggestion
router.get('/suggest-price', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT r.id, r.room_number, r.current_price, rt.type_name, rt.base_price
            FROM Rooms r
            JOIN RoomTypes rt ON r.room_type_id = rt.id
        `);

        const rooms = result.recordset;
        
        // Mock AI Logic:
        // If today is Friday or Saturday, suggest +15%
        // Else suggest -5% (off-peak)
        const today = new Date().getDay();
        const isWeekend = today === 5 || today === 6; // 5=Friday, 6=Saturday
        const modifierPercent = isWeekend ? 15.0 : -5.0;

        const suggestions = rooms.map(room => {
            const suggestedPrice = Math.round(room.base_price * (1 + modifierPercent / 100));
            const isApplied = Math.abs(Number(room.current_price) - suggestedPrice) < 1;
            return {
                ...room,
                base_price: Number(room.base_price),
                current_price: Number(room.current_price),
                suggested_price: suggestedPrice,
                modifier_percent: modifierPercent,
                is_applied: isApplied,
                reason: isWeekend ? "Tăng giá nhu cầu cuối tuần (+15%)" : "Giảm giá kích cầu ngày thường (-5%)"
            };
        });

        const pendingCount = suggestions.filter(s => !s.is_applied).length;

        res.json({
            modifier_percent: modifierPercent,
            reason: isWeekend ? "Nhu cầu cao điểm cuối tuần (Thứ 6 & Thứ 7)" : "Nhu cầu ngày thường (Off-peak)",
            pending_count: pendingCount,
            suggestions
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST apply suggested prices
router.post('/apply-price', async (req, res) => {
    try {
        const { suggestions } = req.body;
        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        
        await transaction.begin();

        try {
            for (const item of suggestions) {
                await transaction.request()
                    .input('id', sql.Int, item.id)
                    .input('new_price', sql.Decimal(18,2), item.suggested_price)
                    .query(`UPDATE Rooms SET current_price = @new_price WHERE id = @id`);
            }
            await transaction.commit();
            res.json({ message: 'Prices updated successfully' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
