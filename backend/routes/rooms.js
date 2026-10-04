const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../db');
const path = require('path');
const fs = require('fs');

// GET all rooms (bao gồm image_url và kiểm tra trống theo khoảng ngày)
router.get('/', async (req, res) => {
    try {
        const pool = await getPool();
        const type_id = req.query.type_id;
        const capacity = req.query.capacity;
        const check_in = req.query.check_in;
        const check_out = req.query.check_out;

        let queryStr = `
            SELECT r.id, r.room_number, r.current_price, r.status, r.image_url, r.images, r.room_type_id, rt.type_name, rt.capacity 
        `;

        if (check_in && check_out) {
            queryStr += `, 
                CASE 
                    WHEN r.status = 'Maintenance' THEN 'Maintenance'
                    WHEN EXISTS (
                        SELECT 1 FROM Bookings b 
                        WHERE b.room_id = r.id 
                          AND b.booking_status NOT IN ('Cancelled', 'CheckedOut')
                          AND (b.check_in_date < @check_out AND b.check_out_date > @check_in)
                    ) THEN 'Booked'
                    ELSE 'Available'
                END AS date_status
            `;
        }

        queryStr += `
            FROM Rooms r
            JOIN RoomTypes rt ON r.room_type_id = rt.id
            WHERE 1=1
        `;
        
        if (type_id) {
            queryStr += ` AND r.room_type_id = @type_id`;
        }
        if (capacity) {
            queryStr += ` AND rt.capacity >= @capacity`;
        }
        queryStr += ` ORDER BY r.room_number ASC`;

        const request = pool.request();
        if (type_id) request.input('type_id', sql.Int, parseInt(type_id));
        if (capacity) request.input('capacity', sql.Int, parseInt(capacity));
        if (check_in && check_out) {
            request.input('check_in', sql.Date, check_in);
            request.input('check_out', sql.Date, check_out);
        }

        const result = await request.query(queryStr);

        // Gán trạng thái và chuẩn hóa danh sách ảnh (images array)
        const mapped = result.recordset.map(r => {
            let imgList = [];
            if (r.images) {
                try {
                    const parsed = JSON.parse(r.images);
                    if (Array.isArray(parsed)) imgList = parsed.filter(Boolean);
                } catch {
                    imgList = r.images.split(',').map(s => s.trim()).filter(Boolean);
                }
            }
            if (imgList.length === 0 && r.image_url) {
                imgList = [r.image_url];
            }

            return {
                ...r,
                status: r.date_status || r.status,
                image_url: imgList[0] || r.image_url || null,
                images: imgList
            };
        });

        res.json(mapped);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách phòng' });
    }
});

// GET room types
router.get('/types', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query('SELECT * FROM RoomTypes ORDER BY id ASC');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy loại phòng' });
    }
});

// POST upload room image (base64)
router.post('/upload-image', async (req, res) => {
    try {
        const { imageBase64, fileName } = req.body;
        if (!imageBase64) {
            return res.status(400).json({ message: 'Vui lòng cung cấp dữ liệu hình ảnh' });
        }

        // Tách chuỗi data URI: data:image/png;base64,...
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

        const safeFileName = `room_${Date.now()}_${Math.floor(Math.random() * 1000)}${ext}`;
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const filePath = path.join(uploadsDir, safeFileName);
        fs.writeFileSync(filePath, buffer);

        const imageUrl = `/uploads/${safeFileName}`;
        res.json({ imageUrl });
    } catch (err) {
        console.error('Upload image error:', err);
        res.status(500).json({ message: 'Không thể lưu hình ảnh' });
    }
});

