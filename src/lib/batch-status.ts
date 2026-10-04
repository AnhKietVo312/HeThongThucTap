import { DotThucTap } from '@/types/database.types';

export function getBatchDisplayStatus(batch: DotThucTap): { label: string; className: string } {
  const now = Date.now();
  const registrationStart = Date.parse(batch.NgayBatDauDangKy);
  const registrationEnd = Date.parse(batch.NgayKetThucDangKy);
  const internshipStart = Date.parse(batch.NgayBatDau);
  const internshipEnd = Date.parse(batch.NgayKetThuc);

  if (![registrationStart, registrationEnd, internshipStart, internshipEnd].every(Number.isFinite)) {
    return { label: 'Chưa xác định', className: 'bg-gray-100 text-gray-700 border border-gray-200' };
  }
  if (now < registrationStart) {
    return { label: 'Chưa mở đăng ký', className: 'bg-gray-100 text-gray-700 border border-gray-200' };
  }
  if (now <= registrationEnd) {
    return { label: 'Đang mở đăng ký', className: 'bg-blue-50 text-huit-blue border border-blue-200' };
  }
  if (now < internshipStart) {
    return { label: 'Chờ bắt đầu thực tập', className: 'bg-amber-50 text-amber-800 border border-amber-200' };
  }
  if (now <= internshipEnd) {
    return { label: 'Đang diễn ra', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
  }
  return { label: 'Đã kết thúc', className: 'bg-gray-100 text-gray-600 border border-gray-200' };
}
