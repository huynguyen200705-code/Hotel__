import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Rooms from './pages/Rooms';
import Checkout from './pages/Checkout';
import CustomerLogin from './pages/CustomerLogin';
import CustomerRegister from './pages/CustomerRegister';
import CustomerDashboard from './pages/CustomerDashboard';
import AdminLogin from './admin/AdminLogin';
import AdminLayout from './admin/AdminLayout';
import Dashboard from './admin/Dashboard';
import Customers from './admin/Customers';
import AdminRooms from './admin/Rooms';
import AdminBookings from './admin/Bookings';
import AIPricing from './admin/AIPricing';
import RolesManagement from './admin/RolesManagement';

// ==============================================================
// Helper: giải mã role từ JWT (không cần thư viện)
// ==============================================================
// ==============================================================
// Helper: giải mã role từ JWT (hỗ trợ cả token và customerToken)
// ==============================================================
const getRoleFromToken = (tokenKey = 'token') => {
  try {
    const token = localStorage.getItem(tokenKey) || localStorage.getItem('customerToken');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Kiểm tra hết hạn
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem(tokenKey);
        return null;
      }
      if (payload.role) return payload.role;
    }
    // Fallback nếu token dạng khác hoặc parse từ user object
    const storedUser = localStorage.getItem('user') || localStorage.getItem('customerUser');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      return parsed.role || null;
    }
    return null;
  } catch {
    return null;
  }
};

// ==============================================================
// Admin / Staff route guard — bảo vệ trang /admin
// ==============================================================
const AdminPrivateRoute = ({ children }) => {
  const role = getRoleFromToken('token');
  if (role !== 'Admin' && role !== 'Staff') {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Guard dành riêng cho quyền Admin (Staff không được vào)
const OnlyAdminRoute = ({ children }) => {
  const role = getRoleFromToken('token');
  if (role !== 'Admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return children;
};

// ==============================================================
// Customer route guard — bảo vệ trang /my-account
// ==============================================================
const CustomerPrivateRoute = ({ children }) => {
  const role = getRoleFromToken('customerToken') || getRoleFromToken('token');
  if (role !== 'Customer') return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* -------- Client Portal -------- */}
        <Route path="/" element={<Home />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/checkout" element={<Checkout />} />

        {/* -------- Customer Auth -------- */}
        <Route path="/login" element={<CustomerLogin />} />
        <Route path="/register" element={<CustomerRegister />} />

        {/* -------- Customer Protected -------- */}
        <Route
          path="/my-account"
          element={
            <CustomerPrivateRoute>
              <CustomerDashboard />
            </CustomerPrivateRoute>
          }
        />

        {/* -------- Admin Auth redirect to unified login -------- */}
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />

        {/* -------- Admin Protected (Admin & Staff only) -------- */}
        <Route
          path="/admin"
          element={
            <AdminPrivateRoute>
              <AdminLayout />
            </AdminPrivateRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="rooms" element={<AdminRooms />} />
          <Route path="customers" element={<Customers />} />
          {/* Các route chỉ dành riêng cho Quản trị viên (Admin) */}
          <Route
            path="ai-pricing"
            element={
              <OnlyAdminRoute>
                <AIPricing />
              </OnlyAdminRoute>
            }
          />
          <Route
            path="roles"
            element={
              <OnlyAdminRoute>
                <RolesManagement />
              </OnlyAdminRoute>
            }
          />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
