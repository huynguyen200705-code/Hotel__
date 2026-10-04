const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../db');
const jwt = require('jsonwebtoken');

// GET my bookings (Lịch sử đặt phòng của khách hàng đang đăng nhập)
router.get('/my', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Chưa đăng nhập' });
        }

        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
        } catch {
            return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
        }

        const pool = await getPool();
        
        // Tìm customer trong bảng CustomerAccounts
        const custAcc = await pool.request()
            .input('id', sql.Int, decoded.id)
            .query('SELECT * FROM CustomerAccounts WHERE id = @id');

        if (custAcc.recordset.length === 0) {
            return res.json([]);
        }

        const email = custAcc.recordset[0].email;
        const phone = custAcc.recordset[0].phone;

        // Lấy lịch sử đặt phòng qua phone hoặc email
        let queryStr = `
            SELECT b.*, c.full_name as customer_name, c.phone as customer_phone, r.room_number, r.image_url, rt.type_name
            FROM Bookings b
            JOIN Customers c ON b.customer_id = c.id
            JOIN Rooms r ON b.room_id = r.id
            JOIN RoomTypes rt ON r.room_type_id = rt.id
            WHERE 1=0
        `;

        const request = pool.request();
        if (phone) {
            queryStr += ` OR c.phone = @phone`;
            request.input('phone', sql.VarChar, phone);
        }
        if (email) {
            queryStr += ` OR c.email = @email`;
            request.input('email', sql.VarChar, email);
        }

        queryStr += ` ORDER BY b.id DESC`;

        const result = await request.query(queryStr);
        res.json(result.recordset);
    } catch (err) {
        console.error('Lỗi lấy lịch sử đặt phòng:', err);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
});