// POST create new room
router.post('/', async (req, res) => {
    try {
        const { room_number, room_type_id, current_price, status, image_url, images } = req.body;

        if (!room_number || !room_type_id || current_price === undefined) {
            return res.status(400).json({ message: 'Vui lòng điền đủ số phòng, loại phòng và giá' });
        }

        const pool = await getPool();

        // Kiểm tra trùng số phòng
        const checkDuplicate = await pool.request()
            .input('room_number', sql.VarChar, room_number.trim())
            .query('SELECT id FROM Rooms WHERE room_number = @room_number');

        if (checkDuplicate.recordset.length > 0) {
            return res.status(400).json({ message: `Số phòng ${room_number} đã tồn tại!` });
        }

        let imagesArr = [];
        if (Array.isArray(images)) {
            imagesArr = images.filter(Boolean);
        } else if (typeof images === 'string' && images) {
            imagesArr = [images];
        }
        if (imagesArr.length === 0 && image_url) {
            imagesArr = [image_url];
        }
        const imagesJson = imagesArr.length > 0 ? JSON.stringify(imagesArr) : null;
        const mainImageUrl = imagesArr[0] || image_url || null;

        const insertRes = await pool.request()
            .input('room_number', sql.VarChar, room_number.trim())
            .input('room_type_id', sql.Int, parseInt(room_type_id))
            .input('current_price', sql.Decimal(18, 2), parseFloat(current_price))
            .input('status', sql.VarChar, status || 'Available')
            .input('image_url', sql.NVarChar(sql.MAX), mainImageUrl)
            .input('images', sql.NVarChar(sql.MAX), imagesJson)
            .query(`
                INSERT INTO Rooms (room_number, room_type_id, current_price, status, image_url, images)
                OUTPUT INSERTED.*
                VALUES (@room_number, @room_type_id, @current_price, @status, @image_url, @images)
            `);

        res.status(201).json({ message: 'Thêm phòng thành công', room: insertRes.recordset[0] });
    } catch (err) {
        console.error('Create room error:', err);
        res.status(500).json({ message: 'Lỗi server khi thêm phòng: ' + err.message });
    }
});

// PUT update room
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { room_number, room_type_id, current_price, status, image_url, images } = req.body;

        const pool = await getPool();

        // Kiểm tra phòng có tồn tại không
        const checkRoom = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT id FROM Rooms WHERE id = @id');

        if (checkRoom.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy phòng' });
        }

        // Kiểm tra trùng số phòng với phòng khác
        if (room_number) {
            const checkDuplicate = await pool.request()
                .input('id', sql.Int, id)
                .input('room_number', sql.VarChar, room_number.trim())
                .query('SELECT id FROM Rooms WHERE room_number = @room_number AND id != @id');

            if (checkDuplicate.recordset.length > 0) {
                return res.status(400).json({ message: `Số phòng ${room_number} đã được sử dụng bởi phòng khác!` });
            }
        }

        let imagesArr = [];
        if (Array.isArray(images)) {
            imagesArr = images.filter(Boolean);
        } else if (typeof images === 'string' && images) {
            imagesArr = [images];
        }
        if (imagesArr.length === 0 && image_url) {
            imagesArr = [image_url];
        }
        const imagesJson = imagesArr.length > 0 ? JSON.stringify(imagesArr) : null;
        const mainImageUrl = imagesArr[0] || image_url || null;

        await pool.request()
            .input('id', sql.Int, id)
            .input('room_number', sql.VarChar, room_number.trim())
            .input('room_type_id', sql.Int, parseInt(room_type_id))
            .input('current_price', sql.Decimal(18, 2), parseFloat(current_price))
            .input('status', sql.VarChar, status || 'Available')
            .input('image_url', sql.NVarChar(sql.MAX), mainImageUrl)
            .input('images', sql.NVarChar(sql.MAX), imagesJson)
            .query(`
                UPDATE Rooms
                SET room_number = @room_number,
                    room_type_id = @room_type_id,
                    current_price = @current_price,
                    status = @status,
                    image_url = @image_url,
                    images = @images
                WHERE id = @id
            `);

        res.json({ message: 'Cập nhật phòng thành công' });
    } catch (err) {
        console.error('Update room error:', err);
        res.status(500).json({ message: 'Lỗi server khi cập nhật phòng: ' + err.message });
    }
});

// DELETE room
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getPool();

        // Kiểm tra phòng có đơn đặt hay không
        const checkBookings = await pool.request()
            .input('room_id', sql.Int, id)
            .query('SELECT COUNT(*) as count FROM Bookings WHERE room_id = @room_id');

        if (checkBookings.recordset[0].count > 0) {
            return res.status(400).json({
                message: 'Không thể xóa phòng này vì đã có lịch sử đơn đặt phòng! Bạn có thể chuyển trạng thái phòng sang "Bảo trì".'
            });
        }

        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Rooms WHERE id = @id');

        res.json({ message: 'Xóa phòng thành công' });
    } catch (err) {
        console.error('Delete room error:', err);
        res.status(500).json({ message: 'Lỗi server khi xóa phòng: ' + err.message });
    }
});

module.exports = router;

