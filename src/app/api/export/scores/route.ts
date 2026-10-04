import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import * as XLSX from 'xlsx';
import { isAuthError, requireRoles } from '@/lib/server-auth';

export async function GET(request: Request) {
  try {
    const actor = requireRoles(request, ['QuanTriVien', 'GiangVien']);
    if (isAuthError(actor)) return actor;
    const { searchParams } = new URL(request.url);
    const dotThucTapId = searchParams.get('dotThucTapId');
    const giangVienId = searchParams.get('giangVienId');
    const format = searchParams.get('format'); // 'excel' | 'json'

    let query = supabaseAdmin
      .from('DangKyThucTap')
      .select(`
        *,
        SinhVien:SinhVienId(*),
        DoanhNghiep:DoanhNghiepId(*),
        GiangVien:GiangVienHuongDanId(*),
        DotThucTap:DotThucTapId(*),
        KetQuaThucTap(*)
      `)
      .not('TrangThaiDangKy', 'in', '("TuChoi","DaHuy")');

    if (dotThucTapId) {
      query = query.eq('DotThucTapId', parseInt(dotThucTapId, 10));
    }
    if (actor.role === 'GiangVien') {
      if (!actor.giangVienId) return NextResponse.json({ error: 'Tài khoản chưa được liên kết giảng viên.' }, { status: 403 });
      query = query.eq('GiangVienHuongDanId', actor.giangVienId);
    } else if (giangVienId) {
      query = query.eq('GiangVienHuongDanId', parseInt(giangVienId, 10));
    }

    const { data: list, error } = await query.order('Id', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (list || []).map((item, index) => {
      const kq = Array.isArray(item.KetQuaThucTap) ? item.KetQuaThucTap[0] : item.KetQuaThucTap;
      const diemDN = kq?.TongDiemDoanhNghiep ?? 0;
      const diemGV = kq?.TongDiemGiangVien ?? 0;
      const diemTong = kq?.DiemTongKet ?? diemDN + diemGV;

      const getRank = (score: number) => {
        if (score >= 9.0) return 'Xuất sắc';
        if (score >= 8.0) return 'Giỏi';
        if (score >= 7.0) return 'Khá';
        if (score >= 5.0) return 'Trung bình';
        return 'Không đạt';
      };

      return {
        STT: index + 1,
        MSSV: item.SinhVien?.Mssv || '',
        'Họ và tên': item.SinhVien?.HoTen || '',
        Lớp: item.SinhVien?.Lop || '',
        'Chuyên ngành': item.SinhVien?.ChuyenNganh || '',
        'Doanh nghiệp thực tập': item.DoanhNghiep?.TenDoanhNghiep || '',
        'Vị trí thực tập': item.ViTriPhanCong || 'Thực tập sinh',
        'Điểm DN (Max 5.0)': diemDN,
        'Điểm GV (Max 5.0)': diemGV,
        'Điểm Tổng (Hệ 10)': diemTong,
        'Xếp loại': getRank(diemTong),
        'Giảng viên HD': item.GiangVien?.HoTen || '',
      };
    });

    if (format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'BangDiemTTTN');

      const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      return new Response(buf, {
        status: 200,
        headers: {
          'Content-Disposition': 'attachment; filename="HUIT_BangDiemThucTap.xlsx"',
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: rows,
      raw: list,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lỗi xuất bảng điểm' },
      { status: 500 }
    );
  }
}
