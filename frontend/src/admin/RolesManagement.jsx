import React, { useState, useEffect } from 'react';
import {
  Table, Tag, Button, Space, Input, Select, Card, Row, Col,
  Modal, Form, Popconfirm, message, Switch, Tooltip, Alert
} from 'antd';
import {
  UserOutlined, LockOutlined, PlusOutlined, DeleteOutlined,
  EditOutlined, SafetyCertificateOutlined, ReloadOutlined,
  CheckCircleOutlined, StopOutlined, KeyOutlined, TeamOutlined,
  EyeOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

// Danh sách các quyền & menu mà từng role được phép truy cập
const PERMISSIONS_MATRIX = [
  {
    feature: 'Tổng quan (Dashboard)',
    desc: 'Xem doanh thu tổng, biểu đồ tăng trưởng, thống kê chung',
    admin: true,
    staff: true,
  },
  {
    feature: 'Quản lý đặt phòng',
    desc: 'Xem danh sách, Check-in nhận phòng, Check-out trả phòng, Hủy đơn',
    admin: true,
    staff: true,
  },
  {
    feature: 'Quản lý phòng nghỉ',
    desc: 'Xem trạng thái phòng, đổi phòng sang bảo trì hoặc sẵn sàng',
    admin: true,
    staff: true,
  },
  {
    feature: 'Thêm / Xóa / Đổi giá phòng',
    desc: 'Quyền sửa đổi cấu trúc giá cơ bản, xóa phòng, tạo phòng mới',
    admin: true,
    staff: false, // Staff không được sửa giá gốc
  },
  {
    feature: 'Khách hàng (CRM)',
    desc: 'Tra cứu danh sách khách hàng, điểm tích lũy và lịch sử giao dịch',
    admin: true,
    staff: true,
  },
  {
    feature: 'Định giá AI (AI Pricing)',
    desc: 'Sử dụng AI dự báo và tự động điều chỉnh giá phòng toàn khách sạn',
    admin: true,
    staff: false, // Chỉ Admin
  },
  {
    feature: 'Phân quyền & Tài khoản',
    desc: 'Tạo tài khoản nhân viên, cấp quyền truy cập, khóa tài khoản',
    admin: true,
    staff: false, // Chỉ Admin
  },
];

function RolesManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/auth/users');
      setUsers(res.data || []);
    } catch (err) {
      console.error(err);
      message.error('Không thể tải danh sách tài khoản!');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record) => {
    setEditingUser(record);
    form.setFieldsValue({
      full_name: record.full_name,
      role: record.role,
      status: record.status === 1 || record.status === true,
      password: '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingUser) {
        await axios.put(`/api/auth/users/${editingUser.id}`, values);
        message.success('Cập nhật tài khoản thành công!');
      } else {
        await axios.post('/api/auth/users', values);
        message.success('Thêm tài khoản thành công!');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      if (err.response) {
        message.error(err.response.data?.message || 'Có lỗi xảy ra!');
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/auth/users/${id}`);
      message.success('Đã xóa tài khoản thành công!');
      fetchUsers();
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể xóa tài khoản này!');
    }
  };

  const userColumns = [
    {
      title: 'Tài khoản đăng nhập',
      dataIndex: 'username',
      key: 'username',
      width: 220,
      render: (val, record) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="font-bold text-slate-800 font-mono text-sm">{val}</span>
          {record.id === 1 && (
            <Tag color="gold" className="text-[10px] font-bold m-0">Quản trị viên gốc</Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Họ và tên nhân sự',
      dataIndex: 'full_name',
      key: 'full_name',
      width: 200,
      render: (val) => <span className="font-semibold text-slate-800 whitespace-nowrap">{val}</span>,
    },
    {
      title: 'Vai trò (Role)',
      dataIndex: 'role',
      key: 'role',
      width: 220,
      render: (role) => (
        <Tag
          color={role === 'Admin' ? 'purple' : 'blue'}
          className="px-3 py-1 rounded-full font-bold text-xs whitespace-nowrap m-0"
        >
          {role === 'Admin' ? '👑 Quản trị viên (Admin)' : '👔 Nhân viên (Staff)'}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái hoạt động',
      dataIndex: 'status',
      key: 'status',
      width: 180,
      render: (st) => (
        st === 1 || st === true ? (
          <Tag color="success" icon={<CheckCircleOutlined />} className="rounded-full px-2.5 py-0.5 whitespace-nowrap font-medium">
            Đang hoạt động
          </Tag>
        ) : (
          <Tag color="error" icon={<StopOutlined />} className="rounded-full px-2.5 py-0.5 whitespace-nowrap font-medium">
            Đã khóa
          </Tag>
        )
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      align: 'center',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenEdit(record)}
            className="rounded-lg text-slate-600 hover:text-blue-600"
            title="Chỉnh sửa"
          />
          {record.id !== 1 && (
            <Popconfirm
              title="Xóa tài khoản này?"
              description="Người dùng này sẽ không thể đăng nhập vào hệ thống nữa."
              onConfirm={() => handleDelete(record.id)}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                className="rounded-lg"
                title="Xóa tài khoản"
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight m-0 flex items-center gap-2">
            <SafetyCertificateOutlined className="text-blue-600" />
            Phân Quyền & Tài Khoản Nội Bộ
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Quản lý danh sách tài khoản nhân sự và quy định quyền hạn truy cập của từng vai trò.
          </p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchUsers} className="rounded-xl font-semibold">
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenAdd}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 font-bold shadow-sm"
          >
            Thêm tài khoản mới
          </Button>
        </Space>
      </div>

      {/* Role Comparison Banner */}
      <Alert
        type="info"
        showIcon
        message={<span className="font-bold text-slate-800">Quy định phân quyền truy cập hệ thống</span>}
        description={
          <div className="text-xs text-slate-600 space-y-1 mt-1">
            <div>• <b>Quản trị viên (Admin)</b>: Toàn quyền truy cập tất cả chức năng (Tổng quan, Đặt phòng, Phòng nghỉ, Định giá AI, CRM khách hàng, Phân quyền nhân sự).</div>
            <div>• <b>Nhân viên lễ tân (Staff)</b>: Được phép quản lý <b>Đặt phòng (Check-in/Check-out)</b>, xem <b>Phòng nghỉ</b>, tra cứu <b>Khách hàng CRM</b>; nhưng <b>không được đổi giá phòng, không được cấu hình Giá AI và không được xem trang Phân quyền</b>.</div>
          </div>
        }
        className="rounded-2xl border-blue-200 bg-blue-50/50"
      />

      {/* 1. Danh Sách Tài Khoản Nội Bộ (Full Width) */}
      <Card
        title={
          <span className="font-bold text-slate-800 text-base flex items-center gap-2">
            <TeamOutlined className="text-blue-600" /> Danh Sách Tài Khoản Nội Bộ (Admin & Staff)
          </span>
        }
        className="rounded-2xl border-slate-200/80 shadow-sm overflow-hidden"
        bodyStyle={{ padding: 0 }}
      >
        <Table
          columns={userColumns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 750 }}
          locale={{ emptyText: 'Chưa có tài khoản nào' }}
        />
      </Card>

      {/* 2. Ma Trận Phân Quyền Chi Tiết (Full Width) */}
      <Card
        title={
          <span className="font-bold text-slate-800 text-base flex items-center gap-2">
            <KeyOutlined className="text-amber-500" /> Ma Trận Phân Quyền Chi Tiết Hệ Thống
          </span>
        }
        className="rounded-2xl border-slate-200/80 shadow-sm"
        bodyStyle={{ padding: '20px 24px' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PERMISSIONS_MATRIX.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-slate-100/80 transition-colors flex items-center justify-between gap-4"
            >
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-slate-800 text-sm m-0 mb-1">{item.feature}</h4>
                <p className="text-xs text-slate-500 m-0 leading-relaxed">
                  {item.desc}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Tag color="purple" className="px-2.5 py-1 text-xs font-bold rounded-lg m-0">
                  Admin: Có
                </Tag>
                {item.staff ? (
                  <Tag color="green" className="px-2.5 py-1 text-xs font-bold rounded-lg m-0">
                    Nhân viên: Có
                  </Tag>
                ) : (
                  <Tag color="default" className="px-2.5 py-1 text-xs font-semibold text-slate-400 bg-slate-200/70 rounded-lg m-0">
                    Nhân viên: ✕
                  </Tag>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Modal Add / Edit User */}
      <Modal
        title={editingUser ? `Chỉnh sửa tài khoản: ${editingUser.username}` : 'Tạo tài khoản nhân viên / admin mới'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        okText={editingUser ? 'Lưu thay đổi' : 'Tạo tài khoản'}
        cancelText="Hủy"
        centered
        className="rounded-2xl"
      >
        <Form form={form} layout="vertical" className="pt-2">
          {!editingUser && (
            <Form.Item
              name="username"
              label="Tên đăng nhập"
              rules={[
                { required: true, message: 'Vui lòng nhập tên đăng nhập!' },
                { min: 3, message: 'Tối thiểu 3 ký tự' }
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="VD: staff2, receptionist" className="rounded-xl" />
            </Form.Item>
          )}

          <Form.Item
            name="full_name"
            label="Họ và tên nhân sự"
            rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
          >
            <Input placeholder="VD: Nguyễn Văn Nam" className="rounded-xl" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Vai trò (Chức vụ)"
            initialValue="Staff"
            rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
          >
            <Select className="rounded-xl">
              <Option value="Staff">Nhân viên lễ tân (Staff) - Hạn chế tính năng nhạy cảm</Option>
              <Option value="Admin">Quản trị viên (Admin) - Toàn quyền quản trị</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="password"
            label={editingUser ? 'Mật khẩu mới (Để trống nếu giữ nguyên)' : 'Mật khẩu đăng nhập'}
            rules={[
              { required: !editingUser, message: 'Vui lòng nhập mật khẩu!' },
              { min: 6, message: 'Mật khẩu phải từ 6 ký tự trở lên!' }
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu..." className="rounded-xl" />
          </Form.Item>

          {editingUser && editingUser.id !== 1 && (
            <Form.Item name="status" label="Trạng thái hoạt động" valuePropName="checked">
              <Switch checkedChildren="Hoạt động" unCheckedChildren="Khóa tài khoản" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}

export default RolesManagement;
