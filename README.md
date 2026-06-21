# CBMS Web — MVP (Next.js + Prisma + MySQL)

Phiên bản hiện thực rút gọn của hệ thống **Clinic Booking & Management System (CBMS)**, phủ luồng bệnh nhân lõi:
**Đăng ký / Đăng nhập → Tìm bác sĩ → Đặt lịch (chống trùng slot) → Lịch hẹn của tôi (hủy lịch).**

## Công nghệ
- **Next.js 14** (App Router) — full-stack (frontend + API routes)
- **Prisma ORM** + **MySQL 8**
- **JWT** (xác thực), **bcryptjs** (hash mật khẩu), **TailwindCSS** (giao diện pastel)

## Yêu cầu cài đặt
- Node.js 18+ và npm
- MySQL 8 đang chạy (tạo sẵn 1 database rỗng, ví dụ tên `cbms`)

## Các bước chạy

1. Cài thư viện:
   ```bash
   npm install
   ```

2. Tạo file `.env` từ mẫu và sửa thông tin kết nối MySQL:
   ```bash
   cp .env.example .env
   ```
   Sửa `DATABASE_URL`, ví dụ:
   ```
   DATABASE_URL="mysql://root:matkhau@localhost:3306/cbms"
   JWT_SECRET="chuoi-bi-mat-cua-ban"
   ```

3. Tạo bảng trong MySQL từ Prisma schema:
   ```bash
   npx prisma db push
   ```

4. Nạp dữ liệu mẫu (6 chuyên khoa, 6 bác sĩ, lịch trống 5 ngày tới):
   ```bash
   npm run seed
   ```

5. Chạy ứng dụng:
   ```bash
   npm run dev
   ```
   Mở http://localhost:3000

## Luồng dùng thử
1. Vào `/login` → tab **Đăng ký** tạo tài khoản bệnh nhân.
2. Trang **Tìm bác sĩ** → chọn bác sĩ → **Đặt lịch**.
3. Chọn khung giờ trống → **Xác nhận đặt lịch** → nhận mã booking.
4. Vào **Lịch hẹn của tôi** để xem / **Hủy lịch** (slot được trả lại).

## Cấu trúc thư mục
```
cbms-web/
├─ prisma/
│  ├─ schema.prisma     # 6 model: User, Patient, Specialty, Doctor, ScheduleSlot, Appointment
│  └─ seed.js           # dữ liệu mẫu
├─ lib/
│  ├─ prisma.js         # Prisma client (singleton)
│  └─ auth.js           # JWT + bcrypt helpers
├─ app/
│  ├─ api/              # REST API (auth, doctors, appointments)
│  ├─ login/  doctors/  booking/  appointments/   # các trang
│  ├─ layout.js  page.js  globals.css
└─ components/Nav.js
```

## API chính
| Method | Endpoint | Mô tả | Map use case |
|---|---|---|---|
| POST | /api/auth/register | Đăng ký | ITS-1 |
| POST | /api/auth/login | Đăng nhập (JWT) | ITS-2 |
| GET | /api/doctors | Danh sách / tìm bác sĩ | ITS-24 |
| GET | /api/doctors/[id]/slots | Khung giờ trống | ITS-26 |
| POST | /api/appointments | Đặt lịch (transaction chống trùng) | ITS-27, ITS-59 |
| GET | /api/appointments | Lịch hẹn của tôi | ITS-58 |
| PATCH | /api/appointments/[id]/status | Hủy/đổi trạng thái | ITS-58 |

## Cơ chế chống trùng lịch
- Cột `slot_id` trong bảng `lich_kham` có ràng buộc **UNIQUE** → mỗi slot chỉ gắn được 1 lịch hẹn.
- API đặt lịch chạy trong **transaction**: kiểm tra slot còn trống → đặt `available=false` → tạo appointment. Hai yêu cầu đồng thời chỉ 1 cái thành công (đáp ứng FR-M2-006 / ITS-59).

## Ghi chú
- Đây là MVP phục vụ demo phần hiện thực; các module Lab/Dược/Thu ngân/Báo cáo đã được *đặc tả trong SRS* nhưng chưa hiện thực ở bản này.
- Tên bảng dùng snake_case tiếng Việt, khớp với DDL ở SRS mục 10.
