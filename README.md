# CBMS — Clinic Booking & Management System

Hệ thống web **quản lý phòng khám đầu–cuối**: số hóa trọn một lượt khám từ lúc bệnh nhân đặt lịch đến khi thanh toán, phân quyền theo **6 vai trò**. Đồ án môn **Nhập môn Công nghệ phần mềm**.

> **Luồng nghiệp vụ:** Bệnh nhân đặt lịch → Lễ tân check-in (cấp STT) → Bác sĩ khám + ghi EMR + chỉ định CLS + kê đơn → KTV trả kết quả cận lâm sàng → Dược sĩ xuất thuốc (trừ kho) → Thu ngân thu phí gộp & xuất hóa đơn.

---

## 1. Công nghệ

| Tầng | Công nghệ |
|---|---|
| **Frontend** | Next.js 14 (App Router) + React 18 + TailwindCSS 3 |
| **Backend** | Next.js API Routes (Node.js) + JWT + bcryptjs |
| **Database** | MySQL 8 (InnoDB) qua Prisma ORM 5 |

Cả frontend và backend nằm chung một codebase Next.js (full-stack JavaScript) — không tách server backend riêng.

## 2. Module đã hiện thực (7/7 lõi)

| Module | Vai trò | Chức năng |
|---|---|---|
| **M1** Tài khoản | Bệnh nhân | Đăng ký, đăng nhập (JWT), hồ sơ cá nhân |
| **M2** Đặt lịch | Bệnh nhân | Tìm/lọc bác sĩ theo chuyên khoa, xem chi tiết, đặt lịch (chống trùng slot), hủy lịch |
| **M3** Tiếp đón | Lễ tân | Hàng chờ tiếp đón, check-in cấp số thứ tự, hàng chờ khám |
| **M4** Khám bệnh & EMR | Bác sĩ | Hàng chờ, ghi sinh hiệu (tự tính BMI), chẩn đoán, chỉ định CLS, kê đơn, hoàn tất → hóa đơn gộp |
| **M5** Cận lâm sàng | KTV CLS | Hàng chờ phiếu chỉ định, tiếp nhận, nhập kết quả từng mục, gửi bác sĩ |
| **M6** Dược & Kho | Dược sĩ | Hàng chờ đơn thuốc, xuất thuốc (trừ kho an toàn, chặn tồn âm), tồn kho + cảnh báo sắp hết |
| **M7** Thu ngân | Thu ngân | Hóa đơn gộp (khám + CLS + thuốc), thu tiền mặt, doanh thu trong ngày |

**Điểm mạnh kỹ thuật:** chống đặt trùng khung giờ + trừ kho an toàn bằng **transaction**; **RBAC 6 vai trò** + điều hướng theo vai trò; trạng thái thực thể dùng Enum đồng bộ SRS.

## 3. Cài đặt & chạy

**Yêu cầu:** Node.js 18+, MySQL 8 (tạo sẵn 1 database rỗng tên `cbms`).

```bash
npm install                       # 1. Cài thư viện
cp .env.example .env              # 2. Tạo .env, sửa DATABASE_URL + JWT_SECRET
npx prisma db push               # 3. Tạo 14 bảng từ schema
npm run seed                     # 4. Seed chuyên khoa, bác sĩ, slot lịch
node prisma/seed-staff.js        # 5. Tạo tài khoản nhân viên + link bác sĩ
node prisma/seed-clinical.js     # 6. Seed dịch vụ CLS, thuốc + tài khoản KTV/dược sĩ
npm run dev                      # 7. Chạy → http://localhost:3000
```

## 4. Tài khoản demo (mật khẩu chung: `Abc@1234`)

| Vai trò | Email | Trang sau đăng nhập |
|---|---|---|
| Bệnh nhân | *tự đăng ký ở `/login`* | `/doctors` |
| Lễ tân | `letan@cbms.vn` | `/reception` |
| Bác sĩ | `bs1@cbms.vn` … `bs6@cbms.vn` | `/doctor` |
| KTV CLS | `ktv@cbms.vn` | `/lab` |
| Dược sĩ | `duocsi@cbms.vn` | `/pharmacy` |
| Thu ngân | `thungan@cbms.vn` | `/cashier` |
| Quản trị | `admin@cbms.vn` | (xem mọi trang) |

## 5. Luồng demo end-to-end

