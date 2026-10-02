# LuxeHotel CRM – Hệ thống quản lý khách sạn và đặt phòng trực tuyến

## 1. Giới thiệu dự án
LuxeHotel CRM là hệ thống quản lý khách sạn được xây dựng để hỗ trợ quy trình kinh doanh từ khách hàng đến quản lý vận hành. Dự án tập trung vào các chức năng cơ bản của một khách sạn hiện đại: quản lý phòng, quản lý đặt phòng, quản lý khách hàng, phân quyền người dùng và dashboard giám sát hoạt động.

Hệ thống được triển khai theo mô hình web application tách biệt rõ ràng giữa frontend, backend và database, giúp dễ mở rộng và phát triển trong tương lai.

---

## 2. Mục tiêu của dự án
Dự án nhằm mục đích:
- Tạo nền tảng đặt phòng trực tuyến cho khách hàng
- Quản lý hiệu quả trạng thái phòng và đơn đặt phòng
- Hỗ trợ quản trị viên theo dõi hoạt động khách sạn
- Tạo một hệ thống có tính thực tiễn, thân thiện với người dùng và phù hợp cho mục tiêu demo / đồ án
- Xây dựng một mô hình phát triển theo nhóm rõ ràng, có phân công trách nhiệm và luồng làm việc khoa học

---

## 3. Phạm vi chức năng

### 3.1. Chức năng dành cho khách hàng
- Xem danh sách phòng nghỉ
- Lọc phòng theo loại và tiêu chí phù hợp
- Xem chi tiết phòng có hình ảnh, giá, loại phòng
- Chọn ngày nhận phòng và trả phòng
- Kiểm tra tính khả dụng của phòng theo khoảng thời gian
- Đặt phòng trực tuyến
- Đăng ký tài khoản khách hàng
- Đăng nhập tài khoản khách hàng
- Xem lịch sử các đơn đặt phòng của cá nhân
- Theo dõi trạng thái đơn đặt phòng

### 3.2. Chức năng dành cho quản trị viên
- Đăng nhập hệ thống quản trị
- Quản lý phòng nghỉ
- Thêm, sửa, xóa phòng
- Cập nhật trạng thái phòng: Available, Booked, Maintenance
- Quản lý khách hàng
- Quản lý đơn đặt phòng
- Cập nhật trạng thái đơn: Confirmed, CheckedIn, CheckedOut, Cancelled
- Theo dõi dashboard tổng quan
- Quản lý quyền truy cập của người dùng

### 3.3. Chức năng bổ sung chưa triển khai
- Hệ thống login thống nhất cho Admin/Staff/Customer
- Upload hình ảnh phòng
- Kiểm tra trùng lịch đặt phòng để tránh double-booking
- Lưu lịch sử hoạt động khách hàng
- Dashboard quản trị cơ bản
- Gợi ý định giá phòng thông qua module AI pricing
- Tích điểm/loại thành viên cơ bản cho khách hàng

---

## 4. Các chức năng đã làm chi tiết

### 4.1. Quản lý khách hàng
- Thu thập thông tin khách hàng: họ tên, số điện thoại, email
- Tạo hồ sơ khách hàng khi đặt phòng mới
- Theo dõi doanh thu và điểm thưởng của khách
- Phân loại mức độ thành viên theo chi tiêu
- Lưu log hoạt động của khách hàng

### 4.2. Quản lý phòng
- Quản lý số phòng, loại phòng, giá hiện tại, trạng thái phòng
- Gán hình ảnh cho từng phòng
- Loại bỏ phòng trùng lặp hoặc lỗi nhập liệu
- Kiểm tra tình trạng phòng theo thời gian đặt trước

### 4.3. Quản lý đặt phòng
- Khách hàng chọn thời gian và lobby phòng để đặt đơn
- Hệ thống kiểm tra phòng có trống trong khoảng thời gian không
- Nếu phòng bị đặt chồng chéo, hệ thống cảnh báo và từ chối đặt
- Tạo mã đơn đặt phòng tự động
- Cập nhật trạng thái đơn đặt phòng theo tiến độ
- Hỗ trợ hủy hoặc xóa đơn đặt phòng

