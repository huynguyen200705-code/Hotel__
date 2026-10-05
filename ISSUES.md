# Danh sách Issues (LuxeHotel CRM)

Dựa trên tài liệu `MÔ TẢ SẢN PHẨM.md`, `TÀI LIỆU KHÁCH HÀNG.md` và `README.md`, dưới đây là danh sách các Issue cần thực hiện trong giai đoạn tiếp theo:

## 1. Tính năng mới (Features)

- [ ] **[Feature] Hệ thống đăng nhập thống nhất**: Thống nhất hệ thống login cho Admin, Staff và Customer thay vì các trang login riêng biệt. (Tham khảo mục 3.3 - README.md).
- [ ] **[Feature] Lưu lịch sử hoạt động khách hàng**: Theo dõi và lưu log các hoạt động của khách hàng trên hệ thống để dễ dàng tra cứu.
- [ ] **[Feature] Module AI Pricing**: Nghiên cứu và xây dựng tính năng gợi ý định giá phòng tự động thông qua AI cho các loại phòng khác nhau.
- [ ] **[Feature] Hệ thống tích điểm & Hạng thành viên**: Xây dựng cơ chế tích điểm và phân loại hạng thành viên cơ bản cho khách hàng.
- [ ] **[Feature] Tích hợp thanh toán trực tuyến**: Tích hợp các cổng thanh toán (ví dụ: VNPAY, MoMo, Stripe) vào luồng đặt phòng.
- [ ] **[Feature] Thông báo qua Email/SMS**: Tự động gửi thông báo xác nhận qua email hoặc SMS khi khách hàng đặt phòng thành công hoặc hủy phòng.
- [ ] **[Feature] Phân tích doanh thu & Báo cáo quản trị**: Xây dựng biểu đồ phân tích doanh thu theo ngày/tháng và nâng cấp các báo cáo tổng hợp cho Dashboard của Admin.
- [ ] **[Feature] Quản lý dọn phòng (Housekeeping) & Bảo trì (Maintenance)**: Bổ sung tính năng để theo dõi trạng thái dọn dẹp và bảo trì của từng phòng.

## 2. Kiểm thử và Cải thiện (QA / Testing)

- [ ] **[QA] Kiểm thử luồng đặt phòng (Người dùng)**:
  - Đặt phòng với ngày hợp lệ và kiểm tra kết quả.
  - Thử nhập ngày trả trước hoặc trùng ngày nhận phòng để kiểm tra tính năng chặn lỗi.
  - Thử đặt một phòng đã có đơn trong cùng khoảng thời gian (kiểm tra triệt để double-booking).
- [ ] **[QA] Kiểm thử phân quyền & Bảo mật**:
  - Đăng nhập bằng tài khoản khách hàng và kiểm tra không xem được đơn của khách khác.
  - Đăng nhập bằng tài khoản nhân viên (Staff) và kiểm tra tính hợp lệ của quyền quản lý (chỉ được xem/sửa những gì được phép).
- [ ] **[QA] Kiểm thử quản lý khách hàng**:
  - Thử tìm kiếm và cập nhật thông tin khách hàng bằng dữ liệu giả lập.

## 3. Nghiệp vụ và Xác nhận Yêu cầu (Business Analysis)

- [ ] **[Task] Xác nhận yêu cầu từ người dùng thực tế**:
  - Phỏng vấn và xác nhận với đại diện khách sạn về việc có bắt buộc khách hàng tạo tài khoản khi đặt phòng không.
  - Xác nhận quy định về giờ nhận phòng, giờ trả phòng và cách tính tiền.
  - Thống nhất các điều kiện hủy đơn, phí hủy và quy trình hoàn tiền.
  - Làm rõ thông tin nào là bắt buộc trong hồ sơ khách hàng.