1. **Bệnh nhân** (`/login` → Đăng ký) → Tìm bác sĩ → Đặt lịch → nhận mã booking.
2. **Lễ tân** → `/reception` → **Check-in** (cấp STT).
3. **Bác sĩ** → `/doctor` → khám: sinh hiệu + chẩn đoán + chỉ định CLS + kê đơn → **Hoàn tất** (tạo hóa đơn gộp).
4. **KTV** → `/lab` → tiếp nhận phiếu → nhập kết quả → gửi bác sĩ.
5. **Dược sĩ** → `/pharmacy` → **Xuất thuốc** (trừ kho); tab **Tồn kho** xem cảnh báo.
6. **Thu ngân** → `/cashier` → **Thu tiền mặt** → hóa đơn `PAID`, cộng doanh thu ngày.

Trạng thái xuyên suốt: lịch `CONFIRMED → CHECKED_IN → IN_PROGRESS → COMPLETED`; hóa đơn `PENDING_PAYMENT → PAID`.

## 6. API chính

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/auth/register` · `/login` | Đăng ký · đăng nhập (JWT, trả role) |
| GET | `/api/me` | Hồ sơ + thống kê lịch hẹn |
| GET | `/api/specialties` · `/api/doctors` · `/api/doctors/[id]` | Chuyên khoa · danh sách/lọc · chi tiết bác sĩ |
| GET | `/api/doctors/[id]/slots` | Khung giờ trống (đã loại quá khứ) |
| POST/GET | `/api/appointments` | Đặt lịch (transaction) · lịch của tôi |
| PATCH | `/api/appointments/[id]/status` | Hủy/đổi trạng thái lịch |
| GET/POST | `/api/reception` · `/reception/checkin` | Hàng chờ tiếp đón · check-in |
| GET | `/api/doctor/queue` | Hàng chờ của bác sĩ |
| GET/POST | `/api/doctor/record[/[id]]` | Bệnh án: sinh hiệu/chẩn đoán/CLS/kê đơn/hoàn tất |
| GET | `/api/lab-tests` · `/api/medications` | Danh mục CLS · thuốc |
| GET/POST | `/api/lab` · `/lab/update` | Hàng chờ CLS · tiếp nhận/nhập KQ/gửi |
| GET/POST | `/api/pharmacy` · `/pharmacy/dispense` | Đơn chờ + tồn kho · xuất thuốc trừ kho |
| GET/POST | `/api/cashier` · `/cashier/pay` | Hóa đơn gộp · thu tiền |

## 7. Cấu trúc thư mục

```
cbms-web/
├─ prisma/
│  ├─ schema.prisma     # 14 model: User, Patient, Specialty, Doctor, ScheduleSlot, Appointment,
│  │                    #   MedicalRecord, Invoice, LabTest, LabOrder(+Item), Medication, Prescription(+Item)
│  ├─ seed.js · seed-staff.js · seed-clinical.js   # dữ liệu mẫu + tài khoản
├─ lib/                 # prisma.js (client) · auth.js (JWT+bcrypt) · roles.js (điều hướng RBAC)
├─ components/Nav.js    # thanh điều hướng theo vai trò
└─ app/
   ├─ api/**/route.js   # 24 endpoint REST (Controller/Service layer)
   ├─ login/ doctors/ doctors/[id]/ booking/ appointments/ profile/   # trang Bệnh nhân
   ├─ reception/ doctor/ doctor/[id]/ lab/ pharmacy/ cashier/         # trang Nhân viên
   └─ layout.js · page.js · globals.css
```

Quy ước App Router: **tên thư mục = URL**, `[id]` = tham số động, `page.js` = trang, `route.js` = endpoint.

## 8. Kiểm thử

Bộ test tích hợp API tự động (35 test case, 7 module) — xem `Test_Cases_BugReport_CBMS_v2.xlsx` và `Test_Plan_CBMS.md` ở thư mục dự án. Vòng 1: **35/35 Pass** sau khi sửa 2 bug (zombie slot khi hủy lịch; record API trả 500 khi thiếu tham số).

## 9. Roadmap nâng cấp

Kế hoạch nâng cấp chi tiết (Hồ sơ đa người, QR check-in, cổng thông tin kết quả cho bệnh nhân, Admin & quản lý danh mục, lịch làm việc bác sĩ, thanh toán online, hóa đơn điện tử, thông báo, báo cáo…) xem **`KE_HOACH_NANG_CAP_CBMS.md`** (P0 → P1 → P2). SRS tương ứng: `srs-cbms-v2.1.md`.

---

*Đồ án nhóm CBMS — Nhập môn Công nghệ phần mềm. Tên bảng snake_case tiếng Việt khớp DDL ở SRS mục 10.*