### 4.4. Quản lý tài khoản và phân quyền
- Khách hàng có tài khoản riêng
- Admin/Staff có hệ thống đăng nhập riêng và route được bảo vệ
- Phân quyền truy cập theo vai trò để tránh người dùng không đủ quyền thao tác
- Mã hóa mật khẩu bằng bcrypt
- Sử dụng JWT để xác thực và giữ phiên đăng nhập

### 4.5. Dashboard quản trị
- Tổng quan số lượng đơn đặt phòng
- Theo dõi khách hàng đã đăng ký
- Giám sát trạng thái phòng
- Theo dõi hoạt động quản lý trong hệ thống

---

## 5. Công nghệ sử dụng

### Frontend
- React
- Vite
- JavaScript
- Tailwind CSS
- Ant Design

### Backend
- Node.js
- Express.js
- JWT
- Bcrypt
- CORS

### Database
- SQL Server

---

## 6. Kiến trúc hệ thống
Dự án được xây dựng theo mô hình client-server rõ ràng:

- Frontend: giao diện và trải nghiệm người dùng
- Backend: xử lý API, xác thực, logic nghiệp vụ
- Database: lưu trữ dữ liệu của khách sạn
- REST API: kết nối dữ liệu giữa frontend và backend

Luồng hoạt động cơ bản:
1. Người dùng truy cập giao diện web
2. Frontend gửi request đến server
3. Backend kiểm tra dữ liệu, quyền truy cập và logic nghiệp vụ
4. Backend tương tác với SQL Server
5. Kết quả được trả về frontend và hiển thị cho người dùng

---

## 7. Cấu trúc thư mục dự án
```text
HotelCRM/
├── backend/
│   ├── routes/
│   │   ├── auth.js
│   │   ├── bookings.js
│   │   ├── customers.js
│   │   ├── rooms.js
│   │   └── ai.js
│   ├── db.js
│   ├── server.js
│   ├── fix_db.js
│   ├── migrate_rooms.js
│   └── package.json
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── database/
│   └── schema.sql
├── README.md
└── .env.example
```

---

## 8. Vai trò và phân công nhiệm vụ trong nhóm

### Huy – PM (Project Manager)
- Quản lý tiến độ dự án
- Lập kế hoạch và timeline
- Phân công công việc cho từng thành viên
- Theo dõi tiến độ và đảm bảo mục tiêu của dự án
- Hỗ trợ phối hợp giữa frontend, backend và database
- Tổng hợp kết quả và báo cáo tiến độ cho nhóm

### Thiện – BA / BO (Business Analyst / Business Owner)
- Phân tích yêu cầu nghiệp vụ của dự án
- Xác định luồng khách hàng và quản trị
- Chuyển yêu cầu từ business thành chức năng hệ thống
- Làm rõ logic đặt phòng, quản lý phòng, quản lý khách hàng
- Kiểm tra tính hợp lý của chức năng với mục tiêu bài toán
- Hỗ trợ test các kịch bản nghiệp vụ chính

### Thanh – Data / Test
- Xây dựng dữ liệu mẫu cho hệ thống
- Tạo dữ liệu phòng, loại phòng, khách hàng, đơn đặt phòng
- Kiểm tra tính hợp lệ của dữ liệu đầu vào
- Viết test case và kiểm thử chức năng
- Phát hiện lỗi logic hoặc sai dữ liệu trong quá trình chạy demo
- Hỗ trợ đảm bảo hệ thống có dữ liệu đủ để trình bày

### Lương – Frontend
- Xây dựng giao diện người dùng
- Thiết kế và triển khai các màn hình chính
- Tương tác với backend để hiển thị dữ liệu đúng định dạng
- Chú trọng UX/UI, responsive và tính dễ sử dụng
- Phát triển dashboard quản trị và giao diện người dùng khách hàng

### Đăng – Backend
- Xây dựng API và logic nghiệp vụ
- Xử lý xác thực người dùng và phân quyền
- Quản lý cơ sở dữ liệu và truy vấn SQL Server
- Triển khai logic đặt phòng, kiểm tra phòng trống và cập nhật trạng thái
- Đảm bảo hệ thống hoạt động ổn định và đúng quy trình kinh doanh

