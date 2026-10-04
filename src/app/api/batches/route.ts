import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAuthError, requireRoles, requireSession } from '@/lib/server-auth';
import { recordActivity } from '@/lib/activity-log';

export async function GET(request: Request) {
  try {
    const actor = requireSession(request);
    if (isAuthError(actor)) return actor;
    const { data: batches, error } = await supabaseAdmin
      .from('DotThucTap')
      .select('*, GiangVien:TaoBoiGiangVienId(HoTen, MaGiangVien)')
      .order('CreatedAt', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: batches });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lỗi lấy danh sách đợt' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const actor = requireRoles(request, ['QuanTriVien', 'GiangVien']);
    if (isAuthError(actor)) return actor;
    const body = await request.json();
    const {
      NamHoc,
      ThuTuDot = 'Dot1',
      NgayBatDauDangKy,
      NgayKetThucDangKy,
      NgayBatDau,
      NgayKetThuc,
      TaoBoiGiangVienId,
    } = body;

    if (!NamHoc || !NgayBatDauDangKy || !NgayKetThucDangKy || !NgayBatDau || !NgayKetThuc || !TaoBoiGiangVienId) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ thông tin đợt thực tập' },
        { status: 400 }
      );
    }
    if (!actor.giangVienId || Number(TaoBoiGiangVienId) !== actor.giangVienId) {
      return NextResponse.json({ error: 'Đợt thực tập phải được tạo bởi giảng viên đang đăng nhập.' }, { status: 403 });
    }

    // Kiểm tra quyền tổ chức: Chỉ Quản trị Khoa (TruongKhoa) hoặc Giảng viên có CoQuyenToChuc = true
    const registrationStart = Date.parse(NgayBatDauDangKy);
    const registrationEnd = Date.parse(NgayKetThucDangKy);
    const internshipStart = Date.parse(NgayBatDau);
    const internshipEnd = Date.parse(NgayKetThuc);
    const validAcademicYear = /^\d{4}-\d{4}$/.test(String(NamHoc))
      && Number(String(NamHoc).slice(5)) === Number(String(NamHoc).slice(0, 4)) + 1;
    if (!validAcademicYear || ![registrationStart, registrationEnd, internshipStart, internshipEnd].every(Number.isFinite)
      || registrationStart >= registrationEnd || registrationEnd > internshipStart || internshipStart >= internshipEnd
      || !['Dot1', 'Dot2', 'Dot3', 'DotDuPhong'].includes(ThuTuDot)) {
      return NextResponse.json({ error: 'Thời gian hoặc thứ tự đợt thực tập không hợp lệ.' }, { status: 400 });
    }

    const defaultRubrics = [
      {
        Stt: 1,
        NoiDungDanhGia: 'Ý thức tổ chức kỷ luật, chấp hành nội quy và thái độ làm việc tại doanh nghiệp',
        DiemToiDa: 2.0,
        Clo: 'CLO4.1',
        NguoiCham: 'DoanhNghiep',
      },
      {
        Stt: 2,
        NoiDungDanhGia: 'Năng lực chuyên môn, kỹ năng giải quyết vấn đề và mức độ hoàn thành công việc được giao',
        DiemToiDa: 3.0,
        Clo: 'CLO4.2',
        NguoiCham: 'DoanhNghiep',
      },
      {
        Stt: 3,
        NoiDungDanhGia: 'Hình thức, bố cục báo cáo và tính chuẩn xác của hồ sơ thực tập tốt nghiệp',
        DiemToiDa: 1.0,
        Clo: 'CLO1.1',
        NguoiCham: 'GiangVien',
      },
      {
        Stt: 4,
        NoiDungDanhGia: 'Hàm lượng kỹ thuật, kiến thức chuyên ngành và giải pháp công nghệ vận dụng trong đề tài',
        DiemToiDa: 2.5,
        Clo: 'CLO2.1',
        NguoiCham: 'GiangVien',
      },
      {
        Stt: 5,
        NoiDungDanhGia: 'Đánh giá quá trình, tính trung thực trong nhật ký thực tập và khả năng trình bày tổng kết',
        DiemToiDa: 1.5,
        Clo: 'CLO3.1',
        NguoiCham: 'GiangVien',
      },
    ];

    const { data: newBatch, error: batchErr } = await supabaseAdmin.rpc('create_internship_batch_with_rubric', {
      p_nam_hoc: NamHoc,
      p_thu_tu_dot: ThuTuDot,
      p_ngay_bat_dau_dang_ky: NgayBatDauDangKy,
      p_ngay_ket_thuc_dang_ky: NgayKetThucDangKy,
      p_ngay_bat_dau: NgayBatDau,
      p_ngay_ket_thuc: NgayKetThuc,
      p_tao_boi_giang_vien_id: Number(TaoBoiGiangVienId),
      p_is_admin: actor.role === 'QuanTriVien',
      p_default_rubrics: defaultRubrics,
    });

    if (batchErr || !newBatch) {
      const errorText = [batchErr?.message, batchErr?.details, batchErr?.hint].filter(Boolean).join(' ');
      if (batchErr?.code === '23505' && errorText.includes('DotThucTap_pkey')) {
        return NextResponse.json(
          { error: 'DotThucTap identity sequence is out of sync. Run supabase/migrations/20261004_repair_dot_thuc_tap_sequence.sql in the Supabase SQL Editor, then retry.' },
          { status: 500 }
        );
      }
      if (batchErr?.code === '23505' && errorText.includes('TieuChiChamDiem_pkey')) {
        return NextResponse.json(
          { error: 'TieuChiChamDiem identity sequence is out of sync. Run the updated supabase/migrations/20261004_repair_dot_thuc_tap_sequence.sql in the Supabase SQL Editor, then retry.' },
          { status: 500 }
        );
      }
      if (batchErr?.code === '42501') return NextResponse.json({ error: 'This account is not allowed to organize internship batches.' }, { status: 403 });
      if (batchErr?.code === 'PGRST202') return NextResponse.json({ error: 'The batch creation function is not installed. Run supabase/migrations/20261004_repair_dot_thuc_tap_sequence.sql in SQL Editor.' }, { status: 503 });
      return NextResponse.json({ error: batchErr?.message || 'Unable to create internship batch.' }, { status: 500 });
    }

    void recordActivity(actor.nguoiDungId, 'TAO_DOT_THUC_TAP', `Created internship batch ${newBatch.TenDot} (#${newBatch.Id}).`, request);
    return NextResponse.json({
      success: true,
      message: 'Tổ chức đợt thực tập thành công',
      data: newBatch,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lỗi tạo đợt thực tập' },
      { status: 500 }
    );
  }
}
