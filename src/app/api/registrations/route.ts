import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAuthError, requireSession } from '@/lib/server-auth';

export async function GET(request: Request) {
  try {
    const actor = requireSession(request);
    if (isAuthError(actor)) return actor;
    const { searchParams } = new URL(request.url);
    const sinhVienId = searchParams.get('sinhVienId');
    const dotThucTapId = searchParams.get('dotThucTapId');
    const congViecId = searchParams.get('congViecId');
    const doanhNghiepId = searchParams.get('doanhNghiepId');
    const giangVienId = searchParams.get('giangVienId');
    const trangThai = searchParams.get('trangThai');
    const loaiDangKy = searchParams.get('loaiDangKy');

    let query = supabaseAdmin
      .from('DangKyThucTap')
      .select(`
        *,
        SinhVien:SinhVienId(*),
        HoSoThucTap:HoSoThucTap(*),
        CongViecThucTap:CongViecId(*),
        DoanhNghiep:DoanhNghiepId(*),
        NguoiHuongDanDoanhNghiep:NguoiHuongDanDnId(*),
        GiangVien:GiangVienHuongDanId(*),
        DotThucTap:DotThucTapId(*)
      `);

    if (sinhVienId) {
      query = query.eq('SinhVienId', parseInt(sinhVienId, 10));
    }
    if (actor.role === 'SinhVien') {
      if (!actor.sinhVienId) return NextResponse.json({ error: 'Tài khoản chưa được liên kết hồ sơ sinh viên.' }, { status: 403 });
      query = query.eq('SinhVienId', actor.sinhVienId);
    } else if (actor.role === 'DoanhNghiep') {
      if (!actor.doanhNghiepId) return NextResponse.json({ error: 'Tài khoản chưa được liên kết doanh nghiệp.' }, { status: 403 });
      query = query.eq('DoanhNghiepId', actor.doanhNghiepId);
    } else if (actor.role === 'GiangVien') {
      if (!actor.giangVienId) return NextResponse.json({ error: 'Tài khoản chưa được liên kết giảng viên.' }, { status: 403 });
      query = query.eq('GiangVienHuongDanId', actor.giangVienId);
    }
    if (dotThucTapId) {
      query = query.eq('DotThucTapId', parseInt(dotThucTapId, 10));
    }
    if (congViecId) {
      query = query.eq('CongViecId', parseInt(congViecId, 10));
    }
    if (doanhNghiepId) {
      query = query.eq('DoanhNghiepId', parseInt(doanhNghiepId, 10));
    }
    if (giangVienId) {
      query = query.eq('GiangVienHuongDanId', parseInt(giangVienId, 10));
    }
    if (trangThai) {
      query = query.eq('TrangThaiDangKy', trangThai);
    }
    if (loaiDangKy) {
      query = query.eq('LoaiDangKy', loaiDangKy);
    }

    const { data: list, error } = await query.order('CreatedAt', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Format joined payload to match frontend conventions
    const formatted = (list || []).map((item) => {
      const hoSo = Array.isArray(item.HoSoThucTap) ? item.HoSoThucTap[0] : item.HoSoThucTap;
      return {
        ...item,
        sinhVien: item.SinhVien,
        hoSoThucTap: hoSo,
        congViec: item.CongViecThucTap,
        doanhNghiep: item.DoanhNghiep,
        mentorDn: item.NguoiHuongDanDoanhNghiep,
        giangVienHuongDan: item.GiangVien,
        dotThucTap: item.DotThucTap,
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lỗi lấy danh sách hồ sơ thực tập' },
      { status: 500 }
    );
  }
}
