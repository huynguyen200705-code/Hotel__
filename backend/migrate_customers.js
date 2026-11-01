const { getPool, sql } = require('./db');
require('dotenv').config();

const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương'];
const middleNames = ['Văn', 'Thị', 'Đức', 'Hữu', 'Minh', 'Thanh', 'Hải', 'Ngọc', 'Quốc', 'Thảo', 'Trang'];
const lastNames = ['An', 'Bình', 'Cường', 'Dũng', 'Đạt', 'Hoa', 'Hương', 'Linh', 'Nam', 'Quân', 'Tâm', 'Tuấn', 'Khang', 'Bảo', 'Nhi'];

const generateName = () => {
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${middleNames[Math.floor(Math.random() * middleNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
};

async function migrate() {
    console.log('Bắt đầu sinh dữ liệu 2500 khách hàng...');
    try {
        const pool = await getPool();
        let successCount = 0;

        for (let i = 0; i < 25; i++) {
            const transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                for (let j = 0; j < 100; j++) {
                    const idx = i * 100 + j + 1000; // Start at CUST1000 to prevent PK conflicts with existing records
                    const customer_code = `CUST${idx}`;
                    const full_name = generateName();
                    const phone = `09${Math.floor(10000000 + Math.random() * 90000000)}`;
                    const total_spent = Math.floor(Math.random() * 50000000);
                    const points = Math.floor(total_spent / 10000);
                    
                    let tier = 'Thường';
                    if (total_spent >= 50000000) tier = 'Kim Cương';
                    else if (total_spent >= 20000000) tier = 'Vàng';
                    else if (total_spent >= 5000000) tier = 'Bạc';

                    await transaction.request()
                        .input('customer_code', sql.VarChar, customer_code)
                        .input('full_name', sql.NVarChar, full_name)
                        .input('phone', sql.VarChar, phone)
                        .input('email', sql.VarChar, `khach${idx}@email.com`)
                        .input('total_spent', sql.Decimal(18,2), total_spent)
                        .input('points', sql.Int, points)
                        .input('membership_tier', sql.NVarChar, tier)
                        .query(`
                            INSERT INTO Customers (customer_code, full_name, phone, email, total_spent, points, membership_tier)
                            VALUES (@customer_code, @full_name, @phone, @email, @total_spent, @points, @membership_tier)
                        `);
                    successCount++;
                }
                await transaction.commit();
                console.log(`Đã import batch ${i + 1}/25...`);
            } catch (err) {
                await transaction.rollback();
                console.error(`Lỗi ở batch ${i + 1}:`, err);
            }
        }
        console.log(`Đã tạo thành công ${successCount} khách hàng!`);
        process.exit(0);
    } catch (err) {
        console.error('Lỗi tổng:', err);
        process.exit(1);
    }
}

migrate();
