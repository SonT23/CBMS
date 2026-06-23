# CBMS Web (Next.js + Prisma + MySQL)

Hiện thực hệ thống **Clinic Booking & Management System (CBMS)** phủ **trọn vòng khám end-to-end** với phân quyền theo vai trò:

**Bệnh nhân** đặt lịch → **Lễ tân** tiếp đón/check-in (cấp STT) → **Bác sĩ** khám, ghi EMR, chỉ định CLS & kê đơn → **KTV** trả kết quả cận lâm sàng → **Dược sĩ** xuất thuốc (trừ kho) → **Thu ngân** thu phí gộp & xuất hóa đơn. Đủ 7 module nghiệp vụ M1–M7.

## Công nghệ
- **Next.js 14** (App Router) — full-stack (frontend + API routes)
- **Prisma ORM** + **MySQL 8**
- **JWT** (xác thực phân vai trò), **bcryptjs** (hash mật khẩu), **TailwindCSS** (giao diện pastel)

## Module đã hiện thực
| Module | Vai trò | Chức năng |
|---|---|---|
| M1 Tài khoản | Bệnh nhân | Đăng ký, đăng nhập, hồ sơ cá nhân |
| M2 Đặt lịch | Bệnh nhân | Tìm/lọc bác sĩ theo chuyên khoa, xem chi tiết, đặt lịch (chống trùng slot), hủy lịch |
| **M3 Tiếp đón** | Lễ tân | Xem lịch chờ, check-in cấp số thứ tự, hàng chờ khám |
| **M4 Khám bệnh & EMR** | Bác sĩ | Hàng chờ bệnh nhân, ghi sinh hiệu (tự tính BMI), chẩn đoán/kết luận, **chỉ định CLS, kê đơn thuốc**, hoàn tất → tạo hóa đơn gộp |
| **M5 Cận lâm sàng** | KTV CLS | Hàng chờ phiếu chỉ định, tiếp nhận, nhập kết quả từng mục, gửi bác sĩ |
| **M6 Dược & Kho** | Dược sĩ | Hàng chờ đơn thuốc, xuất thuốc (trừ kho, chặn tồn âm), bảng tồn kho + cảnh báo sắp hết |
| **M7 Thu ngân** | Thu ngân | Hóa đơn gộp (khám + CLS + thuốc), thu tiền mặt, doanh thu trong ngày |

## Yêu cầu cài đặt
- Node.js 18+ và npm
- MySQL 8 đang chạy (tạo sẵn 1 database rỗng, ví dụ tên `cbms`)

## Các bước chạy
1. Cài thư viện: `npm install`
2. Tạo `.env` từ `.env.example`, sửa `DATABASE_URL` và `JWT_SECRET`.
3. Tạo bảng: `npx prisma db push`
4. Nạp dữ liệu mẫu (6 chuyên khoa, 6 bác sĩ, lịch trống): `npm run seed`
5. **Tạo tài khoản nhân viên + link bác sĩ:** `node prisma/seed-staff.js`
6. **Seed dịch vụ CLS, thuốc + tài khoản KTV/Dược sĩ:** `node prisma/seed-clinical.js`
7. Chạy: `npm run dev` → mở http://localhost:3000

## Tài khoản demo (mật khẩu chung: `Abc@1234`)
| Vai trò | Email | Trang sau đăng nhập |
|---|---|---|
| Bệnh nhân | *tự đăng ký ở `/login`* | /doctors |
| Lễ tân | `letan@cbms.vn` | /reception |
| Bác sĩ | `bs1@cbms.vn` … `bs6@cbms.vn` | /doctor |
| KTV CLS | `ktv@cbms.vn` | /lab |
| Dược sĩ | `duocsi@cbms.vn` | /pharmacy |
| Thu ngân | `thungan@cbms.vn` | /cashier |
| Quản trị | `admin@cbms.vn` | (xem tất cả) |

## Luồng demo end-to-end
1. **Bệnh nhân** (`/login` → Đăng ký) → Tìm bác sĩ → Đặt lịch → nhận mã booking.
2. **Lễ tân** (`letan@cbms.vn`) → `/reception` → **Check-in** bệnh nhân (cấp STT).
3. **Bác sĩ** (`bs1@cbms.vn`) → `/doctor` → chọn bệnh nhân → nhập sinh hiệu + chẩn đoán → **chỉ định CLS** + **kê đơn thuốc** → **Hoàn tất khám** (tự tạo hóa đơn gộp).
4. **KTV CLS** (`ktv@cbms.vn`) → `/lab` → tiếp nhận phiếu → nhập kết quả → gửi bác sĩ.
5. **Dược sĩ** (`duocsi@cbms.vn`) → `/pharmacy` → **Xuất thuốc** (trừ kho); tab **Tồn kho** xem cảnh báo.
6. **Thu ngân** (`thungan@cbms.vn`) → `/cashier` → **Thu tiền mặt** (khám + CLS + thuốc) → hóa đơn `PAID`.

