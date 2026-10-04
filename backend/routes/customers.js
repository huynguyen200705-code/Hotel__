const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../db');

// Middleware to verify token (simplified for now, ideally put in separate file)
const verifyToken = (req, res, next) => {
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !== 'undefined') {
        const bearer = bearerHeader.split(' ');
        req.token = bearer[1];
        next();
    } else {
        res.sendStatus(403);
    }
};

// GET all customers with pagination, search, filter
router.get('/', async (req, res) => {
    try {
        const pool = await getPool();
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const tier = req.query.tier || '';

        let queryStr = `SELECT * FROM Customers WHERE status = 1`;
        let countStr = `SELECT COUNT(*) as total FROM Customers WHERE status = 1`;

        if (search) {
            queryStr += ` AND (full_name LIKE @search OR phone LIKE @search OR customer_code LIKE @search)`;
            countStr += ` AND (full_name LIKE @search OR phone LIKE @search OR customer_code LIKE @search)`;
        }
        if (tier) {
            queryStr += ` AND membership_tier = @tier`;
            countStr += ` AND membership_tier = @tier`;
        }

        queryStr += ` ORDER BY id DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;

        const request = pool.request();
        if (search) request.input('search', sql.NVarChar, `%${search}%`);
        if (tier) request.input('tier', sql.NVarChar, tier);
        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, limit);

        const result = await request.query(queryStr);

        const countRequest = pool.request();
        if (search) countRequest.input('search', sql.NVarChar, `%${search}%`);
        if (tier) countRequest.input('tier', sql.NVarChar, tier);
        const countResult = await countRequest.query(countStr);

        res.json({
            data: result.recordset,
            total: countResult.recordset[0].total,
            page,
            limit
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST create customer
router.post('/', async (req, res) => {
    try {
        const { full_name, phone, email, id_card } = req.body;
        const pool = await getPool();
        
        // Generate customer code
        const codeRes = await pool.request().query("SELECT 'CUST' + RIGHT('000' + CAST(ISNULL(MAX(ID), 0) + 1 AS VARCHAR(10)), 3) AS new_code FROM Customers");
        const customer_code = codeRes.recordset[0].new_code;

        const result = await pool.request()
            .input('customer_code', sql.VarChar, customer_code)
            .input('full_name', sql.NVarChar, full_name)
            .input('phone', sql.VarChar, phone)
            .input('email', sql.VarChar, email)
            .input('id_card', sql.VarChar, id_card)
            .query(`INSERT INTO Customers (customer_code, full_name, phone, email, id_card) 
                    OUTPUT INSERTED.*
                    VALUES (@customer_code, @full_name, @phone, @email, @id_card)`);
        
        res.status(201).json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT update customer
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, phone, email, id_card, membership_tier } = req.body;
        const pool = await getPool();

        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('full_name', sql.NVarChar, full_name)
            .input('phone', sql.VarChar, phone)
            .input('email', sql.VarChar, email)
            .input('id_card', sql.VarChar, id_card)
            .input('membership_tier', sql.NVarChar, membership_tier)
            .query(`UPDATE Customers 
                    SET full_name = @full_name, phone = @phone, email = @email, id_card = @id_card, membership_tier = @membership_tier
                    WHERE id = @id;
                    SELECT * FROM Customers WHERE id = @id`);
        
        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE customer (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getPool();
        await pool.request()
            .input('id', sql.Int, id)
            .query(`UPDATE Customers SET status = 0 WHERE id = @id`);
        res.json({ message: 'Customer deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST import customers
router.post('/import', async (req, res) => {
    try {
        const customers = req.body; // Expecting an array of customer objects
        if (!Array.isArray(customers) || customers.length === 0) {
            return res.status(400).json({ message: 'Invalid data format' });
        }

        const pool = await getPool();
        let importedCount = 0;

        for (const cust of customers) {
            const codeRes = await pool.request().query("SELECT 'CUST' + RIGHT('000' + CAST(ISNULL(MAX(ID), 0) + 1 AS VARCHAR(10)), 3) AS new_code FROM Customers");
            const customer_code = codeRes.recordset[0].new_code;

            await pool.request()
                .input('customer_code', sql.VarChar, customer_code)
                .input('full_name', sql.NVarChar, cust.full_name || '')
                .input('phone', sql.VarChar, cust.phone || '')
                .input('email', sql.VarChar, cust.email || '')
                .query(`INSERT INTO Customers (customer_code, full_name, phone, email) 
                        VALUES (@customer_code, @full_name, @phone, @email)`);
            importedCount++;
        }

        res.json({ message: `Imported ${importedCount} customers successfully.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during import' });
    }
});

module.exports = router;
