CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name NVARCHAR(100) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('Admin', 'Staff')) NOT NULL,
    status BIT DEFAULT 1 -- 1 = Active, 0 = Inactive
);

-- Bảng tài khoản đăng nhập cho khách hàng (phân biệt với Users là Admin/Staff)
CREATE TABLE CustomerAccounts (
    id INT IDENTITY(1,1) PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name NVARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    customer_id INT NULL, -- FK tới Customers khi có profile
    role VARCHAR(20) DEFAULT 'Customer' CHECK (role = 'Customer'),
    status BIT DEFAULT 1, -- 1 = Active, 0 = Inactive
    created_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE Customers (
    id INT IDENTITY(1,1) PRIMARY KEY,
    customer_code VARCHAR(20) UNIQUE NOT NULL,
    full_name NVARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    id_card VARCHAR(20) UNIQUE,
    total_spent DECIMAL(18,2) DEFAULT 0,
    points INT DEFAULT 0,
    membership_tier NVARCHAR(20) DEFAULT N'Thường' CHECK (membership_tier IN (N'Thường', N'Bạc', N'Vàng', N'Kim Cương')),
    status BIT DEFAULT 1
);


CREATE TABLE RoomTypes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    type_name NVARCHAR(50) NOT NULL,
    base_price DECIMAL(18,2) NOT NULL,
    description NVARCHAR(500),
    capacity INT DEFAULT 2
);

