import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  DashboardOutlined,
  AppstoreOutlined,
  UserOutlined,
  RobotOutlined,
  HomeOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  CalendarOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{"fullName":"Admin","role":"Admin"}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const isAdmin = user.role === 'Admin';

  const menuItems = [
    {
      key: '/admin/dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/admin/dashboard">Tổng quan</Link>,
    },
    {
      key: '/admin/bookings',
      icon: <CalendarOutlined />,
      label: <Link to="/admin/bookings">Quản lý đặt phòng</Link>,
    },
    {
      key: '/admin/rooms',
      icon: <AppstoreOutlined />,
      label: <Link to="/admin/rooms">Quản lý phòng</Link>,
    },
    {
      key: '/admin/customers',
      icon: <UserOutlined />,
      label: <Link to="/admin/customers">Khách hàng (CRM)</Link>,
    },
    // Chỉ Admin mới có quyền truy cập Giá AI và Phân quyền nội bộ
    ...(isAdmin ? [
      {
        key: '/admin/ai-pricing',
        icon: <RobotOutlined />,
        label: <Link to="/admin/ai-pricing">Giá AI Đề Xuất</Link>,
      },
      {
        key: '/admin/roles',
        icon: <SafetyCertificateOutlined />,
        label: <Link to="/admin/roles">Phân quyền & Nhân sự</Link>,
      },
    ] : []),
    { type: 'divider' },
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <Link to="/">Về trang khách hàng</Link>,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
    },
  ];

  const onMenuClick = ({ key }) => {
    if (key === 'logout') handleLogout();
  };

  return (
    <Layout className="min-h-screen" style={{ background: '#f1f5f9' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        width={250}
        theme="dark"
        style={{
          position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100, overflowY: 'auto',
          background: '#0f172a',
          boxShadow: '4px 0 20px rgba(0,0,0,0.15)'
        }}
      >
        <div
          className="h-16 flex items-center justify-center font-black border-b border-slate-800"
          style={{
            fontSize: collapsed ? 15 : 20,
            letterSpacing: collapsed ? 1 : 2,
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            color: '#f8fafc'
          }}
        >
          {collapsed ? '🏨' : '🏨 LUXE CRM'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={onMenuClick}
          style={{
            background: 'transparent',
            borderRight: 0,
            marginTop: 12,
            fontSize: 14,
            fontWeight: 500
          }}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 250, transition: 'all 0.2s ease', background: '#f1f5f9' }}>
        <Header
          className="shadow-sm flex items-center justify-between"
          style={{
            padding: '0 28px',
            position: 'sticky',
            top: 0,
            zIndex: 99,
            height: 64,
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0'
          }}
        >
          <div
            className="cursor-pointer text-xl text-slate-600 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-slate-100"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>

          <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-md shrink-0">
              {user.fullName?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="text-left leading-tight min-w-[90px]">
              <p className="font-bold text-slate-800 text-sm m-0 tracking-tight">{user.fullName || 'Quản trị viên'}</p>
              <span className="inline-block mt-0.5 text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                {user.role === 'Admin' ? 'Quản trị viên' : user.role === 'Staff' ? 'Nhân viên' : user.role}
              </span>
            </div>
            <div className="h-6 w-[1px] bg-slate-200 mx-1" />
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all flex items-center justify-center"
              title="Đăng xuất"
            >
              <LogoutOutlined style={{ fontSize: 16 }} />
            </button>
          </div>
        </Header>

        <Content style={{ margin: '24px 28px', minHeight: 280 }}>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 min-h-full">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default AdminLayout;
