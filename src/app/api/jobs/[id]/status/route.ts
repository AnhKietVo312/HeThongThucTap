import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAuthError, requireRoles } from '@/lib/server-auth';
import { recordActivity } from '@/lib/activity-log';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = requireRoles(request, ['QuanTriVien', 'GiangVien']);
    if (isAuthError(actor)) return actor;
    const { id } = await params;
    const { data: existingJob, error: lookupError } = await supabaseAdmin.from('CongViecThucTap').select('Id, DoanhNghiepId, TrangThaiDuyetJob').eq('Id', id).maybeSingle();
    if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 });
    if (!existingJob) return NextResponse.json({ error: 'Không tìm thấy tin tuyển dụng.' }, { status: 404 });
    if (actor.role === 'GiangVien' && !actor.coQuyenToChuc) return NextResponse.json({ error: 'Bạn không có quyền duyệt tin tuyển dụng.' }, { status: 403 });
    const jobId = parseInt(id, 10);
    const body = await request.json();
    const { status, lyDoTuChoi } = body;

    if (!['ChoKhoaDuyet', 'DaDuyet', 'TuChoi'].includes(status)) {
      return NextResponse.json(
        { error: 'Trạng thái không hợp lệ.' },
        { status: 400 }
      );
    }

    const permittedTransition = status === 'ChoKhoaDuyet'
      ? existingJob.TrangThaiDuyetJob === 'DaDuyet'
      : existingJob.TrangThaiDuyetJob === 'ChoKhoaDuyet';
    if (!permittedTransition) return NextResponse.json({ error: 'Tin tuyển dụng đã được xét duyệt trước đó.' }, { status: 409 });

    if (status === 'TuChoi' && (typeof lyDoTuChoi !== 'string' || !lyDoTuChoi.trim())) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp lý do từ chối tin tuyển dụng' },
        { status: 400 }
      );
    }

    const updatePayload: {
      TrangThaiDuyetJob: 'ChoKhoaDuyet' | 'DaDuyet' | 'TuChoi';
      LyDoTuChoi?: string | null;
      UpdatedAt: string;
    } = {
      TrangThaiDuyetJob: status,
      LyDoTuChoi: status === 'TuChoi' ? lyDoTuChoi.trim() : null,
      UpdatedAt: new Date().toISOString(),
    };

    const { data: updatedJob, error } = await supabaseAdmin
      .from('CongViecThucTap')
      .update(updatePayload)
      .eq('Id', jobId)
      .select(`
        *,
        DoanhNghiep:DoanhNghiepId(*),
        NguoiHuongDan:NguoiHuongDanDnId(*)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await recordActivity(actor.nguoiDungId, 'CAP_NHAT_TRANG_THAI_TUYEN_DUNG', `Đã cập nhật tin tuyển dụng #${jobId} thành ${status}.`, request);
    return NextResponse.json({
      success: true,
      message: status === 'DaDuyet' ? 'Đã duyệt tin tuyển dụng thành công và công khai lên Sàn' : status === 'TuChoi' ? 'Đã từ chối tin tuyển dụng' : 'Đã thu hồi phê duyệt tin tuyển dụng',
      data: updatedJob,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lỗi cập nhật trạng thái tin tuyển dụng' },
      { status: 500 }
    );
  }
}
