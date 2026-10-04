import React, { useState, useEffect } from 'react';
import { Button, DatePicker, Select, Tag, Tooltip, message, Modal, Image } from 'antd';
import {
  SearchOutlined, CalendarOutlined, UserOutlined,
  CompassOutlined, EnvironmentOutlined, CheckCircleFilled,
  GiftOutlined, CopyOutlined, StarFilled, ArrowRightOutlined,
  SafetyCertificateOutlined, CustomerServiceOutlined, CrownOutlined,
  CarOutlined, PhoneOutlined, ClockCircleOutlined, CheckOutlined, PictureOutlined
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const { RangePicker } = DatePicker;
const { Option } = Select;

// Danh mục dịch vụ thanh ngang phong cách Traveloka
const SERVICES = [
  { id: 'hotel', name: 'Đặt phòng', icon: '🏨', desc: 'Chọn phòng nghỉ & Biệt thự' },
  { id: 'restaurant', name: 'Nhà hàng & Bar', icon: '🍽️', desc: 'Bữa sáng buffet, ẩm thực Michelin & Cocktail Bar' },
  { id: 'spa', name: 'Spa & Trị liệu', icon: '💆', desc: 'Xông hơi đá muối, massage phục hồi & chăm sóc da' },
  { id: 'airport', name: 'Đưa đón sân bay', icon: '🚘', desc: 'Xe sang Mercedes & Limousine đón tận nơi 24/7' },
  { id: 'events', name: 'Hội nghị & Tiệc', icon: '🥂', desc: 'Grand Ballroom sức chứa 1,000 khách, âm thanh ánh sáng hiện đại' },
  { id: 'suite', name: 'Phòng VIP Suite', icon: '👑', desc: 'Dịch vụ quản gia riêng, lounge đặc quyền & view biển tuyệt tác' },
];

const PROMO_CODES = [
  {
    code: 'LUXEWELCOME',
    title: 'Giảm 15% cho đặt phòng lần đầu',
    desc: 'Áp dụng cho khách hàng mới đăng ký tài khoản LuxeHotel',
    tag: 'Thành viên mới',
    discount: '15%'
  },
  {
    code: 'WEEKENDLUX',
    title: 'Tặng Voucher 300.000₫ Ẩm thực',
    desc: 'Áp dụng cho đặt phòng từ 2 đêm cuối tuần (T6 - CN)',
    tag: 'Cuối tuần',
    discount: '300k'
  },
  {
    code: 'VIELUXURY2026',
    title: 'Ưu đãi Suite & Deluxe lên đến 25%',
    desc: 'Dành riêng cho các hạng phòng cao cấp và khách thân thiết',
    tag: 'Hạng VIP',
    discount: '25%'
  },
];

function Home() {
  const [customerUser, setCustomerUser] = useState(null);
  const [activeTab, setActiveTab] = useState('hotel');
  const [selectedService, setSelectedService] = useState(null);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [roomType, setRoomType] = useState('');
  const [featuredRooms, setFeaturedRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [guests, setGuests] = useState('2');
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('customerUser');
    if (stored) {
      try { setCustomerUser(JSON.parse(stored)); } catch { /* ignore */ }
    }

    const fetchRooms = async () => {
      try {
        const [roomsRes, typesRes] = await Promise.all([
          axios.get('/api/rooms'),
          axios.get('/api/rooms/types'),
        ]);
        setFeaturedRooms(roomsRes.data.slice(0, 4));
        setRoomTypes(typesRes.data);
      } catch (err) {
        console.error('Lỗi tải phòng:', err);
      }
    };
    fetchRooms();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerUser');
    setCustomerUser(null);
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    message.success(`Đã sao chép mã ưu đãi: ${code}`);
  };

  // Xử lý khi click vào từng tab dịch vụ
  const handleServiceClick = (service) => {
    setActiveTab(service.id);

    if (service.id === 'hotel') {
      // Tab Đặt phòng: chuyển hướng đến trang phòng
      navigate('/rooms');
    } else if (service.id === 'suite') {
      // Tab Gói VIP Suite: chuyển sang trang phòng có lọc sẵn Suite
      navigate('/rooms?type=Suite');
    } else if (service.id === 'restaurant') {
      const el = document.getElementById('amenity-restaurant');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (service.id === 'spa') {
      const el = document.getElementById('amenity-spa');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      // Các dịch vụ khác (Đưa đón sân bay, Hội nghị & Tiệc): Mở Modal đặt dịch vụ / tư vấn chuyên nghiệp
      setSelectedService(service);
      setServiceModalOpen(true);
    }
  };

  const [selectedDates, setSelectedDates] = useState(null);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (roomType) params.set('type_id', roomType);
    if (guests) params.set('guests', guests);
    if (selectedDates && selectedDates[0] && selectedDates[1]) {
      params.set('check_in', selectedDates[0].format('YYYY-MM-DD'));
      params.set('check_out', selectedDates[1].format('YYYY-MM-DD'));
    }
    const query = params.toString();
    navigate(query ? `/rooms?${query}` : '/rooms');
  };

  const initials = customerUser?.fullName?.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() || '';

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
            <Link to="/" className="text-white hover:text-amber-400 text-sm font-medium transition-colors">
              Trang chủ
            </Link>
            <Link to="/rooms" className="text-slate-300 hover:text-amber-400 text-sm font-medium transition-colors">
              Phòng & Biệt thự
            </Link>
            <a href="#promos" className="text-slate-300 hover:text-amber-400 text-sm font-medium transition-colors hidden sm:inline">
              Mã giảm giá
            </a>
            <a href="#services" className="text-slate-300 hover:text-amber-400 text-sm font-medium transition-colors hidden md:inline">
              Tiện ích 5 sao
            </a>

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

      {/* Hero Showcase Section - Phong cách Traveloka Resort siêu sang */}
      <div className="relative bg-[#0b1329] pt-8 pb-32 overflow-hidden">
        {/* Background Overlay Image with High-end gradient */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity scale-105 transform hover:scale-100 transition-all duration-1000"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2000&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a]/80 via-[#0b1329]/90 to-[#0b1329]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 text-center">
          {/* Tagline */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-widest mb-4 backdrop-blur-sm">
            <span>✨ KHÔNG GIAN NGHỈ DƯỠNG HOÀN MỸ</span>
          </div>
          
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight mb-4 leading-tight">
            Kỳ nghỉ thượng lưu – <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent">Trải nghiệm vượt trội</span>
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto mb-8 font-light">
            Khám phá thiên đường nghỉ dưỡng 5 sao cùng chuỗi dịch vụ cá nhân hóa chuẩn quốc tế.
          </p>

          {/* Traveloka-style Services Menu Tabs with Next/Prev Arrow & Mouse Drag */}
          <div className="relative max-w-5xl mx-auto mb-6 px-10 group/slider">
            {/* Nút lướt sang trái */}
            <button
              onClick={() => {
                const el = document.getElementById('services-scroll-container');
                if (el) el.scrollBy({ left: -220, behavior: 'smooth' });
              }}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-900/80 hover:bg-amber-500 text-white hover:text-slate-950 flex items-center justify-center shadow-lg border border-slate-700 transition-all cursor-pointer"
              title="Cuộn sang trái"
            >
              ❮
            </button>

            {/* Container danh sách cuộn */}
            <div
              id="services-scroll-container"
              className="flex items-center gap-2.5 sm:gap-3.5 overflow-x-auto py-1 scroll-smooth select-none cursor-grab active:cursor-grabbing"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
              onMouseDown={(e) => {
                const slider = e.currentTarget;
                slider.isDown = true;
                slider.startX = e.pageX - slider.offsetLeft;
                slider.scrollLeftStart = slider.scrollLeft;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.isDown = false;
              }}
              onMouseUp={(e) => {
                e.currentTarget.isDown = false;
              }}
              onMouseMove={(e) => {
                const slider = e.currentTarget;
                if (!slider.isDown) return;
                e.preventDefault();
                const x = e.pageX - slider.offsetLeft;
                const walk = (x - slider.startX) * 1.5;
                slider.scrollLeft = slider.scrollLeftStart - walk;
              }}
            >
              {SERVICES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleServiceClick(s)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer shadow-sm ${
                    activeTab === s.id
                      ? 'bg-white text-slate-900 shadow-xl scale-105 ring-2 ring-amber-400'
                      : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 hover:border-amber-400/50'
                  }`}
                >
                  <span className="text-lg">{s.icon}</span>
                  <span>{s.name}</span>
                </button>
              ))}
            </div>

            {/* Nút lướt sang phải */}
            <button
              onClick={() => {
                const el = document.getElementById('services-scroll-container');
                if (el) el.scrollBy({ left: 220, behavior: 'smooth' });
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-900/80 hover:bg-amber-500 text-white hover:text-slate-950 flex items-center justify-center shadow-lg border border-slate-700 transition-all cursor-pointer"
              title="Cuộn sang phải"
            >
              ❯
            </button>
          </div>

          {/* Traveloka Luxury Search Bar Component */}
          <div className="bg-white/95 backdrop-blur-xl p-4 sm:p-6 rounded-3xl shadow-2xl border border-white/50 max-w-6xl mx-auto text-left transition-all">
            {/* Filter chips inside search box */}
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 flex-wrap">
              <button
                onClick={() => setRoomType('')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  roomType === '' ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả hạng phòng
              </button>
              {roomTypes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setRoomType(t.id.toString())}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    roomType === t.id.toString() ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.type_name} ({t.capacity} khách)
                </button>
              ))}
            </div>

            {/* Main Search Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-stretch">
              {/* Field 1: Destination / Resort name */}
              <div className="md:col-span-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 rounded-2xl p-3.5 flex items-center gap-3.5 transition-colors cursor-pointer">
                <div className="w-11 h-11 rounded-xl bg-amber-100/80 text-amber-600 flex items-center justify-center text-xl shrink-0">
                  <EnvironmentOutlined />
                </div>
                <div className="overflow-hidden min-w-0">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">Điểm đến / Khách sạn</span>
                  <div className="text-sm font-bold text-slate-800 truncate" title="LuxeHotel Grand Resort, Đà Nẵng">
                    LuxeHotel Grand Resort, Đà Nẵng
                  </div>
                </div>
              </div>

              {/* Field 2: Date picker range */}
              <div className="md:col-span-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 rounded-2xl p-3 flex items-center gap-3.5 transition-colors">
                <div className="w-11 h-11 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center text-xl shrink-0">
                  <CalendarOutlined />
                </div>
                <div className="w-full min-w-0">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">Ngày nhận & trả phòng</span>
                  <RangePicker
                    variant="borderless"
                    className="p-0 font-bold text-slate-800 w-full"
                    placeholder={['Nhận phòng', 'Trả phòng']}
                    value={selectedDates}
                    onChange={dates => setSelectedDates(dates)}
                    format="DD/MM/YYYY"
                    size="middle"
                  />
                </div>
              </div>

              {/* Field 3: Guests */}
              <div className="md:col-span-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 rounded-2xl p-3 flex items-center gap-3.5 transition-colors">
                <div className="w-11 h-11 rounded-xl bg-purple-100/80 text-purple-600 flex items-center justify-center text-xl shrink-0">
                  <UserOutlined />
                </div>
                <div className="w-full min-w-0">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">Số lượng khách</span>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    className="bg-transparent text-sm font-bold text-slate-800 w-full outline-none cursor-pointer py-0.5"
                  >
                    <option value="1">1 Người lớn</option>
                    <option value="2">2 Người lớn, 1 Phòng</option>
                    <option value="3">3 Người lớn, 1 Phòng</option>
                    <option value="4">4+ Khách (Gia đình)</option>
                  </select>
                </div>
              </div>

              {/* Field 4: Submit button */}
              <div className="md:col-span-1 flex items-center">
                <Button
                  type="primary"
                  onClick={handleSearch}
                  className="w-full h-full min-h-[56px] rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold border-none shadow-lg shadow-blue-500/25 flex flex-col items-center justify-center text-xs gap-1 cursor-pointer transition-all"
                >
                  <SearchOutlined className="text-lg" />
                  <span>Tìm</span>
                </Button>
              </div>
            </div>

            {/* Bottom trust banner inside search card */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircleFilled className="text-emerald-500" /> Miễn phí hủy phòng trước 24h
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircleFilled className="text-emerald-500" /> Thanh toán an toàn đa phương thức
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircleFilled className="text-emerald-500" /> Tích lũy điểm hội viên VIP
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Traveloka-style Coupons & Voucher Section */}
      <div id="promos" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20 mb-16">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80">
          <div className="flex justify-between items-end mb-6 flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-wider mb-1">
                <GiftOutlined /> ƯU ĐÃI ĐẶC QUYỀN HỘI VIÊN
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Mã giảm giá đặt phòng độc quyền
              </h2>
            </div>
            <button
              onClick={() => setPromoModalOpen(true)}
              className="text-amber-600 hover:text-amber-700 font-bold text-sm flex items-center gap-1.5 cursor-pointer bg-amber-50 hover:bg-amber-100 px-3.5 py-1.5 rounded-xl border border-amber-200 transition-all"
            >
              Xem tất cả ưu đãi <ArrowRightOutlined />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PROMO_CODES.map((promo) => (
              <div
                key={promo.code}
                className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50/50 to-amber-50/20 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group hover:border-amber-400/50"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                      {promo.tag}
                    </span>
                    <span className="text-xl font-black text-amber-600">
                      {promo.discount}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-1.5 group-hover:text-amber-600 transition-colors">
                    {promo.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    {promo.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-dashed border-slate-200 flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-300">
                    {promo.code}
                  </span>
                  <button
                    onClick={() => handleCopy(promo.code)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition-colors"
                  >
                    <CopyOutlined /> Sao chép
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Rooms Showcase Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex justify-between items-end mb-8 flex-wrap gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-600 block mb-1">
              LUXURY COLLECTION
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Hạng phòng & Biệt thự nổi bật
            </h2>
          </div>
          <Link
            to="/rooms"
            className="px-5 py-2.5 rounded-xl border border-slate-300 hover:border-amber-500 text-slate-700 hover:text-amber-600 font-semibold text-sm transition-all"
          >
            Khám phá tất cả phòng →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredRooms.map((room) => (
            <div
              key={room.id}
              className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-100 transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                {/* Room Image with Multi-photo gallery */}
                <div className="relative h-48 bg-slate-100 overflow-hidden group/img">
                  {room.images && room.images.length > 0 ? (
                    <Image.PreviewGroup>
                      <div className="w-full h-full relative cursor-pointer">
                        <Image
                          src={room.images[0]}
                          alt={`Phòng ${room.room_number}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          wrapperStyle={{ width: '100%', height: '100%' }}
                          fallback="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%' viewBox='0 0 200 150'><rect width='100%' height='100%' fill='%23f1f5f9'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='14' fill='%2394a3b8'>No Image</text></svg>"
                        />
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
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                      wrapperStyle={{ width: '100%', height: '100%' }}
                      fallback="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%' viewBox='0 0 200 150'><rect width='100%' height='100%' fill='%23f1f5f9'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='14' fill='%2394a3b8'>No Image</text></svg>"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-slate-800 to-indigo-950 flex items-center justify-center text-4xl">
                      {room.type_name === 'Thượng hạng' || room.type_name === 'Suite' ? '👑' : room.type_name === 'Sang trọng' || room.type_name === 'Deluxe' ? '✨' : '🏨'}
                    </div>
                  )}

                  <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-amber-400 px-3 py-1 rounded-full text-xs font-bold pointer-events-none z-10">
                    {room.type_name}
                  </div>
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-slate-800 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm pointer-events-none z-10">
                    <StarFilled className="text-amber-500" /> 5.0
                  </div>

                  {room.images && room.images.length > 1 && (
                    <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-md pointer-events-none z-10">
                      <PictureOutlined /> {room.images.length} ảnh
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-extrabold text-lg text-slate-900">
                      Phòng {room.room_number}
                    </h3>
                    <span className="text-xs text-slate-400">{room.capacity} Khách</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-4 line-clamp-2">
                    Không gian nghỉ dưỡng sang trọng, view toàn cảnh hướng biển & thành phố.
                  </p>
                </div>
              </div>

              <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Giá từ</span>
                  <span className="text-base font-black text-amber-600">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(room.current_price)}
                  </span>
                </div>
                <Button
                  type="primary"
                  onClick={() => navigate(`/checkout?room_id=${room.id}`)}
                  className="rounded-xl bg-slate-900 hover:bg-amber-600 font-bold text-xs h-9 px-4 border-none shadow-sm"
                >
                  Đặt phòng
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5-Star Amenities Showcase */}
      <div id="services" className="bg-[#0f172a] text-white py-20 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2 block">
              DỊCH VỤ ĐẲNG CẤP
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              Tiện ích nghỉ dưỡng 5 sao
            </h2>
            <p className="text-slate-400 text-sm mt-3">
              Mỗi chi tiết đều được chăm chút kỹ lưỡng để mang đến cho bạn trải nghiệm thư giãn thăng hoa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div
              id="amenity-pool"
              onClick={() => {
                setSelectedService({
                  name: 'Hồ bơi vô cực chân mây',
                  icon: '🏊',
                  desc: 'Hồ bơi tràn bờ tầng thượng tiêu chuẩn Olympic với tầm nhìn 360 độ ngắm biển và thành phố. Miễn phí cho tất cả khách lưu trú, phục vụ cocktail và khăn tắm cao cấp tận nơi.'
                });
                setServiceModalOpen(true);
              }}
              className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-8 hover:bg-slate-800 hover:border-amber-500/50 transition-all group cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                  🏊
                </div>
                <h3 className="text-xl font-bold mb-3 text-white group-hover:text-amber-400 transition-colors">Hồ bơi vô cực chân mây</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Tận hưởng làn nước ấm áp tại hồ bơi tràn bờ tầng thượng với tầm nhìn 360 độ toàn cảnh đại dương và thành phố.
                </p>
              </div>
              <button
                type="button"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-700/50 hover:bg-amber-500 hover:text-slate-950 text-amber-400 font-bold text-xs transition-all border border-slate-600/60 hover:border-amber-400 cursor-pointer flex items-center justify-center gap-1.5"
              >
                Xem quy định & Đặt chỗ →
              </button>
            </div>

            <div
              id="amenity-restaurant"
              onClick={() => {
                setSelectedService({
                  name: 'Nhà hàng Ẩm thực Michelin & Sky Bar',
                  icon: '🍽️',
                  desc: 'Không gian ẩm thực tinh hoa Á - Âu sang trọng. Bữa sáng buffet hải sản thượng hạng, tiệc tối lãng mạn dưới ánh nến và danh mục hơn 200 dòng rượu vang hảo hạng toàn cầu.'
                });
                setServiceModalOpen(true);
              }}
              className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-8 hover:bg-slate-800 hover:border-amber-500/50 transition-all group cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                  🍽️
                </div>
                <h3 className="text-xl font-bold mb-3 text-white group-hover:text-amber-400 transition-colors">Ẩm thực Michelin & Bar</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Thưởng thức tinh hoa ẩm thực Á - Âu chuẩn vị từ các bếp trưởng quốc tế cùng danh mục rượu vang danh giá.
                </p>
              </div>
              <button
                type="button"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-700/50 hover:bg-amber-500 hover:text-slate-950 text-amber-400 font-bold text-xs transition-all border border-slate-600/60 hover:border-amber-400 cursor-pointer flex items-center justify-center gap-1.5"
              >
                Đặt bàn nhà hàng →
              </button>
            </div>

            <div
              id="amenity-spa"
              onClick={() => {
                setSelectedService({
                  name: 'Luxe Spa & Trị liệu phục hồi',
                  icon: '💆',
                  desc: 'Hệ thống xông hơi đá muối Himalaya, bể sục Jacuzzi nóng lạnh và các gói massage bấm huyệt thảo dược chuyên sâu giúp tái tạo hoàn toàn năng lượng thể chất và tinh thần.'
                });
                setServiceModalOpen(true);
              }}
              className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-8 hover:bg-slate-800 hover:border-amber-500/50 transition-all group cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                  💆
                </div>
                <h3 className="text-xl font-bold mb-3 text-white group-hover:text-amber-400 transition-colors">Spa trị liệu phục hồi</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Thư giãn tối đa với các liệu trình thảo dược tự nhiên và kỹ thuật massage chuyên sâu từ các chuyên gia chăm sóc sức khỏe.
                </p>
              </div>
              <button
                type="button"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-700/50 hover:bg-amber-500 hover:text-slate-950 text-amber-400 font-bold text-xs transition-all border border-slate-600/60 hover:border-amber-400 cursor-pointer flex items-center justify-center gap-1.5"
              >
                Xem gói trị liệu & Đặt hẹn →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal chi tiết dịch vụ riêng biệt */}
      <Modal
        open={serviceModalOpen}
        onCancel={() => setServiceModalOpen(false)}
        footer={null}
        width={500}
        centered
      >
        {selectedService && (
          <div className="p-4 text-center">
            <div className="text-5xl mb-4">{selectedService.icon}</div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">
              Dịch vụ {selectedService.name}
            </h3>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              {selectedService.desc}
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left mb-6 text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <CheckOutlined /> Phục vụ tiêu chuẩn 5 sao quốc tế
              </div>
              <div className="flex items-center gap-2">
                <ClockCircleOutlined /> Hoạt động 24/7 theo yêu cầu của quý khách
              </div>
              <div className="flex items-center gap-2">
                <PhoneOutlined /> Hỗ trợ đặt lịch nhanh qua Hotline: <b>1900 8888</b>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                block
                size="large"
                onClick={() => setServiceModalOpen(false)}
                className="rounded-xl border-slate-300 font-semibold"
              >
                Đóng
              </Button>
              <Button
                block
                type="primary"
                size="large"
                onClick={() => {
                  setServiceModalOpen(false);
                  message.success('Yêu cầu tư vấn dịch vụ của bạn đã được gửi tới lễ tân!');
                }}
                className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 font-bold border-none text-slate-950"
              >
                Liên hệ đặt lịch ngay
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Tất Cả Ưu Đãi Độc Quyền */}
      <Modal
        open={promoModalOpen}
        onCancel={() => setPromoModalOpen(false)}
        footer={null}
        width={680}
        centered
        title={
          <div className="flex items-center gap-2 text-amber-600 text-lg font-black">
            <GiftOutlined /> TẤT CẢ MÃ ƯU ĐÃI & KHUYẾN MÃI LUXEHOTEL
          </div>
        }
      >
        <div className="py-2 space-y-4">
          <p className="text-slate-500 text-xs mb-4">
            Sao chép mã ưu đãi dưới đây và dán vào ô <b>"Mã ưu đãi (Coupon)"</b> tại bước thanh toán để được giảm giá tức thì!
          </p>

          <div className="space-y-3">
            {PROMO_CODES.map((promo) => (
              <div
                key={promo.code}
                className="p-4 rounded-2xl border border-slate-200 bg-gradient-to-r from-amber-50/40 via-white to-orange-50/30 flex items-center justify-between gap-4 flex-wrap hover:border-amber-400 transition-all shadow-sm"
              >
                <div className="space-y-1 max-w-sm">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px]">
                      {promo.tag}
                    </span>
                    <h4 className="font-bold text-slate-800 text-sm m-0">{promo.title}</h4>
                  </div>
                  <p className="text-xs text-slate-500 m-0">{promo.desc}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xl font-black text-amber-600 block leading-none">{promo.discount}</span>
                    <span className="font-mono font-bold text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-300 mt-1 inline-block">
                      {promo.code}
                    </span>
                  </div>
                  <Button
                    type="primary"
                    onClick={() => {
                      handleCopy(promo.code);
                    }}
                    className="bg-amber-500 hover:bg-amber-600 font-bold text-xs rounded-xl h-8 px-3 border-none text-slate-950"
                  >
                    Sao chép
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Button
              onClick={() => setPromoModalOpen(false)}
              className="rounded-xl font-medium"
            >
              Đóng
            </Button>
            <Button
              type="primary"
              onClick={() => {
                setPromoModalOpen(false);
                navigate('/rooms');
              }}
              className="rounded-xl bg-slate-900 hover:bg-slate-800 font-bold text-white border-none"
            >
              Chọn phòng & Đặt ngay →
            </Button>
          </div>
        </div>
      </Modal>

      {/* Footer */}
      <footer className="bg-[#0a101d] text-slate-400 pt-16 pb-12 border-t border-slate-800 text-sm">
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
                <li><a href="#" className="hover:text-amber-400 transition-colors">Giới thiệu LuxeHotel</a></li>
                <li><a href="#" className="hover:text-amber-400 transition-colors">Hệ thống phòng & Biệt thự</a></li>
                <li><a href="#" className="hover:text-amber-400 transition-colors">Dịch vụ & Tiện ích</a></li>
                <li><a href="#" className="hover:text-amber-400 transition-colors">Tin tức & Sự kiện</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-wider">Hỗ trợ khách hàng</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#" className="hover:text-amber-400 transition-colors">Trung tâm trợ giúp 24/7</a></li>
                <li><a href="#" className="hover:text-amber-400 transition-colors">Chính sách đặt & hủy phòng</a></li>
                <li><a href="#" className="hover:text-amber-400 transition-colors">Quy định hội viên VIP</a></li>
                <li><a href="#" className="hover:text-amber-400 transition-colors">Điều khoản dịch vụ</a></li>
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
            <div>
              <Link to="/admin/login" className="text-slate-600 hover:text-slate-400 transition-colors">
                Đăng nhập Quản trị viên (Admin/Staff)
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
