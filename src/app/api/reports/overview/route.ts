import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAuthError, requireRoles } from '@/lib/server-auth';

export async function GET(request: Request) {
  const actor = requireRoles(request, ['QuanTriVien']);
  if (isAuthError(actor)) return actor;

  const { searchParams } = new URL(request.url);
  const batchId = searchParams.get('dotThucTapId');
  let query = supabaseAdmin
    .from('DangKyThucTap')
    .select('Id, DotThucTapId, SinhVienId, DoanhNghiepId, TrangThaiDangKy, NguonNhanSu, SinhVien:SinhVienId(ChuyenNganh), BaoCaoThucTap(DangKyThucTapId, TrangThaiBaoCao, CreatedAt), KetQuaThucTap(DangKyThucTapId, DiemTongKet), NhatKyThucTap(DangKyThucTapId)');
  if (batchId && Number.isInteger(Number(batchId))) query = query.eq('DotThucTapId', Number(batchId));
  const { data: rows, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const registrations = rows || [];
  const latestReportByRegistration = new Map<number, string>();
  const grades = registrations.flatMap((row) => Array.isArray(row.KetQuaThucTap) ? row.KetQuaThucTap : row.KetQuaThucTap ? [row.KetQuaThucTap] : []);
  const diaries = registrations.flatMap((row) => Array.isArray(row.NhatKyThucTap) ? row.NhatKyThucTap : []);
  for (const registration of registrations) {
    const studentReports = Array.isArray(registration.BaoCaoThucTap) ? registration.BaoCaoThucTap : [];
    studentReports.sort((a, b) => String(b.CreatedAt || '').localeCompare(String(a.CreatedAt || '')));
    if (studentReports[0]) {
      latestReportByRegistration.set(registration.Id, studentReports[0].TrangThaiBaoCao);
    }
  }

  const byMajor = new Map<string, { total: number; approved: number }>();
  for (const row of registrations) {
    const student = Array.isArray(row.SinhVien) ? row.SinhVien[0] : row.SinhVien;
    const major = student?.ChuyenNganh || 'Chưa cập nhật chuyên ngành';
    const current = byMajor.get(major) || { total: 0, approved: 0 };
    current.total += 1;
    if (row.TrangThaiDangKy === 'DaDuyet') current.approved += 1;
    byMajor.set(major, current);
  }

  return NextResponse.json({
    success: true,
    data: {
      total: registrations.length,
      approved: registrations.filter((row) => row.TrangThaiDangKy === 'DaDuyet').length,
      pending: registrations.filter((row) => ['ChoPheDuyet', 'ChoDoanhNghiepDuyet'].includes(row.TrangThaiDangKy)).length,
      enterpriseCount: new Set(registrations.map((row) => row.DoanhNghiepId).filter(Boolean)).size,
      graded: grades.filter((row) => row.DiemTongKet != null).length,
      reportsPending: [...latestReportByRegistration.values()].filter((status) => status === 'ChoDuyet').length,
      diaryRegistrationCount: new Set(diaries.map((row) => row.DangKyThucTapId)).size,
      sourceCounts: {
        DanhSachKhoa: registrations.filter((row) => row.NguonNhanSu === 'DanhSachKhoa').length,
        TuTim: registrations.filter((row) => row.NguonNhanSu === 'TuTim').length,
        GvGioiThieu: registrations.filter((row) => row.NguonNhanSu === 'GvGioiThieu').length,
      },
      byMajor: [...byMajor.entries()].map(([name, stats]) => ({
        name,
        count: stats.total,
        percent: registrations.length ? Math.round((stats.total / registrations.length) * 100) : 0,
        complete: stats.total ? Math.round((stats.approved / stats.total) * 100) : 0,
      })),
    },
  });
}
