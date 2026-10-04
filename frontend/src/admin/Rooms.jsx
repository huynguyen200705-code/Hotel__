import React, { useState, useEffect } from 'react';
import {
  Table, Button, Input, Select, Tag, Space, message,
  Modal, Form, Popconfirm, Image, Upload, Card, Row, Col, InputNumber
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  ReloadOutlined, UploadOutlined, PictureOutlined,
  HomeOutlined, DollarOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

const STATUS_MAP = {
  Available: { color: 'success', label: '✅ Phòng trống' },
  Booked: { color: 'error', label: '🔴 Đang có khách' },
  Maintenance: { color: 'warning', label: '🔧 Đang bảo trì' },
};

function AdminRooms() {
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [imagesList, setImagesList] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [form] = Form.useForm();

  // Load danh sách phòng và loại phòng
  const fetchData = async () => {
    setLoading(true);
    try {
      const [roomsRes, typesRes] = await Promise.all([
        axios.get('/api/rooms'),
        axios.get('/api/rooms/types'),
      ]);
      setRooms(roomsRes.data);
      setRoomTypes(typesRes.data);
    } catch (err) {
      console.error(err);
      message.error('Không thể tải danh sách phòng. Hãy kiểm tra server!');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Mở modal thêm phòng
  const handleOpenAddModal = () => {
    setEditingRoom(null);
    setImagesList([]);
    form.resetFields();
    form.setFieldsValue({
      status: 'Available',
      room_type_id: roomTypes.length > 0 ? roomTypes[0].id : undefined,
    });
    setIsModalOpen(true);
  };

  // Mở modal chỉnh sửa phòng
  const handleOpenEditModal = (record) => {
    setEditingRoom(record);
    const existingImgs = Array.isArray(record.images) && record.images.length > 0
      ? record.images
      : (record.image_url ? [record.image_url] : []);
    setImagesList(existingImgs);
    form.resetFields();
    form.setFieldsValue({
      room_number: record.room_number,
      room_type_id: record.room_type_id,
      current_price: record.current_price,
      status: record.status,
    });
    setIsModalOpen(true);
  };

  // Upload từng ảnh dạng base64 lên server
  const handleUploadImage = async (file) => {
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error(`Ảnh ${file.name} vượt quá dung lượng tối đa 5MB!`);
      return false;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        setUploadingImage(true);
        const res = await axios.post('/api/rooms/upload-image', {
          imageBase64: reader.result,
          fileName: file.name
        });
        if (res.data.imageUrl) {
          setImagesList((prev) => [...prev, res.data.imageUrl]);
          message.success(`Tải ảnh ${file.name} lên thành công!`);
        }
      } catch (err) {
        console.error(err);
        message.error(`Tải ảnh ${file.name} thất bại!`);
      } finally {
        setUploadingImage(false);
      }
    };
    return false; // Ngăn Antd upload mặc định
  };

  // Xử lý submit form
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setModalLoading(true);

      const payload = {
        ...values,
        image_url: imagesList[0] || null,
        images: imagesList,
      };

      if (editingRoom) {
        // Cập nhật
        await axios.put(`/api/rooms/${editingRoom.id}`, payload);
        message.success(`Đã cập nhật thông tin phòng ${payload.room_number}!`);
      } else {
        // Thêm mới
        await axios.post('/api/rooms', payload);
        message.success(`Đã thêm phòng ${payload.room_number} mới thành công!`);
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      if (err.response?.data?.message) {
        message.error(err.response.data.message);
      } else if (!err.errorFields) {
        message.error('Đã có lỗi xảy ra!');
      }
    } finally {
      setModalLoading(false);
    }
  };

  // Xóa phòng
  const handleDelete = async (record) => {
    try {
      await axios.delete(`/api/rooms/${record.id}`);
      message.success(`Đã xóa phòng ${record.room_number}!`);
      fetchData();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Không thể xóa phòng này!';
      Modal.warning({
        title: `Không thể xóa phòng ${record.room_number}`,
        content: errMsg,
        okText: 'Đã hiểu',
      });
    }
  };

  // Lọc phòng theo trạng thái & loại phòng
  const filteredRooms = rooms.filter((r) => {
    const matchType = filterType ? r.room_type_id === parseInt(filterType) : true;
    const matchStatus = filterStatus ? r.status === filterStatus : true;
    return matchType && matchStatus;
  });

  const columns = [
    {
      title: 'Hình ảnh',
      dataIndex: 'images',
      key: 'images',
      width: 130,
      render: (imgs, record) => {
        const list = Array.isArray(imgs) && imgs.length > 0
          ? imgs
          : (record.image_url ? [record.image_url] : []);

        if (list.length === 0) {
          return (
            <div style={{
              width: 70, height: 50, borderRadius: 8, background: '#f3f4f6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#9ca3af', fontSize: 20
            }}>
              🛏️
            </div>
          );
        }

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Image.PreviewGroup>
              <Image
                src={list[0]}
                alt="Room"
                width={70}
                height={50}
                style={{ objectFit: 'cover', borderRadius: 8 }}
                fallback="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='70' height='50' viewBox='0 0 70 50'><rect width='100%' height='100%' fill='%23f1f5f9'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='10' fill='%2394a3b8'>No Image</text></svg>"
              />
              {/* Ẩn các ảnh tiếp theo để preview group hiển thị khi click */}
              {list.slice(1).map((src, idx) => (
                <div key={idx} style={{ display: 'none' }}>
                  <Image src={src} />
                </div>
              ))}
            </Image.PreviewGroup>
            {list.length > 1 && (
              <Tag color="blue" style={{ borderRadius: 10, fontSize: 11, padding: '0 6px', margin: 0 }}>
                +{list.length - 1}
              </Tag>
            )}
          </div>
        );
      }
    },
    {
      title: 'Số phòng',
      dataIndex: 'room_number',
      key: 'room_number',
      render: (val) => (
        <span style={{ fontWeight: 700, fontSize: 16, color: '#1e40af' }}>
          {val}
        </span>
      ),
    },
    {
      title: 'Loại phòng',
      dataIndex: 'type_name',
      key: 'type_name',
      render: (val, record) => (
        <div>
          <div style={{ fontWeight: 600, color: '#374151' }}>{val}</div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>{record.capacity} người</div>
        </div>
      ),
    },
    {
      title: 'Giá / Đêm',
      dataIndex: 'current_price',
      key: 'current_price',
      render: (price) => (
        <span style={{ fontWeight: 600, color: '#059669', fontSize: 15 }}>
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const item = STATUS_MAP[status] || { color: 'default', label: status };
        return <Tag color={item.color} style={{ borderRadius: 12, padding: '2px 10px' }}>{item.label}</Tag>;
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 140,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            ghost
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenEditModal(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xác nhận xóa phòng"
            description={`Bạn có chắc muốn xóa phòng ${record.room_number}?`}
            onConfirm={() => handleDelete(record)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button danger size="small" icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1f2937', margin: 0 }}>
            Quản Lý Phòng
          </h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0' }}>
            Xem danh sách, thêm mới, sửa giá, tải ảnh và quản lý trạng thái các phòng khách sạn
          </p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenAddModal}
            style={{ background: '#1677ff' }}
          >
            Thêm phòng mới
          </Button>
        </Space>
      </div>

      {/* Filter bar */}
      <Card style={{ marginBottom: 20, borderRadius: 16, border: '1px solid #e5e7eb' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <div style={{ fontSize: 13, color: '#4b5563', marginBottom: 4, fontWeight: 500 }}>Lọc theo loại phòng:</div>
            <Select
              style={{ width: '100%' }}
              value={filterType}
              onChange={setFilterType}
              placeholder="Tất cả loại phòng"
            >
              <Option value="">Tất cả loại phòng</Option>
              {roomTypes.map((t) => (
                <Option key={t.id} value={t.id.toString()}>{t.type_name}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <div style={{ fontSize: 13, color: '#4b5563', marginBottom: 4, fontWeight: 500 }}>Lọc theo trạng thái:</div>
            <Select
              style={{ width: '100%' }}
              value={filterStatus}
              onChange={setFilterStatus}
              placeholder="Tất cả trạng thái"
            >
              <Option value="">Tất cả trạng thái</Option>
              <Option value="Available">✅ Trống</Option>
              <Option value="Booked">🔴 Đang có khách</Option>
              <Option value="Maintenance">🔧 Đang bảo trì</Option>
            </Select>
          </Col>
          <Col xs={24} md={8} style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
            <div style={{ color: '#6b7280', fontSize: 13, marginTop: 22 }}>
              Hiển thị: <b>{filteredRooms.length}</b> / {rooms.length} phòng
            </div>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card style={{ borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <Table
          columns={columns}
          dataSource={filteredRooms}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8, showTotal: (total) => `Tổng cộng ${total} phòng` }}
        />
      </Card>

      {/* Modal Thêm/Sửa */}
      <Modal
        title={
          <span style={{ fontSize: 18, fontWeight: 700 }}>
            {editingRoom ? `Chỉnh sửa phòng ${editingRoom.room_number}` : 'Thêm phòng mới'}
          </span>
        }
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={modalLoading}
        okText={editingRoom ? 'Lưu thay đổi' : 'Tạo phòng'}
        cancelText="Hủy"
        width={560}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="room_number"
                label="Số phòng"
                rules={[{ required: true, message: 'Vui lòng nhập số phòng' }]}
              >
                <Input placeholder="Ví dụ: 101, 202..." prefix={<HomeOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="room_type_id"
                label="Loại phòng"
                rules={[{ required: true, message: 'Chọn loại phòng' }]}
              >
                <Select placeholder="Chọn loại phòng">
                  {roomTypes.map((t) => (
                    <Option key={t.id} value={t.id}>
                      {t.type_name} ({t.capacity} khách)
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="current_price"
                label="Giá phòng / Đêm (VNĐ)"
                rules={[{ required: true, message: 'Nhập giá phòng' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={50000}
                  formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(val) => val.replace(/\$\s?|(,*)/g, '')}
                  prefix={<DollarOutlined />}
                  placeholder="500,000"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Trạng thái"
                rules={[{ required: true, message: 'Chọn trạng thái' }]}
              >
                <Select>
                  <Option value="Available">✅ Phòng trống (Available)</Option>
                  <Option value="Booked">🔴 Đã đặt / Đang ở (Booked)</Option>
                  <Option value="Maintenance">🔧 Đang bảo trì (Maintenance)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Upload và quản lý danh sách nhiều ảnh */}
          <div style={{ marginTop: 14, padding: '16px', background: '#f8fafc', borderRadius: 14, border: '1px dashed #cbd5e1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                <PictureOutlined /> Bộ sưu tập hình ảnh phòng ({imagesList.length} ảnh)
              </div>
              <Upload
                beforeUpload={handleUploadImage}
                showUploadList={false}
                multiple={true}
                accept="image/*"
              >
                <Button type="primary" ghost icon={<UploadOutlined />} loading={uploadingImage} size="small">
                  + Tải thêm ảnh (chọn 1 hoặc nhiều ảnh)
                </Button>
              </Upload>
            </div>

            {/* Grid preview danh sách ảnh đã thêm */}
            {imagesList.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, maxHeight: 220, overflowY: 'auto', padding: 4 }}>
                <Image.PreviewGroup>
                  {imagesList.map((url, index) => (
                    <div
                      key={index}
                      style={{
                        position: 'relative',
                        borderRadius: 8,
                        overflow: 'hidden',
                        border: index === 0 ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        background: '#ffffff',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                      }}
                    >
                      <Image
                        src={url}
                        alt={`Ảnh ${index + 1}`}
                        height={75}
                        style={{ width: '100%', objectFit: 'cover', display: 'block' }}
                        fallback="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='75' viewBox='0 0 100 75'><rect width='100%' height='100%' fill='%23f1f5f9'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='10' fill='%2394a3b8'>Lỗi ảnh</text></svg>"
                      />
                      {index === 0 && (
                        <div style={{
                          position: 'absolute', top: 3, left: 3,
                          background: '#2563eb', color: '#fff', fontSize: 10,
                          padding: '1px 6px', borderRadius: 4, fontWeight: 700
                        }}>
                          Ảnh chính
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImagesList((prev) => prev.filter((_, i) => i !== index));
                        }}
                        style={{
                          position: 'absolute', top: 3, right: 3,
                          background: 'rgba(239, 68, 68, 0.9)', color: '#fff',
                          border: 'none', borderRadius: '50%', width: 20, height: 20,
                          cursor: 'pointer', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: 12, lineHeight: 1
                        }}
                        title="Xóa ảnh này"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </Image.PreviewGroup>
              </div>
            ) : (
              <div style={{
                padding: '24px 16px',
                borderRadius: 8,
                background: '#ffffff',
                border: '1px dashed #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                fontSize: 13
              }}>
                <PictureOutlined style={{ fontSize: 32, marginBottom: 8, color: '#cbd5e1' }} />
                <span>Chưa có hình ảnh nào cho phòng này</span>
                <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Bấm nút phía trên để tải lên nhiều ảnh cùng lúc</span>
              </div>
            )}

            {/* Input thêm URL ảnh thủ công */}
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <Input
                placeholder="Hoặc nhập đường dẫn URL ảnh (https://...)..."
                id="manual-image-url-input"
                onPressEnter={(e) => {
                  const val = e.currentTarget.value.trim();
                  if (val) {
                    setImagesList((prev) => [...prev, val]);
                    e.currentTarget.value = '';
                  }
                }}
              />
              <Button
                onClick={() => {
                  const inp = document.getElementById('manual-image-url-input');
                  if (inp && inp.value.trim()) {
                    setImagesList((prev) => [...prev, inp.value.trim()]);
                    inp.value = '';
                  }
                }}
              >
                Thêm URL
              </Button>
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

export default AdminRooms;
