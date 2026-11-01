const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// ============================================================
// UNIFIED LOGIN (HỢP NHẤT ĐĂNG NHẬP: ADMIN / STAFF & KHÁCH HÀNG)
// ============================================================
router.post('/login', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const loginIdentifier = (username || email || '').trim();

        if (!loginIdentifier || !password) {
            return res.status(400).json({ message: 'Vui lòng nhập tài khoản/email và mật khẩu.' });
        }

        const pool = await poolPromise;
        if (!pool) {
            return res.status(503).json({ message: 'Không thể kết nối database. Kiểm tra SQL Server và file .env!' });
        }

        // 1. Kiểm tra trong bảng Users (Admin & Staff) trước
        const userResult = await pool.request()
            .input('identifier', sql.VarChar(100), loginIdentifier)
            .query("SELECT * FROM Users WHERE username = @identifier AND status = 1");

        if (userResult.recordset.length > 0) {
            const user = userResult.recordset[0];
            const validPassword = await bcrypt.compare(password, user.password_hash);

            if (validPassword) {
                const token = jwt.sign(
                    { id: user.id, username: user.username, role: user.role, fullName: user.full_name },
                    process.env.JWT_SECRET || 'your_jwt_secret_key_here',
                    { expiresIn: '24h' }
                );

                return res.json({
                    message: 'Đăng nhập thành công (Quản trị viên)',
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        fullName: user.full_name,
                        role: user.role // 'Admin' hoặc 'Staff'
                    }
                });
            }
        }

        // 2. Nếu không phải Admin/Staff, kiểm tra trong bảng CustomerAccounts (Khách hàng)
        const custResult = await pool.request()
            .input('identifier', sql.VarChar(100), loginIdentifier)
            .query("SELECT * FROM CustomerAccounts WHERE (email = @identifier OR phone = @identifier) AND status = 1");

        if (custResult.recordset.length > 0) {
            const cust = custResult.recordset[0];
            const validPassword = await bcrypt.compare(password, cust.password_hash);

            if (validPassword) {
                const token = jwt.sign(
                    { id: cust.id, email: cust.email, role: 'Customer', fullName: cust.full_name },
                    process.env.JWT_SECRET || 'your_jwt_secret_key_here',
                    { expiresIn: '7d' }
                );

                return res.json({
                    message: 'Đăng nhập thành công',
                    token,
                    user: {
                        id: cust.id,
                        email: cust.email,
                        fullName: cust.full_name,
                        role: 'Customer',
                        phone: cust.phone
                    }
                });
            }
        }

        // Nếu cả 2 đều không khớp
        return res.status(401).json({ message: 'Tài khoản/Email hoặc mật khẩu không chính xác.' });

    } catch (err) {
        console.error('Unified login error:', err);
        res.status(500).json({ message: 'Lỗi server khi đăng nhập', error: err.message });
    }
});

// ============================================================
// CUSTOMER REGISTER (đăng ký tài khoản khách hàng)
// ============================================================
router.post('/customer/register', async (req, res) => {
    try {
        const { email, password, full_name, phone } = req.body;

        if (!email || !password || !full_name) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin.' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Định dạng email không hợp lệ.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự.' });
        }

        const pool = await poolPromise;
        if (!pool) {
            return res.status(503).json({ message: 'Không thể kết nối database.' });
        }

        // Kiểm tra email đã tồn tại chưa
        const existing = await pool.request()
            .input('email', sql.VarChar(100), email)
            .query('SELECT id FROM CustomerAccounts WHERE email = @email');

        if (existing.recordset.length > 0) {
            return res.status(409).json({ message: 'Email này đã được đăng ký. Vui lòng đăng nhập.' });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const insertResult = await pool.request()
            .input('email', sql.VarChar(100), email)
            .input('password_hash', sql.VarChar(255), password_hash)
            .input('full_name', sql.NVarChar(100), full_name)
            .input('phone', sql.VarChar(20), phone || null)
            .query(`
                INSERT INTO CustomerAccounts (email, password_hash, full_name, phone)
                OUTPUT INSERTED.id, INSERTED.email, INSERTED.full_name, INSERTED.role
                VALUES (@email, @password_hash, @full_name, @phone)
            `);

        const newAccount = insertResult.recordset[0];

        const token = jwt.sign(
            { id: newAccount.id, email: newAccount.email, role: 'Customer', fullName: newAccount.full_name },
            process.env.JWT_SECRET || 'your_jwt_secret_key_here',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Đăng ký thành công!',
            token,
            user: {
                id: newAccount.id,
                email: newAccount.email,
                fullName: newAccount.full_name,
                role: 'Customer'
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
});

// ============================================================
// CUSTOMER LOGIN (đăng nhập tài khoản khách hàng)
// ============================================================
router.post('/customer/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu.' });
        }

        const pool = await poolPromise;
        if (!pool) {
            return res.status(503).json({ message: 'Không thể kết nối database.' });
        }

        const result = await pool.request()
            .input('email', sql.VarChar(100), email)
            .query('SELECT * FROM CustomerAccounts WHERE email = @email AND status = 1');

        if (result.recordset.length === 0) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
        }

        const account = result.recordset[0];
        const validPassword = await bcrypt.compare(password, account.password_hash);

        if (!validPassword) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
        }

        const token = jwt.sign(
            { id: account.id, email: account.email, role: 'Customer', fullName: account.full_name },
            process.env.JWT_SECRET || 'your_jwt_secret_key_here',
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Đăng nhập thành công',
            token,
            user: {
                id: account.id,
                email: account.email,
                fullName: account.full_name,
                role: 'Customer',
                phone: account.phone
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
});

