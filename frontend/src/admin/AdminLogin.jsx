import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { LockOutlined, UserOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function AdminLogin() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Nếu đã đăng nhập với role Admin/Staff thì redirect thẳng vào dashboard
  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 > Date.now() && (payload.role === 'Admin' || payload.role === 'Staff')) {
          navigate('/admin/dashboard', { replace: true });
        }
      }
    } catch { /* ignore */ }
  }, [navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', values);
      // Xóa phiên khách hàng cũ (nếu có)
      localStorage.removeItem('customerToken');
      localStorage.removeItem('customerUser');
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      message.success(`Chào mừng, ${res.data.user.fullName}!`);
      window.location.href = '/admin/dashboard';
    } catch (err) {
      message.error(err.response?.data?.message || 'Đăng nhập thất bại!');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}
      />

      <div className="relative w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏨</div>
          <h1 className="text-3xl font-bold text-white tracking-wide">LuxeHotel CRM</h1>
          <p className="text-blue-300 mt-2">Hệ thống quản lý khách sạn</p>
        </div>

        <Card
          className="rounded-3xl border-0 shadow-2xl"
          style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <h2 className="text-xl font-bold text-white text-center mb-6">Đăng nhập quản trị</h2>

          <Form layout="vertical" onFinish={onFinish} size="large">
            <Form.Item name="username" rules={[{ required: true, message: 'Nhập tên đăng nhập!' }]}>
              <Input
                prefix={<UserOutlined className="text-gray-400" />}
                placeholder="Tên đăng nhập"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: 12, height: 48 }}
              />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: 'Nhập mật khẩu!' }]}>
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="Mật khẩu"
                iconRender={(visible) => visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />}
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: 12, height: 48 }}
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full font-bold text-base rounded-xl"
              style={{ height: 50, background: 'linear-gradient(135deg, #1677ff 0%, #4f46e5 100%)', border: 'none', marginTop: 8 }}
            >
              Đăng nhập
            </Button>
          </Form>

          <div className="text-center mt-6">
            <p className="text-blue-300 text-xs opacity-60">
              Trang đăng nhập dành riêng cho quản trị viên và nhân viên.
            </p>
          </div>
        </Card>

        <div className="text-center mt-6">
          <Link to="/" className="text-blue-300 hover:text-white transition-colors text-sm">
            ← Quay về trang khách hàng
          </Link>
        </div>
      </div>
    </div>
  );
}
export default AdminLogin;
