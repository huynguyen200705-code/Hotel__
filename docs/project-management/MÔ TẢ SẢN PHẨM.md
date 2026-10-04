# Mô tả sản phẩm LuxeHotel CRM

## 1. Giới thiệu

LuxeHotel CRM là hệ thống web hỗ trợ khách hàng tìm và đặt phòng, đồng thời giúp nhân viên khách sạn quản lý phòng, khách hàng và đơn đặt phòng. Sản phẩm gồm giao diện khách hàng, khu vực quản trị, dịch vụ xử lý nghiệp vụ và cơ sở dữ liệu.

Đây là sản phẩm phục vụ đồ án và trình diễn. Chưa có nghiên cứu người dùng thực tế, vì vậy các nhu cầu trong tài liệu cần được xác nhận với khách hàng hoặc đại diện khách sạn trước khi phát triển chính thức.

## 2. Mục tiêu

- Giúp khách xem thông tin phòng, chọn ngày lưu trú và gửi yêu cầu đặt phòng.
- Giúp nhân viên tra cứu hồ sơ khách hàng, phòng và đơn đặt phòng.
- Giúp quản trị viên theo dõi hoạt động cơ bản và quản lý quyền truy cập.
- Hạn chế thông tin sai lệch và đặt trùng phòng bằng cách kiểm tra dữ liệu ở phía máy chủ.

## 3. Người sử dụng

| Người sử dụng | Nhu cầu chính |
|---|---|
| Khách hàng | Tìm phòng, xem giá, đặt phòng và theo dõi đơn của mình |
| Nhân viên khách sạn | Tra cứu khách hàng, quản lý phòng và xử lý đơn đặt phòng |
| Quản trị viên | Quản lý người dùng, phân quyền và theo dõi tình hình chung |

## 4. Chức năng chính

### Dành cho khách hàng

- Xem danh sách và thông tin chi tiết phòng.
- Chọn ngày nhận phòng, ngày trả phòng và gửi yêu cầu đặt phòng.
- Đăng ký, đăng nhập và xem lịch sử đặt phòng.
- Nhận thông báo rõ ràng khi thao tác thành công hoặc gặp lỗi.

### Dành cho nhân viên và quản trị viên

- Tìm kiếm, xem, thêm và cập nhật hồ sơ khách hàng.
- Quản lý thông tin phòng và trạng thái phòng.
- Tra cứu và cập nhật trạng thái đơn đặt phòng theo quy định.
- Xem bảng điều khiển tổng quan.
- Quản lý tài khoản và quyền truy cập theo vai trò.

## 5. Phạm vi phiên bản đồ án

Phiên bản hiện tại tập trung vào luồng đặt phòng và nghiệp vụ quản lý cơ bản. Hệ thống sử dụng React cho giao diện, Node.js và Express cho dịch vụ xử lý, SQL Server cho dữ liệu.

Không thuộc phạm vi phiên bản này: thanh toán trực tuyến thật, gửi tin nhắn hoặc thư điện tử tự động, vận hành nhiều khách sạn, ứng dụng điện thoại riêng và sử dụng trí tuệ nhân tạo để tự động đổi giá trong hoạt động thực tế.

## 6. Nguyên tắc thiết kế

- Hiển thị rõ giá, ngày lưu trú và trạng thái đơn.
- Kiểm tra ngày hợp lệ và khả năng đặt phòng trước khi xác nhận đơn.
- Chỉ cho phép người dùng xem hoặc sửa dữ liệu phù hợp với quyền của họ.
- Chỉ thu thập thông tin khách hàng cần thiết cho nghiệp vụ.
- Không thông báo đặt phòng thành công nếu hệ thống chưa ghi nhận đơn.

## 7. Tiêu chí đánh giá bản trình diễn

- Khách hàng có thể hoàn thành một lượt đặt phòng hợp lệ.
- Hệ thống từ chối ngày không hợp lệ và trường hợp phòng đã có đơn trùng thời gian.
- Nhân viên có thể tìm và cập nhật hồ sơ khách hàng, phòng và đơn đặt phòng.
- Người dùng không có quyền không thể truy cập chức năng quản trị.
- Dữ liệu trình diễn là dữ liệu giả lập, không chứa thông tin khách hàng thật.

## 8. Tài liệu khách hàng

Các nhóm khách hàng, nhu cầu và yêu cầu chi tiết được trình bày trong [Tài liệu khách hàng](./CUSTOMER_REQUIREMENTS.md).
