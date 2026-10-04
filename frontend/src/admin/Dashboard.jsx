import React, { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, Spin, Table, Tag } from 'antd';
import {
  ArrowUpOutlined,
  UserOutlined,
  HomeOutlined,
  DollarOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const statusColors = {
  Confirmed: 'blue',
  CheckedIn: 'green',
  CheckedOut: 'default',
  Cancelled: 'red',
};

const statusLabels = {
  Confirmed: 'Đã xác nhận',
  CheckedIn: 'Đã nhận phòng',
  CheckedOut: 'Đã trả phòng',
  Cancelled: 'Đã hủy',
};

function Dashboard() {
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [bookingsRes, customersRes] = await Promise.all([
          axios.get('/api/bookings'),
          axios.get('/api/customers?limit=1'),
        ]);
        setBookings(bookingsRes.data);
        setCustomers(customersRes.data.total);
      } catch (err) {
        console.error('Lỗi tải dashboard, kiểm tra backend đã chạy chưa:', err.message);
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );
  }

  const totalRevenue = bookings.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);
  const activeBookings = bookings.filter(b => b.booking_status === 'Confirmed' || b.booking_status === 'CheckedIn').length;

  const recentBookings = bookings.slice(0, 5);

  const bookingColumns = [
    {
      title: 'Mã đặt phòng',
      dataIndex: 'booking_code',
      key: 'booking_code',
      render: v => <span className="font-mono font-bold text-blue-600">{v}</span>
    },
    { title: 'Khách hàng', dataIndex: 'customer_name', key: 'customer_name' },
    { title: 'Phòng', dataIndex: 'room_number', key: 'room_number' },
    {
      title: 'Nhận phòng',
      dataIndex: 'check_in_date',
      key: 'check_in_date',
      render: v => v ? new Date(v).toLocaleDateString('vi-VN') : '-'
    },
    {
      title: 'Trả phòng',
      dataIndex: 'check_out_date',
      key: 'check_out_date',
      render: v => v ? new Date(v).toLocaleDateString('vi-VN') : '-'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'booking_status',
      key: 'booking_status',
      render: v => <Tag color={statusColors[v] || 'default'}>{statusLabels[v] || v}</Tag>
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: v => (
        <span className="font-semibold text-green-600">
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v)}
        </span>
      )
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Tổng Quan Hệ Thống</h1>
        <p className="text-slate-500 font-medium mt-1">Chào mừng trở lại! Đây là tình hình kinh doanh hôm nay.</p>
      </div>

      {/* Stats Cards */}
      <Row gutter={[20, 20]} className="mb-8">
        <Col xs={24} sm={8}>
          <div
            className="rounded-2xl p-6 shadow-md hover:shadow-lg transition-all text-white"
            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-indigo-100 font-semibold text-sm">Tổng Doanh Thu</span>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl backdrop-blur-sm">
                <DollarOutlined />
              </div>
            </div>
            <div className="text-3xl font-extrabold tracking-tight">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalRevenue)}
            </div>
            <div className="mt-4 pt-3 border-t border-white/15 text-indigo-100 text-xs font-medium flex items-center gap-1.5">
              <ArrowUpOutlined className="text-emerald-300" />
              <span>Từ tất cả các đơn đặt phòng</span>
            </div>
          </div>
        </Col>

        <Col xs={24} sm={8}>
          <div
            className="rounded-2xl p-6 shadow-md hover:shadow-lg transition-all text-white"
            style={{ background: 'linear-gradient(135deg, #059669 0%, #064e3b 100%)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-emerald-100 font-semibold text-sm">Tổng Khách Hàng</span>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl backdrop-blur-sm">
                <UserOutlined />
              </div>
            </div>
            <div className="text-3xl font-extrabold tracking-tight">
              {customers.toLocaleString()}
            </div>
            <div className="mt-4 pt-3 border-t border-white/15 text-emerald-100 text-xs font-medium flex items-center gap-1.5">
              <ArrowUpOutlined className="text-emerald-300" />
              <span>Đang quản lý trong CRM</span>
            </div>
          </div>
        </Col>

        <Col xs={24} sm={8}>
          <div
            className="rounded-2xl p-6 shadow-md hover:shadow-lg transition-all text-white"
            style={{ background: 'linear-gradient(135deg, #e11d48 0%, #9f1239 100%)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-rose-100 font-semibold text-sm">Đơn Đang Hoạt Động</span>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl backdrop-blur-sm">
                <HomeOutlined />
              </div>
            </div>
            <div className="text-3xl font-extrabold tracking-tight">
              {activeBookings.toLocaleString()}
            </div>
            <div className="mt-4 pt-3 border-t border-white/15 text-rose-100 text-xs font-medium flex items-center gap-1.5">
              <CalendarOutlined className="text-rose-200" />
              <span>Đã xác nhận + Đã nhận phòng</span>
            </div>
          </div>
        </Col>
      </Row>

      {/* Revenue Wave Chart */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Biểu Đồ Doanh Thu (7 Ngày Qua)</h2>
        <Card className="rounded-2xl border border-slate-200/80 shadow-sm p-4">
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={[
                  { name: 'T2', revenue: 4200000 },
                  { name: 'T3', revenue: 3800000 },
                  { name: 'T4', revenue: 6500000 },
                  { name: 'T5', revenue: 5100000 },
                  { name: 'T6', revenue: 9800000 },
                  { name: 'T7', revenue: 14500000 },
                  { name: 'CN', revenue: 16200000 },
                ]}
                margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} dy={10} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af' }}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                />
                <RechartsTooltip 
                  formatter={(value) => [new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value), 'Doanh thu']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#667eea" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  activeDot={{ r: 8, strokeWidth: 0, fill: '#764ba2' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent Bookings */}
      <div>
        <h2 className="text-xl font-bold text-gray-700 mb-4">Đơn Đặt Phòng Gần Đây</h2>
        <Table
          columns={bookingColumns}
          dataSource={recentBookings}
          rowKey="id"
          pagination={false}
          className="rounded-xl overflow-hidden border border-gray-100"
          scroll={{ x: 700 }}
          locale={{ emptyText: 'Chưa có đơn đặt phòng nào. Kết nối database để xem dữ liệu!' }}
        />
      </div>
    </div>
  );
}

export default Dashboard;
