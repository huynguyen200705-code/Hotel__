import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function CustomerLogin() {
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.identifier || !form.password) {
      setError('Vui lòng nhập tài khoản hoặc email và mật khẩu.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', {
        username: form.identifier,
        email: form.identifier,
        password: form.password,
      });

      const { token, user } = res.data;

      // Lưu cả 2 key token để đảm bảo an toàn tuyệt đối cho mọi component
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('customerToken', token);
      localStorage.setItem('customerUser', JSON.stringify(user));

      if (user.role === 'Admin' || user.role === 'Staff') {
        window.location.href = '/admin/dashboard';
      } else {
        window.location.href = '/my-account';
      }
    } catch (err) {
      if (!err.response) {
        setError('Không thể kết nối server. Vui lòng kiểm tra backend đã chạy chưa.');
      } else {
        setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
      }
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0c1a2e 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative orbs */}
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)',
        top: -100, left: -100, pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', width: 350, height: 350, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(251,113,133,0.1) 0%, transparent 70%)',
        bottom: -80, right: -80, pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', width: 200, height: 200, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
        top: '40%', right: '15%', pointerEvents: 'none'
      }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: 440, padding: '0 20px' }}>
        {/* Logo / Brand */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 72, height: 72, borderRadius: 20,
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            fontSize: 32, marginBottom: 16, boxShadow: '0 8px 32px rgba(245,158,11,0.3)'
          }}>🏨</div>
          <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>
            LuxeHotel
          </h1>
          <p style={{ color: '#94a3b8', marginTop: 6, fontSize: 14 }}>
            Chào mừng trở lại! Đăng nhập để tiếp tục
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 24,
          padding: '36px 32px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)'
        }}>
          <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 600, margin: '0 0 24px', textAlign: 'center' }}>
            Đăng nhập tài khoản
          </h2>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 12, padding: '12px 16px', marginBottom: 20,
              color: '#fca5a5', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8
            }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Identifier (Username / Email) */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
                Tài khoản hoặc Email
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>👤</span>
                <input
                  id="customer-email"
                  type="text"
                  name="identifier"
                  placeholder="admin hoặc email@example.com"
                  value={form.identifier}
                  onChange={handleChange}
                  style={{
                    width: '100%', paddingLeft: 42, paddingRight: 16, height: 48,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12, color: '#fff', fontSize: 14, outline: 'none',
                    boxSizing: 'border-box', transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
                Mật khẩu
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔒</span>
                <input
                  id="customer-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Nhập mật khẩu"
                  value={form.password}
                  onChange={handleChange}
                  style={{
                    width: '100%', paddingLeft: 42, paddingRight: 48, height: 48,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12, color: '#fff', fontSize: 14, outline: 'none',
                    boxSizing: 'border-box', transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 0
                  }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              id="customer-login-btn"
              type="submit"
              disabled={loading}
              style={{
                width: '100%', height: 50, borderRadius: 12, border: 'none',
                background: loading ? 'rgba(245,158,11,0.5)' : 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                color: '#fff', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: loading ? 'none' : '0 4px 20px rgba(245,158,11,0.4)',
                transition: 'all 0.2s', letterSpacing: '0.3px'
              }}
            >
              {loading ? (
                <>
                  <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Đang đăng nhập...
                </>
              ) : '🔑 Đăng nhập'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ color: '#475569', fontSize: 12 }}>HOẶC</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          </div>

          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 14, margin: 0 }}>
            Chưa có tài khoản?{' '}
            <Link to="/register" style={{ color: '#f59e0b', fontWeight: 600, textDecoration: 'none' }}>
              Đăng ký miễn phí
            </Link>
          </p>
        </div>

        {/* Back to home */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link to="/" style={{ color: '#64748b', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Quay về trang chủ
          </Link>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #475569; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 30px #1e293b inset !important; -webkit-text-fill-color: #fff !important; }
      `}</style>
    </div>
  );
}

export default CustomerLogin;
