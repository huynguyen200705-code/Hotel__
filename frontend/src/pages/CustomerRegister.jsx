import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function CustomerRegister() {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const validate = () => {
    if (!form.full_name.trim()) return 'Vui lòng nhập họ tên.';
    if (!form.email.trim()) return 'Vui lòng nhập email.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Email không hợp lệ.';
    if (form.password.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự.';
    if (form.password !== form.confirmPassword) return 'Mật khẩu xác nhận không khớp.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validErr = validate();
    if (validErr) { setError(validErr); return; }

    setLoading(true);
    try {
      const res = await axios.post('/api/auth/customer/register', {
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        phone: form.phone
      });
      // Xóa phiên đăng nhập admin cũ (nếu có)
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.setItem('customerToken', res.data.token);
      localStorage.setItem('customerUser', JSON.stringify(res.data.user));
      setSuccess('Đăng ký thành công! Đang chuyển hướng...');
      setTimeout(() => navigate('/my-account'), 1200);
    } catch (err) {
      if (!err.response) {
        setError('Không thể kết nối server. Vui lòng kiểm tra backend đã chạy chưa.');
      } else {
        setError(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
      }
    }
    setLoading(false);
  };

  const inputStyle = {
    width: '100%', height: 48,
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, color: '#fff', fontSize: 14, outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.2s', paddingLeft: 42, paddingRight: 16
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0c1a2e 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      position: 'relative', overflow: 'hidden', padding: '40px 0'
    }}>
      {/* Decorative orbs */}
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)', top: -120, right: -100, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', bottom: -60, left: -60, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: 480, padding: '0 20px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 72, height: 72, borderRadius: 20,
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            fontSize: 32, marginBottom: 14, boxShadow: '0 8px 32px rgba(245,158,11,0.3)'
          }}>🏨</div>
          <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 700, margin: 0 }}>LuxeHotel</h1>
          <p style={{ color: '#94a3b8', marginTop: 6, fontSize: 14 }}>Tạo tài khoản để đặt phòng và tích điểm thành viên</p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24,
          padding: '36px 32px', boxShadow: '0 24px 64px rgba(0,0,0,0.4)'
        }}>
          <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 600, margin: '0 0 24px', textAlign: 'center' }}>
            Đăng ký tài khoản mới
          </h2>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 12, padding: '12px 16px', marginBottom: 20,
              color: '#fca5a5', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8
            }}>
              <span>⚠️</span> <span>{error}</span>
            </div>
          )}

          {success && (
            <div style={{
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: 12, padding: '12px 16px', marginBottom: 20,
              color: '#86efac', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8
            }}>
              <span>✅</span> <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
                Họ và tên <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>👤</span>
                <input
                  id="reg-fullname"
                  type="text" name="full_name" placeholder="Nguyễn Văn A"
                  value={form.full_name} onChange={handleChange}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
                Email <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>📧</span>
                <input
                  id="reg-email"
                  type="email" name="email" placeholder="email@example.com"
                  value={form.email} onChange={handleChange}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
            </div>

            {/* Phone */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
                Số điện thoại <span style={{ color: '#64748b', fontWeight: 400 }}>(tuỳ chọn)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>📱</span>
                <input
                  id="reg-phone"
                  type="tel" name="phone" placeholder="0901234567"
                  value={form.phone} onChange={handleChange}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
                Mật khẩu <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔒</span>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'} name="password" placeholder="Ít nhất 6 ký tự"
                  value={form.password} onChange={handleChange}
                  style={{ ...inputStyle, paddingRight: 48 }}
                  onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 0 }}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
                Xác nhận mật khẩu <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔐</span>
                <input
                  id="reg-confirm-password"
                  type={showPassword ? 'text' : 'password'} name="confirmPassword" placeholder="Nhập lại mật khẩu"
                  value={form.confirmPassword} onChange={handleChange}
                  style={{
                    ...inputStyle,
                    borderColor: form.confirmPassword && form.confirmPassword !== form.password
                      ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.5)'}
                  onBlur={e => {
                    e.target.style.borderColor = form.confirmPassword && form.confirmPassword !== form.password
                      ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)';
                  }}
                />
              </div>
              {form.confirmPassword && form.confirmPassword !== form.password && (
                <p style={{ color: '#f87171', fontSize: 12, marginTop: 6, marginBottom: 0 }}>
                  Mật khẩu không khớp
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              id="customer-register-btn"
              type="submit" disabled={loading}
              style={{
                width: '100%', height: 50, borderRadius: 12, border: 'none',
                background: loading ? 'rgba(245,158,11,0.5)' : 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                color: '#fff', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: loading ? 'none' : '0 4px 20px rgba(245,158,11,0.4)',
                transition: 'all 0.2s'
              }}
            >
              {loading ? (
                <>
                  <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  <span>Đang tạo tài khoản...</span>
                </>
              ) : (
                <span>🎉 Tạo tài khoản</span>
              )}
            </button>
          </form>

          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 14, margin: '24px 0 0' }}>
            Đã có tài khoản?{' '}
            <Link to="/login" style={{ color: '#f59e0b', fontWeight: 600, textDecoration: 'none' }}>
              Đăng nhập
            </Link>
          </p>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link to="/" style={{ color: '#64748b', fontSize: 13, textDecoration: 'none' }}>
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

export default CustomerRegister;
