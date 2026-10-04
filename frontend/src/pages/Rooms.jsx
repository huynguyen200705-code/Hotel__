import React, { useState, useEffect } from 'react';
import { Card, Tag, Button, Spin, Empty, Select, message, Image } from 'antd';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FilterOutlined, StarFilled, CrownOutlined,
  SafetyCertificateOutlined, CheckCircleFilled, EnvironmentOutlined,
  DollarOutlined, ArrowRightOutlined, PictureOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

const statusMap = {
  Available: { color: 'success', label: '✅ Đang trống', bg: '#ecfdf5', text: '#065f46' },
  Booked: { color: 'error', label: '🔴 Đã kín', bg: '#fef2f2', text: '#991b1b' },
  Maintenance: { color: 'warning', label: '🔧 Bảo trì', bg: '#fffbeb', text: '#92400e' },
};

function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('');
  const [priceSort, setPriceSort] = useState('none');
  const [customerUser, setCustomerUser] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [capacityFilter, setCapacityFilter] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('customerUser');
    if (stored) {
      try { setCustomerUser(JSON.parse(stored)); } catch { /* ignore */ }
    }

    // Đọc query param từ URL (ví dụ: ?type=Suite hoặc ?check_in=...&check_out=...)
    const params = new URLSearchParams(location.search);
    const queryType = params.get('type');
    const queryTypeId = params.get('type_id');
    const queryCheckIn = params.get('check_in') || '';
    const queryCheckOut = params.get('check_out') || '';
    const queryGuests = params.get('guests') || '';

    setCheckIn(queryCheckIn);
    setCheckOut(queryCheckOut);
    setCapacityFilter(queryGuests);

    const fetchData = async () => {
      setLoading(true);
      try {
        const queryObj = {};
        if (queryCheckIn && queryCheckOut) {
          queryObj.check_in = queryCheckIn;
          queryObj.check_out = queryCheckOut;
        }
        if (queryGuests) {
          queryObj.capacity = queryGuests;
        }

        const [roomsRes, typesRes] = await Promise.all([
          axios.get('/api/rooms', { params: queryObj }),
          axios.get('/api/rooms/types'),
        ]);
        setRooms(roomsRes.data);
        setRoomTypes(typesRes.data);

        if (queryType) {
          setSelectedType(queryType);
        } else if (queryTypeId) {
          const matched = typesRes.data.find(t => t.id.toString() === queryTypeId);
          if (matched) setSelectedType(matched.type_name);
        }
      } catch (err) {
        console.error('Lỗi tải dữ liệu:', err);
        message.error('Không thể tải danh sách phòng!');
      }
      setLoading(false);
    };
    fetchData();
  }, [location.search]);

  const handleLogout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerUser');
    setCustomerUser(null);
  };

  const initials = customerUser?.fullName?.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() || '';

  // Lọc theo loại phòng
  let filtered = selectedType ? rooms.filter(r => r.type_name === selectedType) : [...rooms];

  // Sắp xếp theo giá
  if (priceSort === 'asc') {
    filtered.sort((a, b) => a.current_price - b.current_price);
  } else if (priceSort === 'desc') {
    filtered.sort((a, b) => b.current_price - a.current_price);
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-800">
      {/* Top utility sub-header */}
      <div className="bg-[#0a192f] text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-amber-400 font-medium">
              <CrownOutlined /> LuxeHotel Luxury Resort & Convention
            </span>
            <span className="hidden md:inline text-slate-500">|</span>
            <span className="hidden md:inline">Hotline 24/7: <b className="text-white">1900 8888</b></span>
          </div>
          <div className="flex items-center gap-5 text-slate-400">
            <span className="hover:text-amber-400 cursor-pointer transition-colors">🇻🇳 VND | VI</span>
            <span className="hover:text-amber-400 cursor-pointer transition-colors flex items-center gap-1">
              <SafetyCertificateOutlined /> Cam kết giá tốt nhất
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <header className="bg-[#0f172a] sticky top-0 z-50 border-b border-slate-800/80 shadow-lg backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 no-underline group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center text-xl shadow-md group-hover:scale-105 transition-transform">
              🏨
            </div>
            <div>
              <span className="text-2xl font-black tracking-wider text-white">LUXE<span className="text-amber-400">HOTEL</span></span>
              <span className="block text-[10px] tracking-widest uppercase text-slate-400 font-semibold -mt-1">5-Star Luxury Resort</span>
            </div>
          </Link>

          <nav className="flex items-center space-x-6">
            <Link to="/" className="text-slate-300 hover:text-amber-400 text-sm font-medium transition-colors">
              Trang chủ
            </Link>
            <Link to="/rooms" className="text-white font-semibold text-sm border-b-2 border-amber-400 pb-0.5">
              Phòng & Biệt thự
            </Link>
            <Link to="/#promos" className="text-slate-300 hover:text-amber-400 text-sm font-medium transition-colors hidden sm:inline">
              Mã giảm giá
            </Link>
            <Link to="/#services" className="text-slate-300 hover:text-amber-400 text-sm font-medium transition-colors hidden md:inline">
              Tiện ích 5 sao
            </Link>

            {customerUser ? (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-700">
                <Link
                  to={(customerUser.role === 'Admin' || customerUser.role === 'Staff') ? '/admin/dashboard' : '/my-account'}
                  className="flex items-center gap-2.5 no-underline group"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold text-xs shadow-md border-2 border-amber-300">
                    {initials}
                  </div>
                  <div className="hidden lg:block text-left leading-tight">
                    <span className="text-xs text-slate-400 block">
                      {(customerUser.role === 'Admin' || customerUser.role === 'Staff') ? 'Quản trị viên' : 'Tài khoản'}
                    </span>
                    <span className="text-sm text-white font-semibold group-hover:text-amber-400 transition-colors">
                      {customerUser.fullName}
                    </span>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-xs text-slate-400 hover:text-red-400 px-2.5 py-1.5 rounded-lg border border-slate-700 hover:border-red-400/50 bg-slate-800/60 transition-all cursor-pointer"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 pl-3 border-l border-slate-700">
                <Link to="/login">
                  <Button
                    className="border-slate-600 text-white hover:text-amber-400 hover:border-amber-400 bg-transparent rounded-xl text-xs font-semibold h-9 px-4 transition-all"
                  >
                    Đăng nhập
                  </Button>
                </Link>
                <Link to="/register">
                  <Button
                    type="primary"
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold border-none rounded-xl text-xs h-9 px-5 shadow-lg shadow-amber-500/20"
                  >
                    Đăng ký
                  </Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Luxury Hero Banner */}
      <div className="relative bg-[#0b1329] py-14 overflow-hidden border-b border-slate-800">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-luminosity"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=2000&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a]/90 via-[#0b1329]/95 to-[#0b1329]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-widest mb-3 backdrop-blur-sm">
            <span>👑 DANH SÁCH PHÒNG & BIỆT THỰ NGHỈ DƯỠNG</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
            Chọn không gian lưu trú thượng hạng
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto font-light">
            Tận hưởng phòng ốc chuẩn 5 sao với tầm nhìn hướng biển tuyệt đẹp, ban công riêng và nội thất cao cấp bậc nhất.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Luxury Filter Bar (Đồng bộ phong cách Traveloka VIP) */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Left: Category tabs */}
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">
              <FilterOutlined className="text-amber-500" /> Hạng phòng:
            </div>
            <button
              onClick={() => setSelectedType('')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedType === ''
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả ({rooms.length})
            </button>
            {roomTypes.map(t => {
              const count = rooms.filter(r => r.room_type_id === t.id).length;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedType(t.type_name)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    selectedType === t.type_name
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.type_name} ({count})
                </button>
              );
            })}
          </div>

          {/* Right: Sort dropdown */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <span className="text-xs text-slate-500 whitespace-nowrap">Sắp xếp:</span>
            <Select
              value={priceSort}
              onChange={setPriceSort}
              style={{ width: 170 }}
              className="rounded-xl"
            >
              <Option value="none">Mặc định</Option>
              <Option value="asc">Giá: Thấp đến Cao</Option>
              <Option value="desc">Giá: Cao đến Thấp</Option>
            </Select>
          </div>
        </div>

        {/* Room List Grid */}
        {loading ? (
          <div className="flex flex-col justify-center items-center h-80">
            <Spin size="large" />
            <p className="mt-4 text-slate-500 text-sm">Đang tải danh sách phòng nghỉ cao cấp...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-sm">
            <Empty description="Không có phòng nào phù hợp với bộ lọc hiện tại" />
            <Button
              className="mt-4 rounded-xl font-semibold text-xs"
              onClick={() => setSelectedType('')}
            >
              Xem tất cả các phòng
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(room => {
              const st = statusMap[room.status] || { color: 'default', label: room.status, bg: '#f3f4f6', text: '#374151' };
              const isAvailable = room.status === 'Available';

              return (
                <div
                  key={room.id}
                  className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl border border-slate-200/70 hover:border-amber-400/40 transition-all duration-300 group flex flex-col justify-between"
                >
                  <div>
                    {/* Room Image with Gallery and Badge */}
                    <div className="relative h-52 bg-slate-100 overflow-hidden group/img">
                      {room.images && room.images.length > 0 ? (
                        <Image.PreviewGroup>
                          <div className="w-full h-full relative cursor-pointer">
                            <Image
                              src={room.images[0]}
                              alt={`Phòng ${room.room_number}`}
                              className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                              wrapperStyle={{ width: '100%', height: '100%' }}
                              fallback="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%' viewBox='0 0 200 150'><rect width='100%' height='100%' fill='%23f1f5f9'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='14' fill='%2394a3b8'>No Image</text></svg>"
                            />
                            {/* Danh sách các ảnh ẩn để Lightbox duyệt qua hết */}
                            {room.images.slice(1).map((imgUrl, i) => (
                              <div key={i} style={{ display: 'none' }}>
                                <Image src={imgUrl} />
                              </div>
                            ))}
                          </div>
                        </Image.PreviewGroup>
                      ) : room.image_url ? (
                        <Image
                          src={room.image_url}
                          alt={`Phòng ${room.room_number}`}
                          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 cursor-pointer"
                          wrapperStyle={{ width: '100%', height: '100%' }}
                          fallback="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%' viewBox='0 0 200 150'><rect width='100%' height='100%' fill='%23f1f5f9'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='14' fill='%2394a3b8'>No Image</text></svg>"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-slate-900 to-indigo-950 flex flex-col items-center justify-center text-5xl">
                          {room.type_name === 'Thượng hạng' || room.type_name === 'Suite' ? '👑' : room.type_name === 'Sang trọng' || room.type_name === 'Deluxe' ? '✨' : '🏨'}
                        </div>
                      )}

                      {/* Room Type Tag */}
                      <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-md text-amber-400 px-3 py-1 rounded-full text-xs font-bold shadow-md pointer-events-none z-10">
                        {room.type_name}
                      </div>

                      {/* Status Tag */}
                      <div
                        className="absolute top-3 right-3 backdrop-blur-md px-2.5 py-1 rounded-xl text-xs font-bold shadow-md pointer-events-none z-10"
                        style={{ backgroundColor: st.bg, color: st.text }}
                      >
                        {st.label}
                      </div>

                      {/* Multi-image count Badge */}
                      {room.images && room.images.length > 1 && (
                        <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md pointer-events-none z-10">
                          <PictureOutlined /> {room.images.length} ảnh (bấm để xem)
                        </div>
                      )}

                      {/* Rating Star */}
                      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md text-slate-800 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm pointer-events-none z-10">
                        <StarFilled className="text-amber-500" /> 5.0 (48+ đánh giá)
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-amber-600 transition-colors">
                            Phòng {room.room_number}
                          </h3>
                          <p className="text-xs text-slate-400 font-medium">
                            {room.type_name} · Tối đa {room.capacity} khách
                          </p>
                        </div>
                      </div>

                      {/* Amenities checklist snippet */}
                      <div className="space-y-1.5 my-3 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <CheckCircleFilled className="text-emerald-500 text-xs" /> Ban công view trọn cảnh biển
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircleFilled className="text-emerald-500 text-xs" /> Miễn phí bữa sáng buffet 5 sao
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircleFilled className="text-emerald-500 text-xs" /> Wifi tốc độ cao & Smart TV 65"
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: Price & CTA */}
                  <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Giá 1 đêm từ</span>
                      <span className="text-lg font-black text-amber-600">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(room.current_price)}
                      </span>
                    </div>

                    <Button
                      type="primary"
                      disabled={!isAvailable}
                      onClick={() => {
                        const q = new URLSearchParams();
                        q.set('room_id', room.id);
                        if (checkIn) q.set('check_in', checkIn);
                        if (checkOut) q.set('check_out', checkOut);
                        navigate(`/checkout?${q.toString()}`);
                      }}
                      className={`h-10 px-5 rounded-xl font-bold text-xs shadow-md ${
                        isAvailable
                          ? 'bg-slate-900 hover:bg-amber-600 border-none text-white'
                          : 'bg-slate-200 text-slate-400 border-none'
                      }`}
                    >
                      {isAvailable ? 'Đặt phòng' : 'Hết phòng'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-[#0a101d] text-slate-400 pt-16 pb-12 border-t border-slate-800 text-sm mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-1">
              <div className="text-2xl font-black text-white mb-3">
                LUXE<span className="text-amber-400">HOTEL</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Hệ thống khách sạn & khu nghỉ dưỡng chuẩn 5 sao quốc tế, mang lại không gian thư giãn đỉnh cao cho từng hành trình.
              </p>
              <div className="text-xs text-slate-500">
                © 2026 LuxeHotel Resort. All rights reserved.
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-wider">Về chúng tôi</h4>
              <ul className="space-y-2 text-xs">
                <li><Link to="/" className="hover:text-amber-400 transition-colors">Giới thiệu LuxeHotel</Link></li>
                <li><Link to="/rooms" className="hover:text-amber-400 transition-colors">Hệ thống phòng & Biệt thự</Link></li>
                <li><Link to="/#services" className="hover:text-amber-400 transition-colors">Dịch vụ & Tiện ích</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-wider">Hỗ trợ khách hàng</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#" className="hover:text-amber-400 transition-colors">Trung tâm trợ giúp 24/7</a></li>
                <li><a href="#" className="hover:text-amber-400 transition-colors">Chính sách đặt & hủy phòng</a></li>
                <li><a href="#" className="hover:text-amber-400 transition-colors">Quy định hội viên VIP</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-wider">Liên hệ trực tiếp</h4>
              <p className="text-xs text-slate-400 mb-2">📍 Võ Nguyên Giáp, Sơn Trà, Đà Nẵng, Việt Nam</p>
              <p className="text-xs text-slate-400 mb-2">📞 Hotline: 1900 8888 / 028 3822 9999</p>
              <p className="text-xs text-slate-400 mb-4">✉️ reservation@luxehotel.vn</p>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex justify-between items-center flex-wrap gap-4 text-xs text-slate-500">
            <div>
              Được bảo chứng chất lượng bởi hiệp hội khách sạn quốc tế 5 sao.
            </div>
            {!customerUser && (
              <div>
                <Link to="/admin/login" className="text-slate-600 hover:text-slate-400 transition-colors">
                  Cổng Đăng nhập Quản trị viên (Admin/Staff)
                </Link>
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Rooms;