---

## 9. Hệ sinh thái làm việc nhóm
Dự án được triển khai theo mô hình làm việc cộng tác chặt chẽ giữa 5 thành viên, trong đó mỗi người hỗ trợ lẫn nhau để đảm bảo sản phẩm hoàn thiện hơn:

- PM định hướng tiến độ và phân công nhiệm vụ
- BA/BO đảm bảo nghiệp vụ được xây dựng đúng mục tiêu
- Data/Test cung cấp dữ liệu và kiểm thử hệ thống
- Frontend tạo ra trải nghiệm trực quan cho người dùng
- Backend quản lý dữ liệu, API và logic vận hành

Mô hình này giúp dự án không chỉ chạy được mà còn có tính logic, tính thực tế và dễ mở rộng trong tương lai.

---

## 10. Quy trình phát triển
1. Nghiên cứu yêu cầu và xác định chức năng chính
2. Thiết kế dữ liệu và luồng nghiệp vụ
3. Xây dựng database schema
4. Phát triển backend API
5. Phát triển frontend giao diện
6. Kết nối frontend với backend
7. Kiểm thử chức năng bằng dữ liệu mẫu
8. Sửa lỗi và tối ưu hóa trải nghiệm
9. Demo và hoàn thiện báo cáo

---

## 11. Hướng dẫn chạy dự án

### 1) Thiết lập Database (SQL Server)
1. Mở SQL Server Management Studio (SSMS)
2. Tạo database mới hoặc chạy toàn bộ nội dung trong file `database/schema.sql`
3. Kiểm tra kết nối SQL Server và cấu hình quyền truy cập

### 2) Thiết lập Backend
```bash
cd backend
npm install
npm run dev
```
Backend sẽ chạy ở cổng 5000 theo cấu hình mặc định.

### 3) Thiết lập Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend sẽ chạy ở cổng 5173 theo cấu hình mặc định.

### 4) Truy cập ứng dụng
- Client portal: `http://localhost:5173`
- Trang quản trị: `http://localhost:5173/admin/dashboard`

---

## 12. Tình trạng hiện tại của dự án
Dự án hiện tại đã triển khai được các chức năng cốt lõi của một hệ thống khách sạn cơ bản, bao gồm:
- Quản lý phòng
- Quản lý booking
- Quản lý khách hàng
- Login và phân quyền
- Dashboard quản trị
- Upload hình ảnh phòng
- Logic kiểm tra phòng trống và trùng đặt phòng

Project đang ở mức MVP (Minimum Viable Product) phù hợp cho mục tiêu demo, bảo vệ đồ án và tiếp tục nâng cấp trong các giai đoạn sau.

---

## 13. Roadmap phát triển trong tương lai
- Tích hợp thanh toán trực tuyến
- Tích hợp thông báo qua email/SMS
- Phân tích doanh thu theo ngày/tháng
- Nâng cấp báo cáo tổng hợp cho admin
- Mở rộng AI pricing cho các room type khác nhau
- Tăng cường tính năng housekeeping và maintenance
- Tối ưu UX và dữ liệu thực tế hơn cho khách hàng

---

## 14. Kết luận
LuxeHotel CRM là dự án quản lý khách sạn được xây dựng nhằm giải quyết bài toán về đặt phòng, quản lý phòng và quản lý khách hàng trong môi trường thực tế. Dự án không chỉ tập trung vào giao diện, mà còn chú trọng vào quy trình nghiệp vụ, cấu trúc dữ liệu và logic vận hành.

Nhờ sự phối hợp của 5 thành viên với các vai trò rõ ràng, dự án đã đạt được một nền tảng vững chắc cho việc demo và phát triển tiếp theo.

---

## 15. Ghi chú cho thành viên
- Luôn giữ cấu trúc project rõ ràng và dễ hiểu
- Cập nhật logic nghiệp vụ khi thay đổi chức năng
- Chú ý kiểm tra dữ liệu trước khi demo
- Đảm bảo frontend và backend hoạt động đồng bộ
- Cập nhật README và tài liệu khi có thay đổi lớn trong dự án
