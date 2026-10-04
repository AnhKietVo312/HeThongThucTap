import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAuthError, requireRoles } from '@/lib/server-auth';

export async function GET(request: Request) {
  const actor = requireRoles(request, ['GiangVien']);
  if (isAuthError(actor)) return actor;
  if (!actor.giangVienId) return NextResponse.json({ error: 'Tài khoản chưa liên kết hồ sơ giảng viên.' }, { status: 403 });

  const { data, error } = await supabaseAdmin
    .from('DangKyThucTap')
    .select('Id, SinhVienId, DotThucTapId, TrangThaiDangKy, NguoiHuongDanDnId, GiangVienHuongDanId, DoanhNghiepId, ViTriPhanCong, SinhVien:SinhVienId(Mssv, HoTen, Lop, ChuyenNganh), DoanhNghiep:DoanhNghiepId(TenDoanhNghiep), CongViecThucTap:CongViecId(TieuDe, TenDoanhNghiep), KetQuaThucTap(TongDiemDoanhNghiep, TongDiemGiangVien), NhatKyThucTap(TuanThu), BaoCaoThucTap(DuongDanFile, TrangThaiBaoCao, CreatedAt)')
    .eq('GiangVienHuongDanId', actor.giangVienId)
    .eq('TrangThaiDangKy', 'DaDuyet');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data: data || [] });
}
