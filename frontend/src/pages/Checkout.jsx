import React, { useState, useEffect } from 'react';
import { Form, Input, DatePicker, Button, Card, message, Modal, Spin, Alert, Radio, Tag, Tooltip, Image, Upload } from 'antd';
import {
  CheckCircleOutlined, CalendarOutlined, HomeOutlined, SafetyCertificateOutlined,
  CrownOutlined, CreditCardOutlined, UserOutlined, PhoneOutlined, MailOutlined,
  DollarOutlined, TagOutlined, ArrowLeftOutlined, CheckCircleFilled, CloseCircleOutlined, PictureOutlined,
  UploadOutlined, QrcodeOutlined, FileImageOutlined, LoadingOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const PROMO_CODES = {
  'LUXEWELCOME': { discount: 0.15, label: 'Giảm 15% đặt phòng lần đầu' },
  'WEEKENDLUX': { discountValue: 300000, label: 'Giảm trực tiếp 300.000₫' },
  'VIELUXURY2026': { discount: 0.25, label: 'Giảm 25% ưu đãi VIP 2026' }
};

function Checkout() {
  const [form] = Form.useForm();
  const location = useLocation();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [roomLoading, setRoomLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingSuccessData, setBookingSuccessData] = useState(null);
  const [selectedDates, setSelectedDates] = useState(null);
  const [customerUser, setCustomerUser] = useState(null);

  // Khuyến mãi & Thanh toán
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('deposit_hotel'); // 'deposit_hotel', 'full_transfer'
  const [billImage, setBillImage] = useState('');
  const [uploadingBill, setUploadingBill] = useState(false);
  
  // Modal hiển thị mã QR kèm số tiền và tải bill
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState(null);

  const searchParams = new URLSearchParams(location.search);
  const roomId = searchParams.get('room_id');
  const queryCheckIn = searchParams.get('check_in');
  const queryCheckOut = searchParams.get('check_out');

  useEffect(() => {
    // 1. Kiểm tra tài khoản đã đăng nhập
    const stored = localStorage.getItem('customerUser');
    if (stored) {
      try {
        const u = JSON.parse(stored);
        setCustomerUser(u);
        form.setFieldsValue({
          fullName: u.fullName,
          email: u.email,
          phone: u.phone || ''
        });
      } catch { /* ignore */ }
    }

    // 2. Set ngày mặc định từ query
    if (queryCheckIn && queryCheckOut) {
      const dIn = dayjs(queryCheckIn);
      const dOut = dayjs(queryCheckOut);
      if (dIn.isValid() && dOut.isValid() && dOut.isAfter(dIn)) {
        setSelectedDates([dIn, dOut]);
        form.setFieldsValue({ dates: [dIn, dOut] });
      }
    } else {
      // Mặc định từ hôm nay đến ngày mai (1 đêm)
      const today = dayjs();
      const tomorrow = dayjs().add(1, 'day');
      setSelectedDates([today, tomorrow]);
      form.setFieldsValue({ dates: [today, tomorrow] });
    }

    // 3. Tải thông tin phòng
    if (roomId) {
      setRoomLoading(true);
      axios.get('/api/rooms')
        .then(res => {
          const found = res.data.find(r => r.id === parseInt(roomId));
          if (found) setRoom(found);
          else message.error('Không tìm thấy thông tin phòng!');
        })
        .catch(() => message.error('Không thể kết nối server!'))
        .finally(() => setRoomLoading(false));
    } else {
      setRoomLoading(false);
    }
  }, [roomId, form]);

  // Tính số đêm
  const nights = selectedDates && selectedDates[0] && selectedDates[1]
    ? Math.max(1, selectedDates[1].diff(selectedDates[0], 'days'))
    : 1;

  // Tính toán chi phí
  const rawSubtotal = room ? room.current_price * nights : 0;
  
  // Áp dụng khuyến mãi
  let discountAmount = 0;
  if (appliedPromo) {
    if (appliedPromo.discount) {
      discountAmount = rawSubtotal * appliedPromo.discount;
    } else if (appliedPromo.discountValue) {
      discountAmount = Math.min(rawSubtotal, appliedPromo.discountValue);
    }
  }

  // Thuế & Phí dịch vụ (Bao gồm trong chuẩn 5 sao hoặc tính chuẩn)
  const serviceFee = Math.round((rawSubtotal - discountAmount) * 0.05); // 5% phí phục vụ
  const finalTotal = Math.max(0, rawSubtotal - discountAmount + serviceFee);

  // Số tiền cọc quy định khi thanh toán tại khách sạn (30% tổng tiền)
  const depositAmount = Math.round(finalTotal * 0.30);
  const amountToTransfer = paymentMethod === 'deposit_hotel' ? depositAmount : finalTotal;

  const handleApplyPromo = () => {
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) {
      message.warning('Vui lòng nhập mã giảm giá');
      return;
    }
    if (PROMO_CODES[code]) {
      setAppliedPromo({ code, ...PROMO_CODES[code] });
      message.success(`Đã áp dụng mã ưu đãi: ${code}!`);
    } else {
      message.error('Mã giảm giá không tồn tại hoặc đã hết hạn!');
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCodeInput('');
  };

  // Upload bill chuyển khoản
  const handleUploadBill = async (file) => {
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('Kích thước ảnh bill tối đa là 10MB!');
      return false;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        setUploadingBill(true);
        const res = await axios.post('/api/bookings/upload-bill', {
          imageBase64: reader.result,
          fileName: file.name
        });
        setBillImage(res.data.billUrl);
        message.success('Đã tải ảnh bill chuyển khoản thành công!');
      } catch (err) {
        console.error(err);
        message.error('Tải ảnh bill thất bại, vui lòng thử lại!');
      } finally {
        setUploadingBill(false);
      }
    };
    return false;
  };

  // 1. Khi bấm nút "THANH TOÁN CỌC" hoặc "THANH TOÁN 100%"
  const onFinish = async (values) => {
    if (!room) return;
    setPendingValues(values);
    setQrModalOpen(true);
  };

  // 2. Khi khách quét QR xong và bấm xác nhận hoàn tất trong Modal QR
  const handleConfirmBookingWithBill = async () => {
    if (!pendingValues || !room) return;

    if (!billImage) {
      message.warning('Vui lòng tải lên hình ảnh chụp màn hình chuyển khoản (Bill thanh toán)!');
      return;
    }

    setLoading(true);

    const checkInDate = pendingValues.dates[0].format('YYYY-MM-DD');
    const checkOutDate = pendingValues.dates[1].format('YYYY-MM-DD');

    const payload = {
      full_name: pendingValues.fullName,
      phone: pendingValues.phone,
      email: pendingValues.email || customerUser?.email,
      room_id: room.id,
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      total_amount: finalTotal,
      special_requests: pendingValues.specialRequests || '',
      payment_method: paymentMethod, // 'deposit_hotel' hoặc 'full_transfer'
      deposit_amount: paymentMethod === 'deposit_hotel' ? depositAmount : null,
      bill_image_url: billImage
    };

    try {
      const res = await axios.post('/api/bookings', payload);
      setQrModalOpen(false);
      setBookingSuccessData({
        bookingCode: res.data.booking_code,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        nights,
        total: finalTotal,
        paymentMethod: paymentMethod === 'deposit_hotel'
          ? `Cọc trước 30% (${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(depositAmount)}) — Trả phần còn lại tại KS`
          : 'Chuyển khoản 100% qua VietQR',
        depositAmount: paymentMethod === 'deposit_hotel' ? depositAmount : null,
        billUrl: billImage
      });
      setIsModalOpen(true);
    } catch (error) {
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi đặt phòng! Vui lòng thử lại.';
      message.error(msg);
    }
    setLoading(false);
  };

  if (roomLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a101d] text-white">
        <Spin size="large" />
        <p className="mt-4 text-slate-400 font-medium">Đang chuẩn bị trang đặt phòng...</p>
      </div>
    );
  }

  if (!roomId || !room) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 p-4">
        <Alert
          type="warning"
          message="Không tìm thấy thông tin phòng"
          description="Vui lòng quay lại danh sách phòng và chọn phòng bạn muốn đặt."
          showIcon
          className="max-w-md rounded-2xl p-4 shadow-md"
        />
        <Link to="/rooms">
          <Button type="primary" icon={<HomeOutlined />} className="bg-amber-500 font-bold border-none h-11 px-6 rounded-xl">
            Xem danh sách phòng
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-800">
      {/* Top Header */}
      <header className="bg-[#0f172a] sticky top-0 z-50 border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 no-underline">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-xl shadow-md">
              🏨
            </div>
            <div>
              <span className="text-2xl font-black tracking-wider text-white">LUXE<span className="text-amber-400">HOTEL</span></span>
              <span className="block text-[10px] tracking-widest uppercase text-slate-400 font-semibold -mt-1">Thanh toán & Đặt phòng</span>
            </div>
          </Link>

          <div className="flex items-center gap-4 text-xs">
            <span className="hidden sm:flex items-center gap-1.5 text-emerald-400 font-medium">
              <SafetyCertificateOutlined /> Đặt phòng bảo mật 256-bit SSL
            </span>
            <Link to="/rooms" className="text-slate-300 hover:text-amber-400 transition-colors flex items-center gap-1">
              <ArrowLeftOutlined /> Đổi phòng khác
            </Link>
          </div>
        </div>
      </header>

      {/* Progress Steps (Traveloka Checkout Flow) */}
      <div className="bg-white border-b border-slate-200 py-3 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 flex justify-between items-center text-xs font-bold text-slate-500">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px]">1</span>
            <span>Chọn phòng</span>
          </div>
          <span className="text-slate-300">———</span>
          <div className="flex items-center gap-2 text-amber-600 font-bold">
            <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px]">2</span>
            <span>Chi tiết đặt phòng & Thanh toán</span>
          </div>
          <span className="text-slate-300">———</span>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px]">3</span>
            <span>Xác nhận thành công</span>
          </div>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Guest Info & Payment Form (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Step 1: Thông tin người đặt */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80">
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2.5 m-0">
                  <span className="w-7 h-7 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-sm">👤</span>
                  Thông tin khách lưu trú
                </h2>
                {customerUser ? (
                  <Tag color="gold" className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold border-none">
                    ⭐ Hội viên {customerUser.fullName}
                  </Tag>
                ) : (
                  <span className="text-xs text-slate-400">
                    Đã có tài khoản? <Link to="/login" className="text-amber-600 font-bold hover:underline">Đăng nhập</Link>
                  </span>
                )}
              </div>

              <Form form={form} layout="vertical" onFinish={onFinish} size="large">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                  <Form.Item
                    label={<span className="text-xs font-bold text-slate-700">Họ và tên đầy đủ *</span>}
                    name="fullName"
                    rules={[{ required: true, message: 'Vui lòng nhập họ và tên của bạn!' }]}
                  >
                    <Input prefix={<UserOutlined className="text-slate-400 mr-1" />} placeholder="VD: Nguyễn Văn A" className="rounded-xl text-sm h-11" />
                  </Form.Item>

                  <Form.Item
                    label={<span className="text-xs font-bold text-slate-700">Số điện thoại liên hệ *</span>}
                    name="phone"
                    rules={[
                      { required: true, message: 'Vui lòng nhập số điện thoại!' },
                      { pattern: /^[0-9]{9,11}$/, message: 'Số điện thoại không hợp lệ (9 - 11 số)!' }
                    ]}
                  >
                    <Input prefix={<PhoneOutlined className="text-slate-400 mr-1" />} placeholder="VD: 0901234567" className="rounded-xl text-sm h-11" />
                  </Form.Item>
                </div>

                <Form.Item
                  label={<span className="text-xs font-bold text-slate-700">Địa chỉ Email (Nhận mã xác nhận vé) *</span>}
                  name="email"
                  rules={[
                    { required: true, message: 'Vui lòng nhập email!' },
                    { type: 'email', message: 'Email không đúng định dạng!' }
                  ]}
                >
                  <Input prefix={<MailOutlined className="text-slate-400 mr-1" />} placeholder="VD: email@example.com" className="rounded-xl text-sm h-11" />
                </Form.Item>

                {/* Chọn ngày nhận / trả phòng */}
                <Form.Item
                  label={<span className="text-xs font-bold text-slate-700 flex items-center gap-1"><CalendarOutlined className="text-amber-500" /> Thời gian lưu trú (Nhận phòng & Trả phòng) *</span>}
                  name="dates"
                  rules={[{ required: true, message: 'Vui lòng chọn ngày nhận và trả phòng!' }]}
                >
                  <RangePicker
                    className="w-full rounded-xl h-12 text-sm font-semibold border-slate-300"
                    disabledDate={current => current && current < dayjs().startOf('day')}
                    format="DD/MM/YYYY"
                    value={selectedDates}
                    onChange={(dates) => setSelectedDates(dates)}
                    placeholder={['Ngày nhận phòng', 'Ngày trả phòng']}
                  />
                </Form.Item>

                {/* Yêu cầu đặc biệt */}
                <Form.Item
                  label={<span className="text-xs font-bold text-slate-700">Yêu cầu đặc biệt (Không bắt buộc)</span>}
                  name="specialRequests"
                >
                  <TextArea
                    rows={2}
                    placeholder="VD: Phòng tầng cao, 1 giường lớn, không hút thuốc, nhận phòng muộn..."
                    className="rounded-xl text-sm"
                  />
                </Form.Item>

                {/* Phương thức thanh toán & Đặt cọc */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2.5 mb-2">
                    <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm">💳</span>
                    Phương thức thanh toán & Quy định cọc
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Để đảm bảo giữ phòng thành công, quý khách vui lòng chọn hình thức và quét mã QR chuyển khoản kèm tải ảnh bill bên dưới.
                  </p>

                  <div className="space-y-3 mb-6">
                    {/* Option 1: Thanh toán nhận phòng (Cọc trước 30%) */}
                    <label
                      onClick={() => setPaymentMethod('deposit_hotel')}
                      className={`flex items-start justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        paymentMethod === 'deposit_hotel' ? 'border-amber-500 bg-amber-50/50 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Radio checked={paymentMethod === 'deposit_hotel'} className="mt-1" />
                        <div>
                          <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <span>Thanh toán khi nhận phòng</span>
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                              Cọc trước 30% ({new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(depositAmount)})
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                            Quý khách thanh toán cọc trước <b>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(depositAmount)}</b> để giữ phòng qua mã QR. Số tiền còn lại <b>({new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(finalTotal - depositAmount)})</b> sẽ thanh toán khi nhận phòng.
                          </div>
                        </div>
                      </div>
                      <span className="text-2xl shrink-0 ml-2">🏨</span>
                    </label>

                    {/* Option 2: Chuyển khoản 100% */}
                    <label
                      onClick={() => setPaymentMethod('full_transfer')}
                      className={`flex items-start justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        paymentMethod === 'full_transfer' ? 'border-amber-500 bg-amber-50/50 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Radio checked={paymentMethod === 'full_transfer'} className="mt-1" />
                        <div>
                          <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <span>Chuyển khoản toàn bộ 100% qua mã QR</span>
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                              Trả đủ 100% ({new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(finalTotal)})
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                            Quét mã QR thanh toán nhanh toàn bộ 100% số tiền phòng, nhận phòng không cần thêm thủ tục thanh toán.
                          </div>
                        </div>
                      </div>
                      <span className="text-2xl shrink-0 ml-2">📲</span>
                    </label>
                  </div>
                </div>

                {/* Submit button - Đổi thành THANH TOÁN CỌC theo yêu cầu */}
                <Button
                  type="primary"
                  htmlType="submit"
                  className="w-full h-14 rounded-2xl font-black text-base shadow-xl border-none cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                    color: '#fff',
                    boxShadow: '0 8px 25px rgba(245, 158, 11, 0.35)'
                  }}
                >
                  {paymentMethod === 'deposit_hotel'
                    ? `THANH TOÁN CỌC (${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(depositAmount)})`
                    : `THANH TOÁN 100% (${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(finalTotal)})`}
                </Button>
                
                <p className="text-[11px] text-center text-slate-400 mt-3">
                  Bằng việc bấm thanh toán, bạn đồng ý với các <a href="#" className="underline text-slate-500">Quy định & Chính sách hủy phòng</a> của LuxeHotel.
                </p>
              </Form>
            </div>
          </div>

          {/* Right Column: Room Details & Price Breakdown (5 Cols) */}
          <div className="lg:col-span-5 sticky top-20 space-y-5">
            
            {/* Room Summary Card */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200/80">
              {/* Room Image with Multi-photo gallery */}
              <div className="relative h-44 bg-slate-900 overflow-hidden group/img">
                {room.images && room.images.length > 0 ? (
                  <Image.PreviewGroup>
                    <div className="w-full h-full relative cursor-pointer">
                      <Image
                        src={room.images[0]}
                        alt={room.room_number}
                        className="w-full h-full object-cover"
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
                    alt={room.room_number}
                    className="w-full h-full object-cover cursor-pointer"
                    wrapperStyle={{ width: '100%', height: '100%' }}
                    fallback="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%' viewBox='0 0 200 150'><rect width='100%' height='100%' fill='%23f1f5f9'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='14' fill='%2394a3b8'>No Image</text></svg>"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-tr from-slate-900 to-slate-800 text-amber-400">
                    🏨
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none z-10" />

                {room.images && room.images.length > 1 && (
                  <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white px-2 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-md pointer-events-none z-20">
                    <PictureOutlined /> {room.images.length} ảnh
                  </div>
                )}

                <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end pointer-events-none z-20">
                  <div>
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest block">Phòng hạng 5 sao</span>
                    <h3 className="text-lg font-black text-white m-0">Phòng {room.room_number} — {room.type_name}</h3>
                  </div>
                  <Tag color="gold" className="m-0 font-bold border-none rounded-lg px-2 text-xs">
                    {room.capacity} Khách
                  </Tag>
                </div>
              </div>

              {/* Room Key Perks */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 text-xs text-slate-600 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircleFilled className="text-emerald-500" /> Miễn phí ăn sáng buffet 5 sao mỗi ngày
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleFilled className="text-emerald-500" /> Miễn phí nước suối, trà, cà phê trong phòng
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleFilled className="text-emerald-500" /> Miễn phí bể bơi vô cực & phòng Gym cao cấp
                </div>
              </div>

              {/* Coupon Box */}
              <div className="p-5 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-700 block mb-2">🎁 Mã ưu đãi giảm giá (Coupon)</span>
                {!appliedPromo ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="VD: LUXEWELCOME, WEEKENDLUX"
                      value={promoCodeInput}
                      onChange={e => setPromoCodeInput(e.target.value)}
                      className="rounded-xl uppercase font-bold text-xs"
                    />
                    <Button
                      onClick={handleApplyPromo}
                      className="bg-slate-900 hover:bg-amber-600 text-white font-bold rounded-xl text-xs h-9 px-4 border-none"
                    >
                      Áp dụng
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                    <div>
                      <span className="font-bold">{appliedPromo.code}</span>: {appliedPromo.label}
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePromo}
                      className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors"
                      title="Gỡ bỏ mã giảm giá"
                    >
                      <CloseCircleOutlined /> Gỡ
                    </button>
                  </div>
                )}

                {/* Gợi ý mã code */}
                <div className="flex gap-1.5 mt-2.5 flex-wrap">
                  {Object.keys(PROMO_CODES).map(code => (
                    <button
                      key={code}
                      onClick={() => { setPromoCodeInput(code); }}
                      className="text-[10px] bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 px-2 py-0.5 rounded-md border border-slate-200 transition-colors cursor-pointer"
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Details */}
              <div className="p-5 space-y-3 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Giá gốc ({nights} đêm × {new Intl.NumberFormat('vi-VN').format(room.current_price)}₫)</span>
                  <span className="font-semibold text-slate-700">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(rawSubtotal)}
                  </span>
                </div>

                {appliedPromo && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Ưu đãi khuyến mãi ({appliedPromo.code})</span>
                    <span>- {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-500">
                  <span className="flex items-center gap-1">
                    Phí dịch vụ resort & tiện ích (5%)
                  </span>
                  <span className="font-semibold text-slate-700">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(serviceFee)}
                  </span>
                </div>

                <div className="border-t border-slate-100 pt-3 mt-3 flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-bold text-slate-800 block">Tổng tiền thanh toán</span>
                    <span className="text-[10px] text-slate-400">Đã bao gồm toàn bộ thuế & phí</span>
                  </div>
                  <span className="text-2xl font-black text-amber-600">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(finalTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Guarantee Box */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-xs text-amber-900 flex items-center gap-3">
              <span className="text-2xl">🛡️</span>
              <div>
                <span className="font-bold block">Cam kết giá phòng tốt nhất</span>
                <span>Miễn phí hủy phòng trước 48h. Hỗ trợ khách hàng ưu tiên 24/7 hotline 1900 8888.</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL MÃ QR THANH TOÁN TỰ ĐỘNG ĐIỀN TIỀN & XÁC NHẬN BILL */}
      <Modal
        open={qrModalOpen}
        onCancel={() => setQrModalOpen(false)}
        footer={null}
        centered
        width={480}
        destroyOnClose
        bodyStyle={{ padding: '24px 20px', backgroundColor: '#0f172a', borderRadius: '24px' }}
      >
        <div className="text-white font-sans text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Vietcombank Napas 24/7
          </div>

          <h3 className="text-xl font-black text-slate-100 mb-1">
            {paymentMethod === 'deposit_hotel' ? 'Quét Mã Thanh Toán Cọc' : 'Quét Mã Thanh Toán 100%'}
          </h3>
          <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
            Mở App ngân hàng bất kỳ để quét mã QR. Số tiền và nội dung chuyển khoản đã được cài đặt sẵn.
          </p>

          {/* HÌNH ẢNH MÃ QR TỰ ĐỘNG ĐIỀN TIỀN CỦA VIETCOMBANK */}
          <div className="bg-white p-3 rounded-2xl shadow-2xl max-w-[270px] mx-auto border-2 border-emerald-500">
            <img
              src={`https://img.vietqr.io/image/vietcombank-9355851583-compact2.png?amount=${amountToTransfer}&addInfo=${encodeURIComponent(
                `COC PHONG ${room ? room.room_number : ''} ${pendingValues?.phone || ''}`
              )}&accountName=LUU%20VAN%20LUONG`}
              alt="Mã QR Vietcombank chuyển khoản"
              className="w-full h-auto rounded-lg"
            />
          </div>

          {/* THÔNG TIN CHUYỂN KHOẢN CHI TIẾT */}
          <div className="bg-slate-800/80 rounded-2xl p-3.5 mt-4 text-xs text-left space-y-1.5 border border-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-400">Ngân hàng:</span>
              <span className="font-bold text-white">Vietcombank</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Chủ tài khoản:</span>
              <span className="font-bold text-amber-400">LUU VAN LUONG</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Số tài khoản:</span>
              <span className="font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded">9355851583</span>
            </div>
            <div className="flex justify-between items-center pt-1.5 border-t border-slate-700">
              <span className="text-slate-300 font-bold">Số tiền tự động điền:</span>
              <span className="font-black text-base text-emerald-400">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amountToTransfer)}
              </span>
            </div>
          </div>

          {/* Ô TẢI ẢNH BILL CHỨNG TỪ */}
          <div className="mt-4 bg-slate-800/90 p-3.5 rounded-2xl border border-amber-500/40 text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <FileImageOutlined /> Tải ảnh bill xác nhận chuyển khoản:
              </span>
              {billImage && (
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  ✓ Đã có bill
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Upload
                beforeUpload={handleUploadBill}
                showUploadList={false}
                accept="image/*"
              >
                <Button
                  icon={uploadingBill ? <LoadingOutlined /> : <UploadOutlined />}
                  loading={uploadingBill}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs h-9 rounded-xl border-none"
                >
                  {billImage ? 'Chọn ảnh khác' : 'Tải bill chuyển khoản'}
                </Button>
              </Upload>

              {billImage ? (
                <div className="flex items-center gap-2">
                  <Image
                    src={billImage}
                    alt="Bill preview"
                    width={38}
                    height={38}
                    className="rounded-lg object-cover border border-slate-600"
                  />
                  <span className="text-[11px] text-emerald-300 font-medium">Tải bill thành công</span>
                </div>
              ) : (
                <span className="text-[11px] text-rose-300">
                  * Vui lòng tải bill sau khi chuyển tiền
                </span>
              )}
            </div>
          </div>

          {/* Nút hoàn tất đặt phòng */}
          <Button
            type="primary"
            onClick={handleConfirmBookingWithBill}
            loading={loading}
            className="w-full h-12 rounded-xl font-black text-sm mt-4 border-none"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 8px 20px rgba(16, 185, 129, 0.35)'
            }}
          >
            {loading ? 'Đang xác nhận đặt phòng...' : 'XÁC NHẬN ĐÃ CHUYỂN KHOẢN'}
          </Button>
        </div>
      </Modal>

      {/* Success Modal - Sang trọng chuẩn Traveloka */}
      <Modal
        open={isModalOpen}
        closable={false}
        footer={null}
        centered
        width={520}
        bodyStyle={{ padding: 0 }}
      >
        {bookingSuccessData && (
          <div className="p-7 text-center font-sans">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto mb-4">
              ✓
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-1">Đặt phòng thành công!</h2>
            <p className="text-xs text-slate-500 mb-6">
              Mã đặt phòng của bạn đã được lưu vào hệ thống và gửi email xác nhận.
            </p>

            {/* Booking voucher box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Mã đặt phòng</span>
                <span className="font-mono font-black text-base text-amber-600 bg-amber-50 border border-amber-200 px-3 py-0.5 rounded-lg">
                  {bookingSuccessData.bookingCode}
                </span>
              </div>

              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Phòng:</span>
                <span className="font-bold text-slate-800">Phòng {room.room_number} ({room.type_name})</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Thời gian:</span>
                <span className="font-semibold text-slate-700">
                  {dayjs(bookingSuccessData.checkIn).format('DD/MM/YYYY')} → {dayjs(bookingSuccessData.checkOut).format('DD/MM/YYYY')} ({bookingSuccessData.nights} đêm)
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Hình thức thanh toán:</span>
                <span className="font-semibold text-slate-700">{bookingSuccessData.paymentMethod}</span>
              </div>

              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm">
                <span className="font-bold text-slate-800">Tổng thanh toán:</span>
                <span className="font-black text-amber-600">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(bookingSuccessData.total)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => { setIsModalOpen(false); navigate('/'); }}
                className="flex-1 h-11 rounded-xl text-xs font-bold"
              >
                🏠 Về trang chủ
              </Button>
              <Button
                type="primary"
                onClick={() => { setIsModalOpen(false); navigate('/my-account'); }}
                className="flex-1 h-11 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 border-none text-slate-950"
              >
                📋 Xem đơn đặt của tôi
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Checkout;
