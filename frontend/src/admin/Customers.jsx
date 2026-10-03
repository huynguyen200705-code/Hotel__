import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Tag, Space, message, Upload, Modal, Form, Popconfirm, Tooltip } from 'antd';
import { UploadOutlined, DownloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import * as XLSX from 'xlsx';

const { Option } = Select;

const TIER_COLORS = {
  'Thường': { color: 'default', label: 'Thường' },
  'Bạc': { color: 'blue', label: '🥈 Bạc' },
  'Vàng': { color: 'gold', label: '🥇 Vàng' },
  'Kim Cương': { color: 'purple', label: '💎 Kim Cương' },
};

function Customers() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchCustomers = async (page = 1, limit = 10, search = searchText, tier = tierFilter) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/customers`, {
        params: { page, limit, search, tier }
      });
      setData(res.data.data);
      setPagination(prev => ({ ...prev, current: page, total: res.data.total }));
    } catch (error) {
      message.error('Không thể tải dữ liệu khách hàng. Kiểm tra server backend!');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleTableChange = (pag) => {
    fetchCustomers(pag.current, pag.pageSize);
  };

  const handleSearch = (value) => {
    setSearchText(value);
    fetchCustomers(1, pagination.pageSize, value, tierFilter);
  };

  const handleFilterTier = (value) => {
    const tier = value || '';
    setTierFilter(tier);
    fetchCustomers(1, pagination.pageSize, searchText, tier);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/customers/${id}`);
      message.success('Đã xóa khách hàng thành công!');
      fetchCustomers(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('Lỗi khi xóa khách hàng!');
    }
  };

  const handleExport = () => {
    if (data.length === 0) {
      message.warning('Không có dữ liệu để xuất!');
      return;
    }
    const ws = XLSX.utils.json_to_sheet(data.map(d => ({
      'Mã KH': d.customer_code,
      'Họ và Tên': d.full_name,
      'SĐT': d.phone,
      'Email': d.email,
      'CMND/CCCD': d.id_card,
      'Hạng thẻ': d.membership_tier,
      'Tổng chi tiêu (VND)': d.total_spent,
      'Điểm tích lũy': d.points,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh Sach KH');
    XLSX.writeFile(wb, 'DanhSachKhachHang.xlsx');
    message.success('Xuất file Excel thành công!');
  };

  const handleImport = (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const binaryData = e.target.result;
        const workbook = XLSX.read(binaryData, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const parsedData = XLSX.utils.sheet_to_json(sheet);

        if (parsedData.length === 0) {
          message.warning('File Excel không có dữ liệu!');
          return;
        }

        const formatted = parsedData.map(row => ({
          full_name: row['Họ và Tên'] || row.full_name || '',
          phone: String(row['SĐT'] || row.phone || ''),
          email: row['Email'] || row.email || '',
        })).filter(r => r.full_name);

        await axios.post('/api/customers/import', formatted);
        message.success(`Import thành công ${formatted.length} khách hàng!`);
        fetchCustomers();
      } catch (error) {
        message.error('Lỗi khi import file Excel. Vui lòng kiểm tra định dạng file!');
      }
    };
    reader.readAsBinaryString(file);
    return false;
  };

  const openModal = (record = null) => {
    setIsModalOpen(true);
    if (record) {
      setEditingId(record.id);
      form.setFieldsValue({
        full_name: record.full_name,
        phone: record.phone,
        email: record.email,
        id_card: record.id_card,
        membership_tier: record.membership_tier,
      });
    } else {
      setEditingId(null);
      form.resetFields();
    }
  };

  const onFinishModal = async (values) => {
    setModalLoading(true);
    try {
      if (editingId) {
        await axios.put(`/api/customers/${editingId}`, values);
        message.success('Cập nhật thông tin khách hàng thành công!');
      } else {
        await axios.post('/api/customers', values);
        message.success('Thêm khách hàng mới thành công!');
      }
      setIsModalOpen(false);
      fetchCustomers(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('Có lỗi xảy ra. Vui lòng thử lại!');
    }
    setModalLoading(false);
  };

  const columns = [
    {
      title: 'Mã KH',
      dataIndex: 'customer_code',
      key: 'customer_code',
      render: (val) => <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{val}</span>
    },
    {
      title: 'Họ và Tên',
      dataIndex: 'full_name',
      key: 'full_name',
      render: (val, record) => (
        <div>
          <p className="font-semibold text-gray-800">{val}</p>
          <p className="text-xs text-gray-400">{record.email || '—'}</p>
        </div>
      )
    },
    { title: 'SĐT', dataIndex: 'phone', key: 'phone', render: val => val || '—' },
    {
      title: 'Hạng thẻ',
      dataIndex: 'membership_tier',
      key: 'membership_tier',
      render: (tier) => {
        const t = TIER_COLORS[tier] || TIER_COLORS['Thường'];
        return <Tag color={t.color} style={{ borderRadius: 12, padding: '2px 10px', fontWeight: 600 }}>{t.label}</Tag>;
      }
    },
    {
      title: 'Tổng chi tiêu',
      dataIndex: 'total_spent',
      key: 'total_spent',
      render: (val) => (
        <span className="font-semibold text-green-600">
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)}
        </span>
      )
    },
    { title: 'Điểm', dataIndex: 'points', key: 'points', render: v => <span className="text-blue-500 font-semibold">{v || 0}</span> },
    {
      title: 'Hành động',
      key: 'action',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Chỉnh sửa">
            <Button type="text" icon={<EditOutlined />} onClick={() => openModal(record)} className="text-blue-600 hover:bg-blue-50" />
          </Tooltip>
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc muốn xóa khách hàng này không?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Xóa">
              <Button type="text" danger icon={<DeleteOutlined />} className="hover:bg-red-50" />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Quản Lý Khách Hàng</h1>
          <p className="text-gray-400 mt-1">Tổng cộng: <strong className="text-blue-600">{pagination.total}</strong> khách hàng</p>
        </div>
        <Space wrap>
          <Tooltip title="Làm mới dữ liệu">
            <Button icon={<ReloadOutlined />} onClick={() => fetchCustomers()} />
          </Tooltip>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>Xuất Excel</Button>
          <Upload beforeUpload={handleImport} showUploadList={false} accept=".xlsx,.xls">
            <Button icon={<UploadOutlined />}>Nhập Excel</Button>
          </Upload>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()} style={{ background: '#1677ff' }}>
            Thêm Khách Hàng
          </Button>
        </Space>
      </div>

      <div className="bg-gray-50 p-4 rounded-xl mb-6 flex flex-wrap gap-3 items-center">
        <Input.Search
          placeholder="Tìm kiếm theo tên, SĐT, Mã KH..."
          onSearch={handleSearch}
          onChange={(e) => !e.target.value && handleSearch('')}
          style={{ width: 300 }}
          allowClear
          prefix={<SearchOutlined className="text-gray-400" />}
        />
        <Select
          placeholder="Lọc theo hạng thẻ"
          style={{ width: 180 }}
          onChange={handleFilterTier}
          allowClear
        >
          <Option value="Thường">Thường</Option>
          <Option value="Bạc">🥈 Bạc</Option>
          <Option value="Vàng">🥇 Vàng</Option>
          <Option value="Kim Cương">💎 Kim Cương</Option>
        </Select>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} trên ${total} khách hàng`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 900 }}
        className="rounded-xl overflow-hidden border border-gray-100"
        rowClassName="hover:bg-blue-50 transition-colors"
      />

      <Modal
        title={
          <div className="flex items-center gap-2 text-lg font-bold">
            {editingId ? <EditOutlined className="text-blue-500" /> : <PlusOutlined className="text-green-500" />}
            {editingId ? 'Cập nhật Thông Tin Khách Hàng' : 'Thêm Khách Hàng Mới'}
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
        width={520}
      >
        <Form form={form} layout="vertical" onFinish={onFinishModal} className="mt-4">
          <Form.Item name="full_name" label="Họ và Tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}>
            <Input placeholder="Nguyễn Văn A" size="large" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="phone" label="Số Điện Thoại" rules={[{ required: true, message: 'Vui lòng nhập SĐT!' }]}>
              <Input placeholder="090xxxxxxx" size="large" />
            </Form.Item>
            <Form.Item name="id_card" label="CMND/CCCD">
              <Input placeholder="0123456789" size="large" />
            </Form.Item>
          </div>
          <Form.Item name="email" label="Email">
            <Input type="email" placeholder="example@email.com" size="large" />
          </Form.Item>
          {editingId && (
            <Form.Item name="membership_tier" label="Hạng Thẻ Thành Viên">
              <Select size="large">
                <Option value="Thường">Thường</Option>
                <Option value="Bạc">🥈 Bạc</Option>
                <Option value="Vàng">🥇 Vàng</Option>
                <Option value="Kim Cương">💎 Kim Cương</Option>
              </Select>
            </Form.Item>
          )}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <Button onClick={() => setIsModalOpen(false)} size="large">Hủy bỏ</Button>
            <Button type="primary" htmlType="submit" size="large" loading={modalLoading} style={{ background: '#1677ff', minWidth: 120 }}>
              {editingId ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

export default Customers;