// ============================================================
// UPDATE CUSTOMER PROFILE & PASSWORD
// ============================================================
router.put('/customer/profile', verifyToken, async (req, res) => {
    try {
        const customerId = req.user.id;
        const { fullName, phone, currentPassword, newPassword } = req.body;

        if (!fullName || !fullName.trim()) {
            return res.status(400).json({ message: 'Họ và tên không được để trống.' });
        }

        const pool = await poolPromise;
        if (!pool) {
            return res.status(503).json({ message: 'Không thể kết nối database.' });
        }

        // Lấy thông tin tài khoản hiện tại
        const custResult = await pool.request()
            .input('id', sql.Int, customerId)
            .query('SELECT * FROM CustomerAccounts WHERE id = @id AND status = 1');

        if (custResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy tài khoản người dùng.' });
        }

        const currentAccount = custResult.recordset[0];
        let newPasswordHash = null;

        // Nếu muốn đổi mật khẩu
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ message: 'Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu mới.' });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
            }

            const isMatch = await bcrypt.compare(currentPassword, currentAccount.password_hash);
            if (!isMatch) {
                return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác.' });
            }

            newPasswordHash = await bcrypt.hash(newPassword, 10);
        }

        const updateReq = pool.request()
            .input('id', sql.Int, customerId)
            .input('fullName', sql.NVarChar(100), fullName.trim())
            .input('phone', sql.VarChar(20), phone ? phone.trim() : null);

        let updateQuery = `
            UPDATE CustomerAccounts 
            SET full_name = @fullName, phone = @phone
        `;

        if (newPasswordHash) {
            updateReq.input('password_hash', sql.VarChar(255), newPasswordHash);
            updateQuery += `, password_hash = @password_hash `;
        }

        updateQuery += ` WHERE id = @id`;
        await updateReq.query(updateQuery);

        const updatedUser = {
            id: currentAccount.id,
            email: currentAccount.email,
            fullName: fullName.trim(),
            phone: phone ? phone.trim() : null,
            role: 'Customer'
        };

        return res.json({
            message: newPassword ? 'Cập nhật thông tin và đổi mật khẩu thành công!' : 'Cập nhật thông tin thành công!',
            user: updatedUser
        });

    } catch (err) {
        console.error('Update profile error:', err);
        return res.status(500).json({ message: 'Lỗi khi cập nhật thông tin', error: err.message });
    }
});

// ============================================================
// QUẢN LÝ TÀI KHOẢN & PHÂN QUYỀN (ADMIN ONLY)
// ============================================================

// GET all internal users (Admin/Staff)
router.get('/users', verifyToken, requireAdmin, async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT id, username, full_name, role, status
            FROM Users
            ORDER BY id ASC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi khi tải danh sách người dùng' });
    }
});

// POST create new staff/admin
router.post('/users', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { username, password, full_name, role } = req.body;
        if (!username || !password || !full_name || !role) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin!' });
        }

        const pool = await poolPromise;
        const existing = await pool.request()
            .input('username', sql.VarChar(50), username.trim())
            .query('SELECT id FROM Users WHERE username = @username');

        if (existing.recordset.length > 0) {
            return res.status(409).json({ message: 'Tên đăng nhập đã tồn tại!' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        await pool.request()
            .input('username', sql.VarChar(50), username.trim())
            .input('password_hash', sql.VarChar(255), password_hash)
            .input('full_name', sql.NVarChar(100), full_name.trim())
            .input('role', sql.VarChar(20), role)
            .query(`
                INSERT INTO Users (username, password_hash, full_name, role, status)
                VALUES (@username, @password_hash, @full_name, @role, 1)
            `);

        res.status(201).json({ message: 'Thêm tài khoản thành công!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server khi tạo người dùng' });
    }
});

// PUT update role or status
router.put('/users/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, role, status, password } = req.body;

        const pool = await poolPromise;
        const reqDb = pool.request().input('id', sql.Int, id);

        let queryStr = `UPDATE Users SET `;
        const updates = [];

        if (full_name) {
            reqDb.input('full_name', sql.NVarChar(100), full_name.trim());
            updates.push('full_name = @full_name');
        }
        if (role) {
            reqDb.input('role', sql.VarChar(20), role);
            updates.push('role = @role');
        }
        if (typeof status === 'boolean' || typeof status === 'number') {
            reqDb.input('status', sql.Bit, status ? 1 : 0);
            updates.push('status = @status');
        }
        if (password && password.length >= 6) {
            const hash = await bcrypt.hash(password, 10);
            reqDb.input('password_hash', sql.VarChar(255), hash);
            updates.push('password_hash = @password_hash');
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'Không có thông tin thay đổi.' });
        }

        queryStr += updates.join(', ') + ` WHERE id = @id`;
        await reqDb.query(queryStr);

        res.json({ message: 'Cập nhật tài khoản thành công!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server khi cập nhật' });
    }
});

// DELETE user
router.delete('/users/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        // Không cho phép xóa chính admin gốc id = 1
        if (parseInt(id, 10) === 1) {
            return res.status(403).json({ message: 'Không thể xóa tài khoản Quản trị viên gốc!' });
        }

        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Users WHERE id = @id');

        res.json({ message: 'Xóa tài khoản thành công!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi khi xóa người dùng' });
    }
});

module.exports = router;

