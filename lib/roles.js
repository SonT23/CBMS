// Helper điều hướng & nhãn theo vai trò (dùng ở client).
export const ROLE_LABEL = {
  PATIENT: 'Bệnh nhân',
  RECEPTIONIST: 'Lễ tân',
  DOCTOR: 'Bác sĩ',
  LAB_TECH: 'KTV CLS',
  PHARMACIST: 'Dược sĩ',
  CASHIER: 'Thu ngân',
  ADMIN: 'Quản trị',
};

export function homeForRole(role) {
  switch (role) {
    case 'RECEPTIONIST': return '/reception';
    case 'DOCTOR': return '/doctor';
    case 'LAB_TECH': return '/lab';
    case 'PHARMACIST': return '/pharmacy';
    case 'CASHIER': return '/cashier';
    case 'ADMIN': return '/admin';
    default: return '/doctors';
  }
}

// Link điều hướng hiển thị trên Nav theo vai trò.
export function navLinks(role) {
  switch (role) {
    case 'RECEPTIONIST': return [['/reception', 'Tiếp đón']];
    case 'DOCTOR': return [['/doctor', 'Phòng khám'], ['/doctor/schedule', 'Lịch làm việc']];
    case 'LAB_TECH': return [['/lab', 'Cận lâm sàng']];
    case 'PHARMACIST': return [['/pharmacy', 'Nhà thuốc']];
    case 'CASHIER': return [['/cashier', 'Thu ngân']];
    case 'ADMIN': return [['/admin', 'Tổng quan'], ['/admin/users', 'Nhân viên'], ['/admin/catalog', 'Danh mục'], ['/reception', 'Tiếp đón'], ['/cashier', 'Thu ngân']];
    default: return [['/doctors', 'Tìm bác sĩ'], ['/appointments', 'Lịch hẹn của tôi'], ['/history', 'Lịch sử khám'], ['/profiles', 'Hồ sơ']];
  }
}
