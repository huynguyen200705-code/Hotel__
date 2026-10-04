import React, { useState, useEffect } from 'react';
import {
  Table, Tag, Button, Space, Input, Select, DatePicker,
  Card, Row, Col, Statistic, Popconfirm, message, Modal, Drawer, Divider, Tooltip, Image
} from 'antd';
import {
  CalendarOutlined, SearchOutlined, ReloadOutlined, CheckCircleOutlined,
  CloseCircleOutlined, LoginOutlined, LogoutOutlined, UserOutlined,
  DollarOutlined, FilterOutlined, PhoneOutlined, EyeOutlined, FileImageOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

const STATUS_CONFIG = {
  Confirmed: {
    color: 'blue',
    label: 'Đã xác nhận',
    bg: '#eff6ff',
    icon: <CheckCircleOutlined />
  },
  CheckedIn: {
    color: 'green',
    label: 'Đã nhận phòng',
    bg: '#f0fdf4',
    icon: <LoginOutlined />
  },
  CheckedOut: {
    color: 'default',
    label: 'Đã trả phòng',
    bg: '#f8fafc',
    icon: <LogoutOutlined />
  },
  Cancelled: {
    color: 'red',
    label: 'Đã hủy',
    bg: '#fef2f2',
    icon: <CloseCircleOutlined />
  },
};

function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateRange, setFilterDateRange] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/bookings');
      setBookings(res.data || []);
    } catch (err) {
      console.error(err);
      message.error('Không thể tải danh sách đặt phòng!');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await axios.put(`/api/bookings/${id}/status`, { booking_status: status });
      message.success(`Cập nhật trạng thái thành: ${STATUS_CONFIG[status]?.label || status}`);
      fetchBookings();
      if (selectedBooking && selectedBooking.id === id) {
        setSelectedBooking({ ...selectedBooking, booking_status: status });
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật!');
    }
  };

  const handleDeleteBooking = async (id) => {
    try {
      await axios.delete(`/api/bookings/${id}`);
      message.success('Đã xóa đơn đặt phòng!');
      fetchBookings();
      setDrawerOpen(false);
    } catch (err) {
      message.error('Lỗi khi xóa đơn đặt phòng!');
    }
  };

  // Filter bookings
  const filteredBookings = bookings.filter((b) => {
    const matchSearch =
      !searchText ||
      b.booking_code?.toLowerCase().includes(searchText.toLowerCase()) ||
      b.customer_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      b.customer_phone?.includes(searchText) ||
      b.room_number?.toLowerCase().includes(searchText.toLowerCase());

    const matchStatus = !filterStatus || b.booking_status === filterStatus;

    let matchDate = true;
    if (filterDateRange && filterDateRange[0] && filterDateRange[1]) {
      const checkIn = dayjs(b.check_in_date);
      matchDate =
        checkIn.isAfter(filterDateRange[0].startOf('day')) &&
        checkIn.isBefore(filterDateRange[1].endOf('day'));
    }

    return matchSearch && matchStatus && matchDate;
  });

  // Thống kê nhanh
  const totalCount = bookings.length;
  const confirmedCount = bookings.filter((b) => b.booking_status === 'Confirmed').length;
  const checkedInCount = bookings.filter((b) => b.booking_status === 'CheckedIn').length;
  const totalRevenue = bookings
    .filter((b) => b.booking_status !== 'Cancelled')
    .reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);

  const columns = [
    {
      title: 'Mã đơn',
      dataIndex: 'booking_code',
      key: 'booking_code',
      width: 130,
      render: (code, record) => (
        <span
          onClick={() => {
            setSelectedBooking(record);
            setDrawerOpen(true);
          }}
          className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
        >
          {code}
        </span>
      ),
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customer_name',
      key: 'customer_name',
      render: (name, record) => (
        <div>
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <UserOutlined className="text-slate-400 text-xs" />
            {name}
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
            <PhoneOutlined className="text-[10px]" /> {record.customer_phone}
          </div>
        </div>
      ),
    },
    {
      title: 'Phòng',
      dataIndex: 'room_number',
      key: 'room_number',
      width: 140,
      render: (num, record) => (
        <div>
          <span className="font-bold text-slate-800 text-sm">Phòng {num}</span>
          <div className="text-xs text-amber-600 font-medium">{record.type_name}</div>
        </div>
      ),
    },
    {
      title: 'Thời gian lưu trú',
      key: 'dates',
      render: (_, record) => {
        const inDate = dayjs(record.check_in_date);
        const outDate = dayjs(record.check_out_date);
        const nights = outDate.diff(inDate, 'day') || 1;
        return (
          <div className="text-xs">
            <div className="font-semibold text-slate-700">
              {inDate.format('DD/MM/YYYY')} ➔ {outDate.format('DD/MM/YYYY')}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">({nights} đêm)</span>
          </div>
        );
      },
    },
    {
      title: 'Tổng tiền & Cọc',
      dataIndex: 'total_amount',
      key: 'total_amount',
      align: 'right',
      render: (val, record) => (
        <div>
          <div className="font-extrabold text-emerald-600 text-sm">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)}
          </div>
          {record.deposit_amount ? (
            <div className="text-[11px] text-amber-600 font-semibold mt-0.5">
              Đã cọc: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(record.deposit_amount)}
            </div>
          ) : (
            <div className="text-[10px] text-slate-400">
              {record.payment_method === 'full_transfer' ? 'Chuyển khoản 100%' : 'Thanh toán tại KS'}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Bill chuyển khoản',
      dataIndex: 'bill_image_url',
      key: 'bill_image_url',
      align: 'center',
      width: 130,
      render: (billUrl, record) => {
        if (!billUrl) {
          return (
            <span className="text-[11px] text-slate-400 italic">
              Chưa có bill
            </span>
          );
        }
        return (
          <div className="flex flex-col items-center gap-1">
            <Image
              src={billUrl}
              alt="Bill chuyển khoản"
              width={55}
              height={55}
              className="rounded-lg object-cover border border-slate-200 shadow-sm"
              fallback="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='55' height='55' viewBox='0 0 55 55'><rect width='100%' height='100%' fill='%23f1f5f9'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='9' fill='%2394a3b8'>Lỗi bill</text></svg>"
            />
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              Đã gửi bill
            </span>
          </div>
        );
      }
    },
    {
      title: 'Trạng thái',
      dataIndex: 'booking_status',
      key: 'booking_status',
      width: 140,
      align: 'center',
      render: (status) => {
        const conf = STATUS_CONFIG[status] || { color: 'default', label: status };
        return (
          <Tag color={conf.color} icon={conf.icon} className="px-2.5 py-0.5 rounded-full font-semibold text-xs">
            {conf.label}
          </Tag>
        );
      },
    },
    {
      title: 'Thao tác nghiệp vụ',
      key: 'actions',
      align: 'center',
      width: 220,
      render: (_, record) => (
        <Space size="small">
          {record.booking_status === 'Confirmed' && (
            <Button
              size="small"
              type="primary"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg border-none"
              onClick={() => handleUpdateStatus(record.id, 'CheckedIn')}
            >
              Check-in
            </Button>
          )}

          {record.booking_status === 'CheckedIn' && (
            <Button
              size="small"
              type="primary"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg border-none"
              onClick={() => handleUpdateStatus(record.id, 'CheckedOut')}
            >
              Check-out
            </Button>
          )}

          {record.booking_status === 'Confirmed' && (
            <Popconfirm
              title="Hủy đơn đặt phòng này?"
              description="Phòng sẽ được giải phóng lại trạng thái sẵn sàng."
              onConfirm={() => handleUpdateStatus(record.id, 'Cancelled')}
              okText="Đồng ý hủy"
              cancelText="Quay lại"
              okButtonProps={{ danger: true }}
            >
              <Button size="small" danger className="rounded-lg text-xs font-medium">
                Hủy đơn
              </Button>
            </Popconfirm>
          )}

          <Tooltip title="Xem chi tiết">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedBooking(record);
                setDrawerOpen(true);
              }}
              className="rounded-lg text-slate-500 hover:text-blue-600"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight m-0">Quản Lý Đặt Phòng</h1>
          <p className="text-slate-500 text-xs mt-1">Theo dõi, Check-in / Check-out và xử lý các đơn đặt phòng từ khách hàng.</p>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchBookings}
          loading={loading}
          className="rounded-xl font-semibold shadow-sm"
        >
          Làm mới
        </Button>
      </div>

      {/* KPI Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card className="rounded-2xl border-slate-200/80 shadow-sm" bodyStyle={{ padding: '16px 20px' }}>
            <Statistic
              title={<span className="text-slate-500 font-bold text-xs uppercase">Tổng đơn đặt</span>}
              value={totalCount}
              prefix={<CalendarOutlined className="text-blue-600" />}
              valueStyle={{ fontWeight: 800, color: '#1e293b' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="rounded-2xl border-slate-200/80 shadow-sm" bodyStyle={{ padding: '16px 20px' }}>
            <Statistic
              title={<span className="text-blue-600 font-bold text-xs uppercase">Chờ nhận phòng</span>}
              value={confirmedCount}
              prefix={<CheckCircleOutlined className="text-blue-500" />}
              valueStyle={{ fontWeight: 800, color: '#2563eb' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="rounded-2xl border-slate-200/80 shadow-sm" bodyStyle={{ padding: '16px 20px' }}>
            <Statistic
              title={<span className="text-emerald-600 font-bold text-xs uppercase">Đang ở (Checked-In)</span>}
              value={checkedInCount}
              prefix={<LoginOutlined className="text-emerald-500" />}
              valueStyle={{ fontWeight: 800, color: '#059669' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="rounded-2xl border-slate-200/80 shadow-sm" bodyStyle={{ padding: '16px 20px' }}>
            <Statistic
              title={<span className="text-purple-600 font-bold text-xs uppercase">Doanh thu ghi nhận</span>}
              value={totalRevenue}
              prefix={<DollarOutlined className="text-purple-600" />}
              valueStyle={{ fontWeight: 800, color: '#7c3aed', fontSize: 20 }}
              formatter={(v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v)}
            />
          </Card>
        </Col>
      </Row>

      {/* Filter Toolbar */}
      <Card className="rounded-2xl border-slate-200/80 shadow-sm" bodyStyle={{ padding: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} md={8}>
            <Input
              placeholder="Tìm theo Mã đơn, Khách hàng, SĐT, Số phòng..."
              prefix={<SearchOutlined className="text-slate-400" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              className="rounded-xl"
            />
          </Col>
          <Col xs={12} md={6}>
            <Select
              placeholder="Lọc theo trạng thái"
              value={filterStatus || undefined}
              onChange={(val) => setFilterStatus(val || '')}
              allowClear
              className="w-full rounded-xl"
            >
              <Option value="Confirmed">Đã xác nhận (Confirmed)</Option>
              <Option value="CheckedIn">Đã nhận phòng (CheckedIn)</Option>
              <Option value="CheckedOut">Đã trả phòng (CheckedOut)</Option>
              <Option value="Cancelled">Đã hủy (Cancelled)</Option>
            </Select>
          </Col>
          <Col xs={12} md={7}>
            <RangePicker
              placeholder={['Từ ngày', 'Đến ngày']}
              value={filterDateRange}
              onChange={(val) => setFilterDateRange(val)}
              format="DD/MM/YYYY"
              className="w-full rounded-xl"
            />
          </Col>
          <Col xs={24} md={3} className="text-right">
            <Button
              onClick={() => {
                setSearchText('');
                setFilterStatus('');
                setFilterDateRange(null);
              }}
              className="rounded-xl text-xs font-semibold"
            >
              Xóa lọc
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Data Table */}
      <Card className="rounded-2xl border-slate-200/80 shadow-sm overflow-hidden" bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={filteredBookings}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Tổng cộng ${total} đơn đặt phòng`,
            className: 'px-6 py-4',
          }}
          scroll={{ x: 1000 }}
          locale={{ emptyText: 'Chưa có dữ liệu đặt phòng nào phù hợp.' }}
        />
      </Card>

      {/* Drawer xem chi tiết đơn đặt phòng */}
      <Drawer
        title={
          <div className="flex items-center justify-between pr-4">
            <span className="font-extrabold text-slate-800 text-base">
              Chi Tiết Đơn Đặt #{selectedBooking?.booking_code}
            </span>
            {selectedBooking && (
              <Tag color={STATUS_CONFIG[selectedBooking.booking_status]?.color} className="rounded-full font-bold">
                {STATUS_CONFIG[selectedBooking.booking_status]?.label}
              </Tag>
            )}
          </div>
        }
        placement="right"
        width={480}
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
      >
        {selectedBooking && (
          <div className="space-y-6 text-sm">
            {/* Customer info */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Thông tin khách hàng</h4>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Họ và tên:</span>
                  <span className="font-bold text-slate-800">{selectedBooking.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Số điện thoại:</span>
                  <span className="font-bold text-slate-800">{selectedBooking.customer_phone}</span>
                </div>
              </div>
            </div>

            {/* Room info */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Phòng & Thời gian</h4>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Số phòng:</span>
                  <span className="font-extrabold text-blue-600 text-base">Phòng {selectedBooking.room_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hạng phòng:</span>
                  <span className="font-bold text-amber-600">{selectedBooking.type_name}</span>
                </div>
                <Divider style={{ margin: '8px 0' }} />
                <div className="flex justify-between">
                  <span className="text-slate-500">Ngày nhận phòng:</span>
                  <span className="font-bold text-slate-800">
                    {dayjs(selectedBooking.check_in_date).format('DD/MM/YYYY')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ngày trả phòng:</span>
                  <span className="font-bold text-slate-800">
                    {dayjs(selectedBooking.check_out_date).format('DD/MM/YYYY')}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment info */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Thanh toán & Đặt cọc</h4>
              <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/80 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Hình thức:</span>
                  <span className="font-bold text-slate-800">
                    {selectedBooking.payment_method === 'full_transfer' ? 'Chuyển khoản 100%' :
                     selectedBooking.payment_method === 'deposit_hotel' ? 'Cọc trước 30% (Nhận phòng trả còn lại)' :
                     (selectedBooking.payment_method || 'Thanh toán tại khách sạn')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Tổng tiền phòng:</span>
                  <span className="font-black text-lg text-emerald-600">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedBooking.total_amount || 0)}
                  </span>
                </div>
                {selectedBooking.deposit_amount ? (
                  <div className="flex justify-between items-center pt-2 border-t border-emerald-200/60 text-xs">
                    <span className="text-amber-800 font-semibold">Số tiền cọc quy định (30%):</span>
                    <span className="font-bold text-amber-700 text-sm">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedBooking.deposit_amount)}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Bill chuyển khoản khách upload */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                <span>Ảnh bill chuyển khoản của khách</span>
                {selectedBooking.bill_image_url ? (
                  <Tag color="success" className="m-0 rounded-full font-semibold">Đã có bill</Tag>
                ) : (
                  <Tag color="default" className="m-0 rounded-full">Chưa tải bill</Tag>
                )}
              </h4>
              {selectedBooking.bill_image_url ? (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-center">
                  <Image
                    src={selectedBooking.bill_image_url}
                    alt="Bill thanh toán"
                    className="rounded-xl object-contain max-h-72 mx-auto shadow-sm"
                    fallback="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 200 150'><rect width='100%' height='100%' fill='%23f1f5f9'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='12' fill='%2394a3b8'>Lỗi hiển thị bill</text></svg>"
                  />
                  <div className="text-[11px] text-slate-400 mt-2">Bấm vào ảnh trên để phóng to kiểm tra chi tiết giao dịch</div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl border border-dashed border-slate-300 text-center text-slate-400 text-xs bg-slate-50/50">
                  <FileImageOutlined className="text-3xl text-slate-300 mb-2 block" />
                  Khách hàng chưa tải lên hình ảnh bill thanh toán
                </div>
              )}
            </div>

            {/* Actions in drawer */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Chuyển trạng thái nhanh</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  block
                  disabled={selectedBooking.booking_status === 'CheckedIn'}
                  className="bg-emerald-50 text-emerald-700 border-emerald-300 font-bold rounded-xl"
                  onClick={() => handleUpdateStatus(selectedBooking.id, 'CheckedIn')}
                >
                  ✓ Check-in nhận phòng
                </Button>
                <Button
                  block
                  disabled={selectedBooking.booking_status === 'CheckedOut'}
                  className="bg-blue-50 text-blue-700 border-blue-300 font-bold rounded-xl"
                  onClick={() => handleUpdateStatus(selectedBooking.id, 'CheckedOut')}
                >
                  ➔ Check-out trả phòng
                </Button>
              </div>

              <div className="pt-2">
                <Popconfirm
                  title="Xóa hẳn đơn đặt phòng này khỏi hệ thống?"
                  description="Thao tác này sẽ xóa vĩnh viễn và không thể khôi phục."
                  onConfirm={() => handleDeleteBooking(selectedBooking.id)}
                  okText="Xác nhận xóa"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                >
                  <Button block danger className="rounded-xl font-bold">
                    Xóa vĩnh viễn đơn đặt phòng
                  </Button>
                </Popconfirm>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

export default AdminBookings;
