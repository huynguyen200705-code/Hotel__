import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const TIER_CONFIG = {
  'Thường':    { color: '#64748b', bg: 'rgba(100,116,139,0.15)', icon: '⭐', label: 'Thành viên Thường' },
  'Bạc':       { color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', icon: '🥈', label: 'Thành viên Bạc' },
  'Vàng':      { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  icon: '🥇', label: 'Thành viên Vàng' },
  'Kim Cương': { color: '#67e8f9', bg: 'rgba(103,232,249,0.15)', icon: '💎', label: 'Kim Cương' },
};

function CustomerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    const storedUser = localStorage.getItem('customerUser');
    if (!token || !storedUser) {
      navigate('/login');
      return;
    }
    try {
      const u = JSON.parse(storedUser);
      if (u.role === 'Admin' || u.role === 'Staff') {
        navigate('/admin/dashboard', { replace: true });
        return;
      }
      setUser(u);
      fetchBookings(token);
    } catch (err) {
      localStorage.removeItem('customerToken');
      localStorage.removeItem('customerUser');
      navigate('/login');
    }
  }, [navigate]);

  const fetchBookings = async (token) => {
    setLoadingBookings(true);
    try {
      const res = await axios.get('/api/bookings/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(res.data || []);
    } catch {
      setBookings([]);
    }
    setLoadingBookings(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerUser');
    navigate('/');
  };

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editMsg, setEditMsg] = useState({ type: '', text: '' });

  const openEditModal = () => {
    setEditForm({
      fullName: user?.fullName || '',
      phone: user?.phone || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setEditMsg({ type: '', text: '' });
    setIsEditModalOpen(true);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setEditMsg({ type: '', text: '' });

    if (!editForm.fullName.trim()) {
      setEditMsg({ type: 'error', text: 'Họ và tên không được để trống!' });
      return;
    }

    if (editForm.newPassword) {
      if (!editForm.currentPassword) {
        setEditMsg({ type: 'error', text: 'Vui lòng nhập mật khẩu hiện tại để xác nhận đổi mật khẩu.' });
        return;
      }
      if (editForm.newPassword.length < 6) {
        setEditMsg({ type: 'error', text: 'Mật khẩu mới phải có từ 6 ký tự trở lên.' });
        return;
      }
      if (editForm.newPassword !== editForm.confirmPassword) {
        setEditMsg({ type: 'error', text: 'Mật khẩu xác nhận không khớp.' });
        return;
      }
    }

    setEditLoading(true);
    try {
      const token = localStorage.getItem('customerToken');
      const res = await axios.put('/api/auth/customer/profile', {
        fullName: editForm.fullName,
        phone: editForm.phone,
        currentPassword: editForm.currentPassword || undefined,
        newPassword: editForm.newPassword || undefined
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const updatedUser = {
        ...user,
        ...res.data.user
      };
      setUser(updatedUser);
      localStorage.setItem('customerUser', JSON.stringify(updatedUser));

      setEditMsg({ type: 'success', text: res.data.message || 'Cập nhật thành công!' });
      setTimeout(() => {
        setIsEditModalOpen(false);
      }, 1200);
    } catch (err) {
      setEditMsg({
        type: 'error',
        text: err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật. Vui lòng thử lại!'
      });
    }
    setEditLoading(false);
  };

  if (!user) return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 16
    }}>
      <div style={{
        width: 48, height: 48, border: '3px solid rgba(245,158,11,0.3)',
        borderTopColor: '#f59e0b', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <p style={{ color: '#64748b', fontSize: 14 }}>Đang tải thông tin...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const tierConf = TIER_CONFIG[profile?.membership_tier] || TIER_CONFIG['Thường'];
  const initials = user.fullName?.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() || 'K';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)',
      fontFamily: "'Inter', 'Segoe UI', sans-serif", color: '#fff'
    }}>
      {/* Header */}
      <header style={{
        background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        position: 'sticky', top: 0, zIndex: 50, padding: '0 24px'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
            }}>🏨</div>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>LuxeHotel</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link to="/rooms" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
              Đặt phòng
            </Link>
            <button onClick={handleLogout} style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 10, color: '#f87171', fontSize: 13, fontWeight: 500,
              padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
            }}>
              🚪 Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        {/* Profile Hero */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(239,68,68,0.08) 100%)',
          border: '1px solid rgba(245,158,11,0.2)', borderRadius: 24,
          padding: '32px 36px', marginBottom: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 700, color: '#fff',
              boxShadow: '0 8px 24px rgba(245,158,11,0.35)', flexShrink: 0
            }}>
              {initials}
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{user.fullName}</h1>
              <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: 14 }}>{user.email}</p>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: tierConf.bg, borderRadius: 20, padding: '4px 12px', marginTop: 8
              }}>
                <span>{tierConf.icon}</span>
                <span style={{ color: tierConf.color, fontSize: 12, fontWeight: 600 }}>{tierConf.label}</span>
              </div>
            </div>
          </div>

          {profile && (
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#f59e0b' }}>{profile.points?.toLocaleString() || 0}</div>
                <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>Điểm tích luỹ</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#67e8f9' }}>{bookings.length}</div>
                <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>Lần đặt phòng</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#a78bfa' }}>
                  {(profile.total_spent / 1_000_000).toFixed(1)}M
                </div>
                <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>Tổng chi tiêu</div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 4, width: 'fit-content' }}>
          {[
            { key: 'overview', label: '🏠 Tổng quan' },
            { key: 'bookings', label: '📅 Lịch đặt phòng' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
              background: activeTab === tab.key ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'transparent',
              color: activeTab === tab.key ? '#fff' : '#94a3b8',
              transition: 'all 0.2s'
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {/* Quick actions */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24 }}>
              <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>⚡ Thao tác nhanh</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Link to="/rooms" style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                  background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(239,68,68,0.08))',
                  border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, textDecoration: 'none', color: '#fff'
                }}>
                  <span style={{ fontSize: 20 }}>🛏️</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Đặt phòng ngay</div>
                    <div style={{ color: '#64748b', fontSize: 12 }}>Xem phòng trống & giá</div>
                  </div>
                </Link>
                <button onClick={() => setActiveTab('bookings')} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12, cursor: 'pointer', color: '#fff', width: '100%', textAlign: 'left'
                }}>
                  <span style={{ fontSize: 20 }}>📋</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Xem đặt phòng</div>
                    <div style={{ color: '#64748b', fontSize: 12 }}>Lịch sử & trạng thái</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Membership info */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>🎖️ Hạng thành viên của bạn</h3>
                <span style={{
                  background: tierConf.bg,
                  color: tierConf.color,
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 20,
                  border: `1px solid ${tierConf.color}40`
                }}>
                  {tierConf.icon} {user.membership_tier || profile?.membership_tier || 'Thường'}
                </span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: 12, margin: '0 0 14px' }}>
                Mỗi khách hàng chỉ sở hữu <strong>1 hạng duy nhất</strong>. Dưới đây là các mốc nâng hạng và quyền lợi:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Object.entries(TIER_CONFIG).map(([tier, conf]) => {
                  const currentTier = user.membership_tier || profile?.membership_tier || 'Thường';
                  const isCurrent = currentTier === tier;
                  return (
                    <div key={tier} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', borderRadius: 10,
                      background: isCurrent ? conf.bg : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isCurrent ? conf.color : 'rgba(255,255,255,0.05)'}`,
                      opacity: isCurrent ? 1 : 0.65
                    }}>
                      <span style={{ color: conf.color, fontSize: 13, fontWeight: isCurrent ? 600 : 400 }}>
                        {conf.icon} {tier}
                      </span>
                      {isCurrent ? (
                        <span style={{ background: conf.color, color: '#000', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                          ĐANG SỞ HỮU
                        </span>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: 11 }}>
                          {tier === 'Thường' ? 'Mặc định' : tier === 'Bạc' ? 'Từ 5 triệu' : tier === 'Vàng' ? 'Từ 15 triệu' : 'Từ 30 triệu'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Thông tin tài khoản */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>👤 Thông tin tài khoản</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
                {[
                  { label: 'Họ tên', value: user.fullName, icon: '📝' },
                  { label: 'Email', value: user.email, icon: '📧' },
                  { label: 'Số điện thoại', value: user.phone || 'Chưa cập nhật', icon: '📱' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{item.icon}</span>
                    <div>
                      <div style={{ color: '#64748b', fontSize: 11, fontWeight: 500 }}>{item.label}</div>
                      <div style={{ color: '#e2e8f0', fontSize: 14, marginTop: 2 }}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Nút sửa thông tin đặt ở dưới cùng */}
              <button
                onClick={openEditModal}
                style={{
                  width: '100%',
                  marginTop: 'auto',
                  padding: '11px 16px',
                  background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(239,68,68,0.12))',
                  border: '1px solid rgba(245,158,11,0.25)',
                  borderRadius: 12,
                  color: '#fbbf24',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245,158,11,0.22), rgba(239,68,68,0.22))';
                  e.currentTarget.style.borderColor = 'rgba(245,158,11,0.45)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(239,68,68,0.12))';
                  e.currentTarget.style.borderColor = 'rgba(245,158,11,0.25)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                ✏️ Sửa thông tin tài khoản
              </button>
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div>
            {loadingBookings ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
                <p>Đang tải lịch đặt phòng...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: 60,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20
              }}>
                <div style={{ fontSize: 60, marginBottom: 16 }}>🛏️</div>
                <h3 style={{ color: '#94a3b8', margin: '0 0 12px', fontWeight: 500 }}>Chưa có đặt phòng nào</h3>
                <p style={{ color: '#475569', fontSize: 14, marginBottom: 24 }}>Hãy đặt phòng đầu tiên của bạn!</p>
                <Link to="/rooms" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '12px 28px', background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                  borderRadius: 12, color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 14
                }}>
                  🛏️ Xem phòng ngay
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {bookings.map(booking => (
                  <div key={booking.id} style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 16, padding: '20px 24px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          background: 'rgba(245, 158, 11, 0.12)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          padding: '3px 10px',
                          borderRadius: 8,
                          color: '#fbbf24',
                          fontWeight: 700,
                          fontSize: 13,
                          letterSpacing: '0.5px'
                        }}>
                          🏷️ Mã đơn: <span style={{ color: '#fef08a' }}>{booking.booking_code}</span>
                        </span>
                      </div>
                      <div style={{ color: '#e2e8f0', fontSize: 15, fontWeight: 600, marginTop: 8 }}>
                        Phòng {booking.room_number} — {booking.type_name}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>📅 Thời gian:</span>
                        <span style={{ color: '#cbd5e1' }}>
                          {new Date(booking.check_in_date).toLocaleDateString('vi-VN')} → {new Date(booking.check_out_date).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>
                        {booking.total_amount?.toLocaleString('vi-VN')}đ
                      </div>
                      <div style={{
                        display: 'inline-block', marginTop: 8, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        ...(booking.booking_status === 'Confirmed' ? { background: 'rgba(59,130,246,0.15)', color: '#93c5fd' } :
                           booking.booking_status === 'CheckedIn'  ? { background: 'rgba(34,197,94,0.15)', color: '#86efac' } :
                           booking.booking_status === 'CheckedOut' ? { background: 'rgba(100,116,139,0.15)', color: '#94a3b8' } :
                           { background: 'rgba(239,68,68,0.15)', color: '#fca5a5' })
                      }}>
                        {booking.booking_status === 'Confirmed' ? '✓ Đã xác nhận' :
                         booking.booking_status === 'CheckedIn'  ? '🏠 Đang ở' :
                         booking.booking_status === 'CheckedOut' ? '✅ Đã trả phòng' : '✗ Đã huỷ'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Chỉnh sửa thông tin & Đổi mật khẩu */}
      {isEditModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 16
        }}>
          <div style={{
            background: '#1e293b',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20,
            width: '100%',
            maxWidth: 480,
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px 32px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fff' }}>
                ✏️ Cập nhật thông tin cá nhân
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                style={{
                  background: 'none', border: 'none', color: '#94a3b8',
                  fontSize: 20, cursor: 'pointer', padding: 4
                }}
              >
                ✕
              </button>
            </div>

            {editMsg.text && (
              <div style={{
                padding: '10px 14px',
                borderRadius: 10,
                fontSize: 13,
                marginBottom: 16,
                background: editMsg.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                color: editMsg.type === 'error' ? '#fca5a5' : '#86efac',
                border: `1px solid ${editMsg.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`
              }}>
                {editMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdateProfile}>
              {/* Họ và tên */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#cbd5e1', marginBottom: 6 }}>
                  Họ và tên *
                </label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
                  required
                  placeholder="Nhập họ và tên..."
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Email (Readonly) */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#cbd5e1', marginBottom: 6 }}>
                  Email (Không thể thay đổi)
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                    color: '#64748b', fontSize: 14, cursor: 'not-allowed', boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Số điện thoại */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#cbd5e1', marginBottom: 6 }}>
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="Nhập số điện thoại..."
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Đổi mật khẩu section */}
              <div style={{
                borderTop: '1px solid rgba(255,255,255,0.1)',
                paddingTop: 16,
                marginBottom: 20
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                  <span style={{ fontSize: 16 }}>🔒</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#fbbf24' }}>
                    Đổi mật khẩu (Bỏ trống nếu không muốn đổi)
                  </span>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                    Mật khẩu hiện tại
                  </label>
                  <input
                    type="password"
                    value={editForm.currentPassword}
                    onChange={e => setEditForm({ ...editForm, currentPassword: e.target.value })}
                    placeholder="Nhập mật khẩu đang dùng..."
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                      Mật khẩu mới
                    </label>
                    <input
                      type="password"
                      value={editForm.newPassword}
                      onChange={e => setEditForm({ ...editForm, newPassword: e.target.value })}
                      placeholder="Mật khẩu mới (>= 6 ký tự)..."
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 10,
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                      Xác nhận mật khẩu mới
                    </label>
                    <input
                      type="password"
                      value={editForm.confirmPassword}
                      onChange={e => setEditForm({ ...editForm, confirmPassword: e.target.value })}
                      placeholder="Nhập lại mật khẩu..."
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 10,
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={editLoading}
                  style={{
                    padding: '10px 20px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.08)', border: 'none',
                    color: '#94a3b8', fontSize: 13, fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  style={{
                    padding: '10px 24px', borderRadius: 10,
                    background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                    border: 'none', color: '#fff', fontSize: 13, fontWeight: 600,
                    cursor: editLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(245,158,11,0.3)',
                    opacity: editLoading ? 0.7 : 1
                  }}
                >
                  {editLoading ? 'Đang lưu...' : '💾 Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');`}</style>
    </div>
  );
}

export default CustomerDashboard;