## API chính
| Method | Endpoint | Mô tả | Use case |
|---|---|---|---|
| POST | /api/auth/register · /login | Đăng ký · Đăng nhập (JWT, trả role) | ITS-1, ITS-2 |
| GET | /api/specialties | Danh sách chuyên khoa | ITS-24 |
| GET | /api/doctors · /api/doctors/[id] | Danh sách/lọc · chi tiết bác sĩ | ITS-24, ITS-25 |
| GET | /api/doctors/[id]/slots | Khung giờ trống (đã loại quá khứ) | ITS-26 |
| POST/GET | /api/appointments | Đặt lịch (transaction) · lịch của tôi | ITS-27, ITS-59 |
| GET/POST | /api/reception · /reception/checkin | Hàng chờ tiếp đón · check-in (cấp STT) | ITS-31, ITS-32 |
| GET | /api/doctor/queue | Hàng chờ của bác sĩ | ITS-34 |
| GET/POST | /api/doctor/record[/id] | Bệnh án: sinh hiệu + chẩn đoán + chỉ định CLS + kê đơn, hoàn tất | ITS-35, ITS-36, ITS-62, ITS-63, ITS-38 |
| GET | /api/lab-tests · /api/medications | Danh mục dịch vụ CLS · thuốc | ITS-63, ITS-38 |
| GET/POST | /api/lab · /lab/update | Hàng chờ CLS · tiếp nhận/nhập KQ/gửi | ITS-53, ITS-55, ITS-57 |
| GET/POST | /api/pharmacy · /pharmacy/dispense | Đơn chờ + tồn kho · xuất thuốc trừ kho | ITS-41, ITS-44, ITS-66 |
| GET/POST | /api/cashier · /cashier/pay | Hóa đơn gộp · thu tiền | ITS-67, ITS-50 |
| GET | /api/me | Hồ sơ + thống kê lịch hẹn | ITS-7 |

## Cơ chế chống trùng lịch
- Cột `slot_id` trong `lich_kham` ràng buộc **UNIQUE** → mỗi slot chỉ 1 lịch hẹn.
- API đặt lịch chạy **transaction**: kiểm tra slot trống → `available=false` → tạo appointment; thêm guard loại slot quá khứ. Hai yêu cầu đồng thời chỉ 1 thành công (FR-M2-006 / ITS-59).

## Cấu trúc thư mục
```
cbms-web/
├─ prisma/
│  ├─ schema.prisma     # 14 model: User, Patient, Specialty, Doctor, ScheduleSlot, Appointment,
│  │                    #   MedicalRecord, Invoice, LabTest, LabOrder(+Item), Medication, Prescription(+Item)
│  ├─ seed.js           # chuyên khoa, bác sĩ, slot
│  ├─ seed-staff.js     # tài khoản lễ tân/bác sĩ/thu ngân/admin + link Doctor↔User
│  └─ seed-clinical.js  # dịch vụ CLS, thuốc (tồn kho) + tài khoản KTV/Dược sĩ
├─ lib/  prisma.js · auth.js · roles.js
├─ app/
│  ├─ api/              # auth, specialties, doctors, appointments, reception, doctor, cashier, me
│  ├─ login/ doctors/ booking/ appointments/ profile/   # bệnh nhân
│  ├─ reception/ doctor/ cashier/                        # nhân viên
│  └─ layout.js · page.js · globals.css
└─ components/Nav.js    # điều hướng theo vai trò
```

## Ghi chú
- Trạng thái thực thể dùng Enum đồng bộ SRS (AppointmentStatus, ExaminationStatus, InvoiceStatus…).
- Tên bảng snake_case tiếng Việt, khớp DDL ở SRS mục 10.
- Đã hiện thực 7/7 module nghiệp vụ chính (M1–M7). Phần chưa làm: tích hợp ngoài (SMS/cổng thanh toán online VNPay/MoMo, hóa đơn điện tử), quản lý lô thuốc/NCC chi tiết, báo cáo/thống kê nâng cao.