CREATE TABLE Rooms (
    id INT IDENTITY(1,1) PRIMARY KEY,
    room_number VARCHAR(10) UNIQUE NOT NULL,
    room_type_id INT FOREIGN KEY REFERENCES RoomTypes(id),
    current_price DECIMAL(18,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'Available' CHECK (status IN ('Available', 'Booked', 'Maintenance'))
);

CREATE TABLE Bookings (
    id INT IDENTITY(1,1) PRIMARY KEY,
    booking_code VARCHAR(20) UNIQUE NOT NULL,
    customer_id INT FOREIGN KEY REFERENCES Customers(id),
    room_id INT FOREIGN KEY REFERENCES Rooms(id),
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    total_amount DECIMAL(18,2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid', 'Refunded')),
    booking_status VARCHAR(20) DEFAULT 'Confirmed' CHECK (booking_status IN ('Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled'))
);

CREATE TABLE Payments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    booking_id INT FOREIGN KEY REFERENCES Bookings(id),
    payment_method NVARCHAR(50) NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    payment_date DATETIME DEFAULT GETDATE()
);

CREATE TABLE PriceRules (
    id INT IDENTITY(1,1) PRIMARY KEY,
    rule_name NVARCHAR(100) NOT NULL,
    price_modifier_percent DECIMAL(5,2) NOT NULL, -- e.g., 20.00 for +20%, -10.00 for -10%
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BIT DEFAULT 1
);


CREATE TABLE CustomerLogs (
    id INT IDENTITY(1,1) PRIMARY KEY,
    customer_id INT FOREIGN KEY REFERENCES Customers(id),
    action NVARCHAR(200) NOT NULL,
    note NVARCHAR(500),
    created_at DATETIME DEFAULT GETDATE()
);

-- Password '123456' được hash bằng bcrypt (salt rounds = 10)
INSERT INTO Users (username, password_hash, full_name, role) VALUES 
('admin', '$2b$10$dYl3qGeqMjsSlqQArLnkqOiZnuLRF8z7OKqhq/MNwLv1P.QEW2Uie', N'Quản trị viên', 'Admin'),
('staff1', '$2b$10$dYl3qGeqMjsSlqQArLnkqOiZnuLRF8z7OKqhq/MNwLv1P.QEW2Uie', N'Nhân viên 1', 'Staff');


INSERT INTO Customers (customer_code, full_name, phone, email, id_card, total_spent, points, membership_tier) VALUES
('CUST001', N'Nguyễn Văn A', '0901234567', 'nva@email.com', '123456789', 5000000, 500, N'Bạc'),
('CUST002', N'Trần Thị B', '0912345678', 'ttb@email.com', '987654321', 15000000, 1500, N'Vàng'),
('CUST003', N'Lê Văn C', '0923456789', 'lvc@email.com', '111222333', 30000000, 3000, N'Kim Cương'),
('CUST004', N'Phạm Thị D', '0934567890', 'ptd@email.com', '444555666', 1000000, 100, N'Thường'),
('CUST005', N'Hoàng Văn E', '0945678901', 'hve@email.com', '777888999', 0, 0, N'Thường');

INSERT INTO Customers (customer_code, full_name, phone, email, membership_tier) VALUES
('CUST006', N'Khách Hàng 6', '0900000006', 'kh6@email.com', N'Thường'),
('CUST007', N'Khách Hàng 7', '0900000007', 'kh7@email.com', N'Thường'),
('CUST008', N'Khách Hàng 8', '0900000008', 'kh8@email.com', N'Bạc'),
('CUST009', N'Khách Hàng 9', '0900000009', 'kh9@email.com', N'Vàng'),
('CUST010', N'Khách Hàng 10', '0900000010', 'kh10@email.com', N'Kim Cương'),
('CUST011', N'Khách Hàng 11', '0900000011', 'kh11@email.com', N'Thường'),
('CUST012', N'Khách Hàng 12', '0900000012', 'kh12@email.com', N'Bạc'),
('CUST013', N'Khách Hàng 13', '0900000013', 'kh13@email.com', N'Vàng'),
('CUST014', N'Khách Hàng 14', '0900000014', 'kh14@email.com', N'Thường'),
('CUST015', N'Khách Hàng 15', '0900000015', 'kh15@email.com', N'Bạc');


INSERT INTO RoomTypes (type_name, base_price, description, capacity) VALUES
(N'Tiêu chuẩn', 500000, N'Phòng tiện nghi tiêu chuẩn', 2),
(N'Cao cấp', 800000, N'Phòng cao cấp đầy đủ tiện ích', 2),
(N'Sang trọng', 1200000, N'Phòng sang trọng view đẹp', 3),
(N'Thượng hạng', 2500000, N'Phòng tổng thống, thượng hạng bậc nhất', 4);


INSERT INTO Rooms (room_number, room_type_id, current_price, status) VALUES
('101', 1, 500000, 'Available'),
('102', 1, 500000, 'Available'),
('103', 1, 500000, 'Available'),
('201', 2, 800000, 'Available'),
('202', 2, 800000, 'Booked'),
('203', 2, 800000, 'Available'),
('301', 3, 1200000, 'Maintenance'),
('302', 3, 1200000, 'Available'),
('401', 4, 2500000, 'Available'),
('402', 4, 2500000, 'Available');


INSERT INTO Bookings (booking_code, customer_id, room_id, check_in_date, check_out_date, total_amount, payment_status, booking_status) VALUES
('BK001', 1, 1, '2026-09-01', '2026-09-03', 1000000, 'Paid', 'CheckedOut'),
('BK002', 2, 5, '2026-09-15', '2026-09-20', 4000000, 'Pending', 'Confirmed'),
('BK003', 3, 8, '2026-09-10', '2026-09-12', 2400000, 'Paid', 'CheckedIn'),
('BK004', 4, 2, '2026-09-25', '2026-09-26', 500000, 'Pending', 'Confirmed'),
('BK005', 5, 4, '2026-10-01', '2026-10-05', 3200000, 'Paid', 'Confirmed');


INSERT INTO Payments (booking_id, payment_method, amount) VALUES
(1, N'Thẻ tín dụng', 1000000),
(3, N'Chuyển khoản', 2400000),
(5, N'Tiền mặt', 3200000);


INSERT INTO PriceRules (rule_name, price_modifier_percent, start_date, end_date) VALUES
(N'Nghỉ lễ Quốc Khánh', 20.00, '2026-09-01', '2026-09-03'),
(N'Khuyến mãi mùa thu', -10.00, '2026-10-01', '2026-10-31');


INSERT INTO CustomerLogs (customer_id, action, note) VALUES
(1, N'Đặt phòng mới', N'Booking BK001'),
(1, N'Hoàn thành chuyến đi', N'Đã check-out'),
(2, N'Đặt phòng mới', N'Booking BK002');
