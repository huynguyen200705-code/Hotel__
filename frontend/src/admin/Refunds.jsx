import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, message, Modal } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

function Refunds() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/refunds');
      setRefunds(res.data);
    } catch (err) {
      message.error('Lỗi khi tải danh sách hoàn tiền');
    }
    setLoading(false);
  };

  const handleCompleteRefund = (record) => {
    Modal.confirm({
      title: 'Xác nhận Đã Hoàn Tiền',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Bạn đã chuyển khoản thành công số tiền <strong>{record.refund_amount?.toLocaleString('vi-VN')}đ</strong> chưa?</p>
          <ul>
            <li>Ngân hàng: {record.bank_name}</li>
            <li>STK: {record.account_number}</li>
            <li>Chủ thẻ: {record.account_name}</li>
          </ul>
          <p style={{ color: 'red', marginTop: 10 }}>Hành động này sẽ Đóng yêu cầu và cập nhật đơn về trạng thái Đã Hủy.</p>
        </div>
      ),
      okText: 'Xác nhận Đã Chuyển',
      cancelText: 'Chưa chuyển',
      onOk: async () => {
        try {
          await axios.put(`/api/refunds/${record.id}/complete`);
          message.success('Cập nhật trạng thái hoàn tiền thành công!');
          fetchRefunds();
        } catch (err) {
          message.error(err.response?.data?.message || 'Lỗi khi cập nhật hoàn tiền');
        }
      }
    });
  };

  const columns = [
    {
      title: 'Mã đơn',
      dataIndex: 'booking_code',
      key: 'booking_code',
      render: (text) => <span className="font-bold text-blue-600">{text}</span>
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      render: (_, record) => (
        <div>
          <div className="font-semibold">{record.customer_name}</div>
          <div className="text-xs text-gray-500">{record.phone}</div>
        </div>
      )
    },
    {
      title: 'Thông tin Ngân hàng (Khách)',
      key: 'bank_info',
      render: (_, record) => (
        <div className="text-sm">
          <div><span className="font-medium">NH:</span> {record.bank_name}</div>
          <div><span className="font-medium">STK:</span> <span className="bg-gray-100 px-1 rounded">{record.account_number}</span></div>
          <div><span className="font-medium">Tên:</span> {record.account_name}</div>
        </div>
      )
    },
    {
      title: 'Số tiền hoàn',
      dataIndex: 'refund_amount',
      key: 'refund_amount',
      render: (val) => <span className="font-bold text-red-500">{val?.toLocaleString('vi-VN')} đ</span>
    },
    {
      title: 'Lý do',
      dataIndex: 'reason',
      key: 'reason',
      render: (text) => <span className="text-xs text-gray-500 italic">{text || 'Không có'}</span>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        if (status === 'Completed') return <Tag color="green">Đã hoàn tiền</Tag>;
        if (status === 'Pending') return <Tag color="orange">Đang chờ xử lý</Tag>;
        return <Tag color="red">{status}</Tag>;
      }
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space>
          {record.status === 'Pending' && (
            <Button 
              type="primary" 
              size="small"
              className="bg-green-600"
              icon={<CheckCircleOutlined />}
              onClick={() => handleCompleteRefund(record)}
            >
              Xác nhận CK
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Yêu Cầu Hoàn Tiền (Refunds)</h1>
        <p className="text-gray-500">Quản lý các yêu cầu hủy phòng và hoàn tiền từ khách hàng.</p>
      </div>

      <Table 
        columns={columns} 
        dataSource={refunds} 
        rowKey="id" 
        loading={loading}
        className="bg-white shadow-sm rounded-lg overflow-hidden"
      />
    </div>
  );
}

export default Refunds;
