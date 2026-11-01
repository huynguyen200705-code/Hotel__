const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Vui lòng đăng nhập để thực hiện thao tác này.' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
        req.user = decoded; // Contains id, email/username, role, fullName
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
    }
};

const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Lỗi xác thực người dùng.' });
    }
    
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Truy cập bị từ chối. Chỉ Quản trị viên (Admin) mới có quyền này.' });
    }
    
    next();
};

module.exports = {
    verifyToken,
    requireAdmin
};
