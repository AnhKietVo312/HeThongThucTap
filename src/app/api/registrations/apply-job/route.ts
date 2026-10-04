import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAuthError, requireRoles } from '@/lib/server-auth';
import { recordActivity } from '@/lib/activity-log';

export async function POST(request: Request) {
  try {
    const actor = requireRoles(request, ['SinhVien']);
    if (isAuthError(actor)) return actor;
    const body = await request.json();
    const { registrationId, jobId } = body;

    if (!registrationId || !jobId) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp mã hồ sơ và mã công việc ứng tuyển' },
        { status: 400 }
      );
    }

    // Check if job exists and has been approved by Faculty ('DaDuyet')
    const { data: job, error: jobErr } = await supabaseAdmin
      .from('CongViecThucTap')
      .select('*, DoanhNghiep(*)')
      .eq('Id', jobId)
      .single();

    if (jobErr || !job) {
      return NextResponse.json({ error: 'Không tìm thấy thông tin công việc tuyển dụng' }, { status: 404 });
    }

    if (job.TrangThaiDuyetJob !== 'DaDuyet') {
      return NextResponse.json(
        { error: 'Công việc này chưa được Khoa phê duyệt hoặc đã bị từ chối' },
        { status: 400 }
      );
    }

    // Check if registration exists
    const { data: reg, error: regErr } = await supabaseAdmin
      .from('DangKyThucTap')
      .select('*')
      .eq('Id', registrationId)
      .single();

    if (regErr || !reg) {
      return NextResponse.json({ error: 'Không tìm thấy hồ sơ thực tập' }, { status: 404 });
    }
    if (!actor.sinhVienId || reg.SinhVienId !== actor.sinhVienId) return NextResponse.json({ error: 'Chỉ có thể nộp hồ sơ của chính mình.' }, { status: 403 });
    if (reg.TrangThaiDangKy !== 'DaDangKy') return NextResponse.json({ error: 'Hồ sơ không ở trạng thái được phép ứng tuyển.' }, { status: 409 });
    if (job.DotThucTapId !== reg.DotThucTapId) return NextResponse.json({ error: 'Tin tuyển dụng không thuộc đợt đăng ký này.' }, { status: 400 });

    const { data: batch } = await supabaseAdmin.from('DotThucTap').select('NgayBatDauDangKy, NgayKetThucDangKy').eq('Id', reg.DotThucTapId).maybeSingle();
    const now = Date.now();
    if (!batch || now < Date.parse(batch.NgayBatDauDangKy) || now > Date.parse(batch.NgayKetThucDangKy)) return NextResponse.json({ error: 'Đợt thực tập hiện không trong thời gian nhận hồ sơ.' }, { status: 409 });
    if (Date.parse(job.HanNopHoSo) < now) return NextResponse.json({ error: 'Tin tuyển dụng đã hết hạn nộp hồ sơ.' }, { status: 409 });

    // Update registration to UngTuyenJob and ChoDoanhNghiepDuyet
    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('DangKyThucTap')
      .update({
        LoaiDangKy: 'UngTuyenJob',
        CongViecId: jobId,
        DoanhNghiepId: job.DoanhNghiepId,
        ViTriPhanCong: job.TieuDe,
        NguonNhanSu: 'DanhSachKhoa',
        TrangThaiDangKy: 'ChoDoanhNghiepDuyet',
        UpdatedAt: new Date().toISOString(),
      })
      .eq('Id', registrationId)
      .select(`
        *,
        CongViecThucTap:CongViecId(*),
        DoanhNghiep:DoanhNghiepId(*)
      `)
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    await recordActivity(actor.nguoiDungId, 'UNG_TUYEN_CONG_VIEC', `Đã ứng tuyển công việc #${jobId} bằng hồ sơ #${registrationId}.`, request);
    return NextResponse.json({
      success: true,
      message: `Đã nộp hồ sơ ứng tuyển thành công vị trí "${job.TieuDe}". Hồ sơ đã chuyển đến Doanh nghiệp để xét duyệt CV.`,
      data: updated,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lỗi nộp đơn ứng tuyển job' },
      { status: 500 }
    );
  }
}