// GET all bookings (Admin/Staff)
router.get('/', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT b.*, c.full_name as customer_name, c.phone as customer_phone, r.room_number, rt.type_name
            FROM Bookings b
            JOIN Customers c ON b.customer_id = c.id
            JOIN Rooms r ON b.room_id = r.id
            JOIN RoomTypes rt ON r.room_type_id = rt.id
            ORDER BY b.id DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST upload bill thanh toán / đặt cọc (base64)
router.post('/upload-bill', async (req, res) => {
    try {
        const { imageBase64, fileName } = req.body;
        if (!imageBase64) {
            return res.status(400).json({ message: 'Vui lòng cung cấp hình ảnh bill chuyển khoản' });
        }

        const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        let ext = '.png';
        let buffer;

        if (matches && matches.length === 3) {
            const mime = matches[1];
            if (mime.includes('jpeg') || mime.includes('jpg')) ext = '.jpg';
            else if (mime.includes('webp')) ext = '.webp';
            else if (mime.includes('gif')) ext = '.gif';
            buffer = Buffer.from(matches[2], 'base64');
        } else {
            buffer = Buffer.from(imageBase64, 'base64');
        }

        const safeFileName = `bill_${Date.now()}_${Math.floor(Math.random() * 1000)}${ext}`;
        const uploadsDir = require('path').join(__dirname, '..', 'uploads');
        const fs = require('fs');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const filePath = require('path').join(uploadsDir, safeFileName);
        fs.writeFileSync(filePath, buffer);

        const billUrl = `/uploads/${safeFileName}`;
        res.json({ billUrl });
    } catch (err) {
        console.error('Upload bill error:', err);
        res.status(500).json({ message: 'Không thể lưu hình ảnh bill thanh toán' });
    }
});

// POST create booking (Chuyên nghiệp: Kiểm tra trùng ngày, cập nhật điểm, tiền cọc, phương thức và bill chuyển khoản)
router.post('/', async (req, res) => {
    try {
        const {
            full_name, phone, email, room_id,
            check_in_date, check_out_date, total_amount,
            special_requests, payment_method, deposit_amount, bill_image_url
        } = req.body;

        if (!full_name || !phone || !room_id || !check_in_date || !check_out_date) {
            return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin đặt phòng!' });
        }

        const pool = await getPool();

        // 1. Kiểm tra xem phòng có đang bị đặt trùng ngày không (Chống Double-Booking)
        const overlapCheck = await pool.request()
            .input('room_id', sql.Int, room_id)
            .input('check_in', sql.Date, check_in_date)
            .input('check_out', sql.Date, check_out_date)
            .query(`
                SELECT TOP 1 booking_code, check_in_date, check_out_date 
                FROM Bookings 
                WHERE room_id = @room_id 
                  AND booking_status NOT IN ('Cancelled', 'CheckedOut')
                  AND (check_in_date < @check_out AND check_out_date > @check_in)
            `);

        if (overlapCheck.recordset.length > 0) {
            return res.status(409).json({ 
                message: 'Rất tiếc! Phòng này vừa có khách khác đặt trong khoảng thời gian trên. Vui lòng chọn ngày khác hoặc phòng khác.' 
            });
        }

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // 2. Tìm hoặc tạo hồ sơ khách hàng
            let customer_id;
            const custRes = await transaction.request()
                .input('phone', sql.VarChar, phone)
                .query('SELECT id, total_spent, points FROM Customers WHERE phone = @phone');
            
            if (custRes.recordset.length > 0) {
                customer_id = custRes.recordset[0].id;
                // Cập nhật chi tiêu và tích điểm (mỗi 100.000đ = 10 điểm)
                const addedPoints = Math.floor((total_amount || 0) / 10000);
                await transaction.request()
                    .input('id', sql.Int, customer_id)
                    .input('amount', sql.Decimal(18,2), total_amount || 0)
                    .input('points', sql.Int, addedPoints)
                    .query(`
                        UPDATE Customers 
                        SET total_spent = ISNULL(total_spent, 0) + @amount,
                            points = ISNULL(points, 0) + @points,
                            membership_tier = CASE 
                                WHEN (ISNULL(total_spent, 0) + @amount) >= 50000000 THEN N'Kim Cương'
                                WHEN (ISNULL(total_spent, 0) + @amount) >= 20000000 THEN N'Vàng'
                                WHEN (ISNULL(total_spent, 0) + @amount) >= 5000000  THEN N'Bạc'
                                ELSE N'Thường'
                            END
                        WHERE id = @id
                    `);
            } else {
                const codeRes = await transaction.request().query("SELECT 'CUST' + RIGHT('000' + CAST(ISNULL(MAX(ID), 0) + 1 AS VARCHAR(10)), 3) AS new_code FROM Customers");
                const customer_code = codeRes.recordset[0].new_code;
                const points = Math.floor((total_amount || 0) / 10000);

                const newCust = await transaction.request()
                    .input('customer_code', sql.VarChar, customer_code)
                    .input('full_name', sql.NVarChar, full_name)
                    .input('phone', sql.VarChar, phone)
                    .input('email', sql.VarChar, email || null)
                    .input('total_spent', sql.Decimal(18,2), total_amount || 0)
                    .input('points', sql.Int, points)
                    .query(`INSERT INTO Customers (customer_code, full_name, phone, email, total_spent, points, membership_tier) 
                            OUTPUT INSERTED.id
                            VALUES (@customer_code, @full_name, @phone, @email, @total_spent, @points, N'Thường')`);
                customer_id = newCust.recordset[0].id;
            }

            // 3. Tạo Booking với mã ngẫu nhiên chuyên nghiệp, phân tách dễ đọc (LX-YYMMDD-XXXX)
            const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
            const randSuffix = Math.floor(1000 + Math.random() * 9000);
            const booking_code = `LX-${dateStr}-${randSuffix}`;

            // Xác định payment_status: nếu là Full Transfer thì là 'Paid', nếu là Deposit thì 'Partial', nếu Hotel thì 'Pending'
            const payment_status = payment_method === 'full_transfer' ? 'Paid' : (payment_method === 'deposit_hotel' ? 'Partial' : 'Pending');

            const bookingRes = await transaction.request()
                .input('booking_code', sql.VarChar, booking_code)
                .input('customer_id', sql.Int, customer_id)
                .input('room_id', sql.Int, room_id)
                .input('check_in_date', sql.Date, check_in_date)
                .input('check_out_date', sql.Date, check_out_date)
                .input('total_amount', sql.Decimal(18,2), total_amount)
                .input('deposit_amount', sql.Decimal(18,2), deposit_amount || null)
                .input('payment_method', sql.NVarChar(50), payment_method || 'hotel')
                .input('payment_status', sql.VarChar(20), payment_status)
                .input('bill_image_url', sql.NVarChar(sql.MAX), bill_image_url || null)
                .input('booking_status', sql.VarChar, 'Confirmed')
                .query(`INSERT INTO Bookings (
                            booking_code, customer_id, room_id, 
                            check_in_date, check_out_date, total_amount, 
                            deposit_amount, payment_method, payment_status, bill_image_url, booking_status
                        )
                        OUTPUT INSERTED.*
                        VALUES (
                            @booking_code, @customer_id, @room_id, 
                            @check_in_date, @check_out_date, @total_amount, 
                            @deposit_amount, @payment_method, @payment_status, @bill_image_url, @booking_status
                        )`);

            // 4. Log hoạt động
            await transaction.request()
                .input('customer_id', sql.Int, customer_id)
                .input('action', sql.NVarChar, 'Đặt phòng trực tuyến')
                .input('note', sql.NVarChar, `Mã đơn: ${booking_code} | PT: ${payment_method || 'Tại khách sạn'} | Cọc: ${deposit_amount || 0}đ | Bill: ${bill_image_url ? 'Có' : 'Không'}`)
                .query(`INSERT INTO CustomerLogs (customer_id, action, note) VALUES (@customer_id, @action, @note)`);

            await transaction.commit();
            res.status(201).json({
                ...bookingRes.recordset[0],
                message: 'Đặt phòng thành công!'
            });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message || 'Lỗi xử lý đặt phòng' });
    }
});

