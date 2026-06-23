'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';

export default function AdminHome() {
  const router = useRouter();
  useEffect(() => {
    const u = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
    if (!localStorage.getItem('token') || u.role !== 'ADMIN') router.push('/login');
  }, []);

  const cards = [
    ['Quản lý nhân viên', 'Tạo tài khoản, phân quyền, khóa/mở', '/admin/users'],
    ['Danh mục & bảng giá', 'Chuyên khoa, bác sĩ, dịch vụ CLS, thuốc', '/admin/catalog'],
    ['Tiếp đón', 'Theo dõi hàng chờ tiếp đón', '/reception'],
    ['Thu ngân', 'Hóa đơn & doanh thu', '/cashier'],
  ];
  return (
    <div>
      <Nav />
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-1">Trang quản trị</h1>
        <p className="text-muted mb-6">Quản lý tài khoản, danh mục và giám sát vận hành</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cards.map(([t, d, href]) => (
            <button key={href} onClick={() => router.push(href)} className="text-left bg-white rounded-2xl border border-[#F0E6E0] shadow-sm p-5 hover:shadow-md transition">
              <div className="font-bold text-lg">{t}</div>
              <div className="text-sm text-muted mt-1">{d}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
