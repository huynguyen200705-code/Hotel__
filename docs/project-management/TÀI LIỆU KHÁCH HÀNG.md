# Tài liệu khách hàng LuxeHotel CRM

## 1. Mục đích

Tài liệu xác định những người sẽ sử dụng hệ thống, nhu cầu của họ và các yêu cầu cần dùng khi thiết kế giao diện, phát triển chức năng và kiểm thử.

**Lưu ý:** Nhóm chưa cung cấp kết quả phỏng vấn khách hàng thật. Vì vậy, mô tả người dùng và nhu cầu dưới đây là giả định ban đầu, cần được xác nhận trước khi chốt thiết kế.

## 2. Nhóm khách hàng và người dùng

### Khách đặt phòng

- **Mục tiêu:** Tìm phòng phù hợp, biết giá và tình trạng phòng, gửi yêu cầu đặt phòng.
- **Nhu cầu:** Trang dễ sử dụng trên điện thoại; thông tin phòng và giá rõ ràng; biểu mẫu ngắn; biết đơn đã được ghi nhận hay chưa.
- **Điểm cần xác nhận:** Có bắt buộc tạo tài khoản để đặt phòng không? Khách có thể tự hủy đơn không?

### Nhân viên khách sạn

- **Mục tiêu:** Tra cứu thông tin khách, phòng và đơn đặt phòng để hỗ trợ khách.
- **Nhu cầu:** Tìm kiếm nhanh; xem trạng thái đơn; cập nhật thông tin theo đúng quyền.
- **Điểm cần xác nhận:** Nhân viên được sửa những trường nào? Ai được hủy đơn hoặc xuất danh sách khách?

### Quản trị viên

- **Mục tiêu:** Quản lý người dùng, quyền truy cập và theo dõi hoạt động của hệ thống.
- **Nhu cầu:** Có thông tin tổng quan dễ hiểu; kiểm soát quyền; biết các thay đổi quan trọng.
- **Điểm cần xác nhận:** Những số liệu nào cần hiển thị trên bảng điều khiển?

## 3. Hành trình đặt phòng của khách

| Bước | Khách hàng thực hiện | Hệ thống cần hỗ trợ |
|---|---|---|
| Tìm hiểu | Xem danh sách phòng | Hiển thị loại phòng, mô tả, sức chứa và giá |
| Chọn phòng | Chọn phòng và ngày lưu trú | Kiểm tra ngày hợp lệ và tình trạng phòng |
| Đặt phòng | Nhập thông tin cần thiết và gửi yêu cầu | Báo lỗi nếu dữ liệu chưa hợp lệ hoặc phòng không còn trống |
| Nhận kết quả | Xem kết quả đặt phòng | Chỉ xác nhận khi đơn đã được lưu; hiển thị mã và thông tin đơn |
| Theo dõi | Đăng nhập và xem đơn đã đặt | Chỉ hiển thị đơn thuộc tài khoản khách đó |

## 4. Yêu cầu chính

| Mã | Yêu cầu | Kết quả mong đợi |
|---|---|---|
| KH-01 | Khách xem danh sách và chi tiết phòng | Thông tin phòng và giá được hiển thị rõ |
| KH-02 | Khách chọn ngày nhận và trả phòng | Ngày trả phải sau ngày nhận; ngày sai bị từ chối |
| KH-03 | Khách gửi yêu cầu đặt phòng | Hệ thống kiểm tra tình trạng phòng trước khi lưu đơn |
| KH-04 | Khách đặt phòng đã có đơn trùng thời gian | Hệ thống từ chối và giải thích lý do |
| KH-05 | Khách xem lịch sử đặt phòng | Khách chỉ xem được đơn của tài khoản mình |
| NV-01 | Nhân viên tìm kiếm khách hàng | Có thể tìm theo thông tin được cho phép |
| NV-02 | Nhân viên cập nhật hồ sơ khách hàng | Dữ liệu hợp lệ được lưu; lỗi được thông báo rõ |
| NV-03 | Nhân viên quản lý phòng và đơn | Chỉ cập nhật được trạng thái hợp lệ |
| QT-01 | Quản trị viên quản lý quyền | Chức năng quản trị chỉ dành cho người được cấp quyền |

## 5. Thông tin khách hàng

Thông tin có thể cần cho hồ sơ khách gồm họ tên, số điện thoại và thư điện tử. Chỉ yêu cầu thông tin thực sự cần cho việc đặt phòng và phục vụ khách.

Không dùng thông tin giấy tờ tùy thân, dữ liệu thanh toán, mật khẩu hoặc thông tin cá nhân thật trong dữ liệu trình diễn, tài liệu chia sẻ và nội dung gửi cho công cụ trí tuệ nhân tạo. Nếu nghiệp vụ thật cần thu thập thêm thông tin, khách sạn phải xác nhận mục đích, người được quyền xem và thời gian lưu trữ trước khi thiết kế.

## 6. Quy tắc cần thống nhất trước khi phát triển

- Khách có cần đăng nhập trước khi đặt phòng không?
- Đơn đặt phòng được xác nhận tự động hay cần nhân viên duyệt?
- Quy định về giờ nhận phòng, giờ trả phòng và cách tính tiền.
- Điều kiện hủy đơn, phí hủy và hoàn tiền.
- Trạng thái nào giữ phòng; cách xử lý khi hai khách đặt cùng phòng gần như đồng thời.
- Thông tin nào bắt buộc trong hồ sơ khách hàng và ai được xem, sửa hoặc xuất thông tin.

## 7. Câu hỏi phỏng vấn khách hàng

1. Khi tìm phòng, thông tin nào giúp anh/chị quyết định chọn phòng?
2. Anh/chị muốn xem giá theo từng đêm hay tổng số tiền cho cả kỳ nghỉ?
3. Anh/chị muốn đặt phòng bằng tài khoản hay không cần tạo tài khoản?
4. Sau khi gửi yêu cầu, anh/chị mong nhận được xác nhận như thế nào?
5. Anh/chị cần biết điều kiện hủy hoặc đổi ngày ở ở bước nào?
6. Nhân viên khách sạn hiện quản lý khách và đơn đặt phòng ra sao?
7. Những thông tin khách hàng nào khách sạn thực sự cần lưu?

## 8. Kiểm thử với người dùng

- Đặt phòng với ngày hợp lệ và kiểm tra kết quả.
- Thử nhập ngày trả trước hoặc trùng ngày nhận phòng.
- Thử đặt một phòng đã có đơn trong cùng khoảng thời gian.
- Đăng nhập bằng tài khoản khác và kiểm tra không xem được đơn của khách khác.
- Đăng nhập bằng tài khoản nhân viên và kiểm tra quyền quản lý.
- Thử tìm và cập nhật thông tin khách hàng bằng dữ liệu giả lập.

## 9. Tài liệu liên quan

Xem [Mô tả sản phẩm](./PRODUCT_DESCRIPTION.md) để biết mục tiêu, phạm vi và chức năng tổng quan của hệ thống.