// PUT cập nhật trạng thái đơn đặt phòng (Confirmed, CheckedIn, CheckedOut, Cancelled)
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { booking_status } = req.body;

        if (!['Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled'].includes(booking_status)) {
            return res.status(400).json({ message: 'Trạng thái đơn không hợp lệ!' });
        }

        const pool = await getPool();
        
        // Cập nhật trạng thái
        await pool.request()
            .input('id', sql.Int, id)
            .input('status', sql.VarChar, booking_status)
            .query('UPDATE Bookings SET booking_status = @status WHERE id = @id');

        // Nếu CheckedIn, đổi trạng thái phòng thành Booked; nếu CheckedOut hoặc Cancelled, đổi thành Available
        const bookingRes = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT room_id, customer_id, booking_code FROM Bookings WHERE id = @id');

        if (bookingRes.recordset.length > 0) {
            const { room_id, customer_id, booking_code } = bookingRes.recordset[0];
            let newRoomStatus = null;
            if (booking_status === 'CheckedIn') newRoomStatus = 'Booked';
            else if (booking_status === 'CheckedOut' || booking_status === 'Cancelled') newRoomStatus = 'Available';

            if (newRoomStatus) {
                await pool.request()
                    .input('room_id', sql.Int, room_id)
                    .input('room_status', sql.VarChar, newRoomStatus)
                    .query('UPDATE Rooms SET status = @room_status WHERE id = @room_id');
            }

            // Ghi log
            await pool.request()
                .input('customer_id', sql.Int, customer_id)
                .input('action', sql.NVarChar, `Cập nhật trạng thái đơn ${booking_code}`)
                .input('note', sql.NVarChar, `Trạng thái mới: ${booking_status}`)
                .query('INSERT INTO CustomerLogs (customer_id, action, note) VALUES (@customer_id, @action, @note)');
        }

        res.json({ message: 'Cập nhật trạng thái đơn thành công!' });
    } catch (err) {
        console.error('Lỗi cập nhật trạng thái:', err);
        res.status(500).json({ message: 'Lỗi cập nhật đơn đặt phòng' });
    }
});

// DELETE hủy/xóa đơn đặt phòng
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getPool();

        // Lấy room_id để cập nhật lại phòng
        const bRes = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT room_id FROM Bookings WHERE id = @id');

        if (bRes.recordset.length > 0) {
            const roomId = bRes.recordset[0].room_id;
            await pool.request()
                .input('room_id', sql.Int, roomId)
                .query("UPDATE Rooms SET status = 'Available' WHERE id = @room_id");
        }

        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Bookings WHERE id = @id');

        res.json({ message: 'Xóa đơn đặt phòng thành công!' });
    } catch (err) {
        console.error('Lỗi xóa đơn:', err);
        res.status(500).json({ message: 'Lỗi xóa đơn đặt phòng' });
    }
});

module.exports = router;
