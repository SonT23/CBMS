import './globals.css';

export const metadata = {
  title: 'CBMS — Đặt lịch khám',
  description: 'Clinic Booking & Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
