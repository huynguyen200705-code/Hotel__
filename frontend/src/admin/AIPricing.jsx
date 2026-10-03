import React, { useState, useEffect } from 'react';
import { Table, Button, message, Tag, Card, Statistic, Row, Col, Spin } from 'antd';
import { 
  RobotOutlined, 
  CheckCircleOutlined, 
  InfoCircleOutlined, 
  ArrowUpOutlined, 
  ArrowDownOutlined, 
  SyncOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import axios from 'axios';

function AIPricing() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/ai/suggest-price');
      const rawData = res.data;
      if (rawData && rawData.suggestions) {
        rawData.suggestions = rawData.suggestions.map(s => {
          const isApplied = Math.abs(Number(s.current_price) - Number(s.suggested_price)) < 1;
          return {
            ...s,
            is_applied: isApplied
          };
        });
        rawData.pending_count = rawData.suggestions.filter(s => !s.is_applied).length;
      }
      setData(rawData);
    } catch (error) {
      message.error('Không thể tải đề xuất giá từ AI. Kiểm tra server!');
    }
    setLoading(false);
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      await axios.post('/api/ai/apply-price', { suggestions: data.suggestions });
      message.success('✅ Đã áp dụng giá mới thành công cho tất cả phòng!');
      fetchSuggestions();
    } catch (error) {
      message.error('Lỗi khi áp dụng giá mới!');
    }
    setApplying(false);
  };

  const formatVND = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const columns = [
    {
      title: 'Số Phòng',
      dataIndex: 'room_number',
      key: 'room_number',
      width: 110,
      render: (v) => <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2.5 py-1 rounded text-sm">{v}</span>
    },
    { 
      title: 'Loại Phòng', 
      dataIndex: 'type_name', 
      key: 'type_name',
      render: (v) => <span className="font-medium text-gray-700">{v}</span>
    },
    {
      title: 'Giá Gốc Niêm Yết',
      dataIndex: 'base_price',
      key: 'base_price',
      render: (val) => (
        <span className="text-gray-500 font-medium">
          {formatVND(val)}
        </span>
      )
    },
    {
      title: 'Giá Đang Bán',
      dataIndex: 'current_price',
      key: 'current_price',
      render: (val, record) => {
        const isOptimal = record.is_applied;
        return (
          <span className={`font-semibold ${isOptimal ? 'text-gray-700' : 'text-amber-600 line-through'}`}>
            {formatVND(val)}
          </span>
        );
      }
    },
    {
      title: 'Giá AI Đề Xuất',
      dataIndex: 'suggested_price',
      key: 'suggested_price',
      render: (val) => (
        <span className="font-bold text-blue-600 text-base">
          {formatVND(val)}
        </span>
      )
    },
    {
      title: 'So với giá gốc',
      dataIndex: 'modifier_percent',
      key: 'modifier_percent',
      render: (val) => {
        const isUp = val > 0;
        return (
          <Tag
            icon={isUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            color={isUp ? 'volcano' : 'green'}
            style={{ fontWeight: 600, fontSize: 13, borderRadius: 6, padding: '2px 8px' }}
          >
            {isUp ? '+' : ''}{val}%
          </Tag>
        );
      }
    },
    {
      title: 'Trạng Thái',
      key: 'status',
      render: (_, record) => {
        if (record.is_applied) {
          return (
            <Tag color="success" icon={<CheckCircleOutlined />} style={{ borderRadius: 6, fontWeight: 500 }}>
              Đã tối ưu giá AI
            </Tag>
          );
        }
        return (
          <Tag color="warning" icon={<ThunderboltOutlined />} style={{ borderRadius: 6, fontWeight: 500 }}>
            Chưa cập nhật giá mới
          </Tag>
        );
      }
    }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Spin size="large" />
        <p className="text-gray-400">AI đang phân tích nhu cầu và tính toán bảng giá...</p>
      </div>
    );
  }

  const pendingCount = data ? (data.pending_count ?? data.suggestions?.filter(s => !s.is_applied).length) : 0;
  const allOptimized = data && pendingCount === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl"><RobotOutlined /></span>
            AI Dynamic Pricing Engine
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Thuật toán tự động gợi ý giá phòng theo thời gian thực dựa trên nhu cầu ngày thường & cuối tuần.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button icon={<SyncOutlined />} onClick={fetchSuggestions} size="large" className="rounded-xl">
            Làm mới phân tích
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<CheckCircleOutlined />}
            onClick={handleApply}
            loading={applying}
            disabled={!data || allOptimized}
            className="rounded-xl font-semibold shadow-sm"
            style={{ 
              background: allOptimized ? undefined : 'linear-gradient(135deg, #1677ff, #4f46e5)', 
              border: 'none' 
            }}
          >
            {allOptimized ? 'Tất cả đã tối ưu giá' : `Áp dụng giá mới (${pendingCount} phòng)`}
          </Button>
        </div>
      </div>

      {/* Thẻ thống kê */}
      {data && (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-blue-50/70 to-indigo-50/70">
              <Statistic
                title={<span className="text-gray-500 font-medium">Mức điều chỉnh so với giá gốc</span>}
                value={Math.abs(data.modifier_percent)}
                suffix="%"
                prefix={data.modifier_percent > 0 ? <ArrowUpOutlined className="text-red-500" /> : <ArrowDownOutlined className="text-green-500" />}
                valueStyle={{ color: data.modifier_percent > 0 ? '#ef4444' : '#22c55e', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="rounded-2xl border-0 shadow-sm">
              <Statistic
                title={<span className="text-gray-500 font-medium">Trạng thái áp dụng</span>}
                value={allOptimized ? '100% Đã tối ưu' : `Cần cập nhật ${pendingCount} phòng`}
                valueStyle={{ 
                  color: allOptimized ? '#16a34a' : '#d97706', 
                  fontSize: '1.25rem',
                  fontWeight: 'bold' 
                }}
                prefix={allOptimized ? <CheckCircleOutlined /> : <ThunderboltOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-purple-50/60 to-pink-50/60">
              <div className="flex items-start gap-3">
                <InfoCircleOutlined className="text-indigo-600 text-2xl mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 mb-1 font-medium">Căn cứ điều chỉnh AI</p>
                  <p className="font-semibold text-gray-800 text-sm leading-snug">{data.reason}</p>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* Bảng dữ liệu */}
      <Card className="rounded-2xl shadow-sm border border-gray-100 overflow-hidden" bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={data ? data.suggestions : []}
          rowKey="id"
          pagination={false}
          rowClassName="hover:bg-blue-50/40 transition-colors"
        />
      </Card>
    </div>
  );
}

export default AIPricing;
