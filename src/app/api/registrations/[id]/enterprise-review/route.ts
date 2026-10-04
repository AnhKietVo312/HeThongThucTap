import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAuthError, requireRoles } from '@/lib/server-auth';
import { recordActivity } from '@/lib/activity-log';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = requireRoles(request, ['DoanhNghiep']);
    if (isAuthError(actor)) return actor;
    const { id } = await params;
    const registrationId = parseInt(id, 10);
    const body = await request.json();
    const { action, lyDoTuChoi } = body; // action: 'Duyet' | 'TuChoi'

    if (!['Duyet', 'TuChoi'].includes(action)) {
      return NextResponse.json(
        { error: 'Thao tác xét duyệt không hợp lệ (chỉ chấp nhận Duyet hoặc TuChoi)' },
        { status: 400 }
      );
    }
    if (action === 'TuChoi' && (typeof lyDoTuChoi !== 'string' || !lyDoTuChoi.trim())) return NextResponse.json({ error: 'Cần nhập lý do từ chối hồ sơ.' }, { status: 400 });

    // Get registration details
    const { data: reg, error: regErr } = await supabaseAdmin
      .from('DangKyThucTap')
      .select('*, CongViecThucTap(*)')
      .eq('Id', registrationId)
      .single();

    if (regErr || !reg) {
      return NextResponse.json({ error: 'Không tìm thấy hồ sơ thực tập' }, { status: 404 });
    }
    if (reg.LoaiDangKy !== 'UngTuyenJob' || reg.TrangThaiDangKy !== 'ChoDoanhNghiepDuyet') {
      return NextResponse.json({ error: 'Chỉ hồ sơ ứng tuyển job đang chờ doanh nghiệp mới được xét duyệt.' }, { status: 409 });
    }
    if (!actor.doanhNghiepId || reg.DoanhNghiepId !== actor.doanhNghiepId) return NextResponse.json({ error: 'Hồ sơ không thuộc doanh nghiệp đang đăng nhập.' }, { status: 403 });

    if (action === 'Duyet') {
      const job = reg.CongViecThucTap;
      if (!job) {
        return NextResponse.json(
          { error: 'Hồ sơ không liên kết với bài đăng tuyển dụng nào' },
          { status: 400 }
        );
      }

      // RÀNG BUỘC CỨNG: Chặn duyệt thêm khi số lượng sinh viên đạt DaDuyet đã bằng SoLuongTuyen của job
      const { count: currentApprovedCount, error: countErr } = await supabaseAdmin
        .from('DangKyThucTap')
        .select('*', { count: 'exact', head: true })
        .eq('CongViecId', job.Id)
        .eq('TrangThaiDangKy', 'DaDuyet');

      if (countErr) {
        return NextResponse.json({ error: countErr.message }, { status: 500 });
      }

      const maxQuota = job.SoLuongTuyen || 1;
      if ((currentApprovedCount || 0) >= maxQuota) {
        return NextResponse.json(
          {
            error: `Không thể duyệt thêm! Vị trí "${job.TieuDe}" đã tuyển đủ chỉ tiêu (${currentApprovedCount}/${maxQuota} sinh viên).`,
          },
          { status: 400 }
        );
      }

      // Doanh nghiệp duyệt -> chuyển thẳng sang DaDuyet, đồng bộ thông tin
      const { data: updated, error: updateErr } = await supabaseAdmin
        .from('DangKyThucTap')
        .update({
          TrangThaiDangKy: 'DaDuyet',
          LyDoTuChoi: null,
          DoanhNghiepId: job.DoanhNghiepId,
          ViTriPhanCong: job.TieuDe,
          NguoiHuongDanDnId: job.NguoiHuongDanDnId || reg.NguoiHuongDanDnId,
          UpdatedAt: new Date().toISOString(),
        })
        .eq('Id', registrationId)
        .select()
        .single();

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      await recordActivity(actor.nguoiDungId, 'DOANH_NGHIEP_DUYET_UNG_VIEN', `Đã duyệt hồ sơ #${registrationId}.`, request);
      return NextResponse.json({
        success: true,
        message: 'Đã phê duyệt ứng viên trúng tuyển. Hồ sơ đã chính thức ĐẠT CHUẨN (DaDuyet).',
        data: updated,
      });
    } else {
      // Doanh nghiệp từ chối
      const { data: updated, error: updateErr } = await supabaseAdmin
        .from('DangKyThucTap')
        .update({
          TrangThaiDangKy: 'TuChoi',
          LyDoTuChoi: lyDoTuChoi.trim(),
          UpdatedAt: new Date().toISOString(),
        })
        .eq('Id', registrationId)
        .select()
        .single();

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      await recordActivity(actor.nguoiDungId, 'DOANH_NGHIEP_TU_CHOI_UNG_VIEN', `Đã từ chối hồ sơ #${registrationId}.`, request);
      return NextResponse.json({
        success: true,
        message: 'Đã từ chối hồ sơ ứng viên. Sinh viên có thể nộp lại đơn mới.',
        data: updated,
      });
    }
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lỗi xử lý duyệt hồ sơ từ doanh nghiệp' },
      { status: 500 }
    );
  }
}
