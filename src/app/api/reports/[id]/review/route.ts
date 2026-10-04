import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAuthError, requireRoles } from '@/lib/server-auth';
import { recordActivity } from '@/lib/activity-log';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = requireRoles(request, ['GiangVien']);
    if (isAuthError(actor)) return actor;
    const { id } = await params;
    const reportId = parseInt(id, 10);
    const body = await request.json();
    const { trangThaiBaoCao, nhanXetCuaGiangVien } = body;

    if (!['ChoDuyet', 'DatChuan', 'YeuCauLamLai'].includes(trangThaiBaoCao)) {
      return NextResponse.json(
        { error: 'Trạng thái báo cáo không hợp lệ (ChoDuyet, DatChuan, YeuCauLamLai)' },
        { status: 400 }
      );
    }

    if (trangThaiBaoCao === 'ChoDuyet') return NextResponse.json({ error: 'Không thể đưa báo cáo đã xét duyệt về trạng thái chờ.' }, { status: 409 });
    const { data: existing, error: lookupError } = await supabaseAdmin.from('BaoCaoThucTap').select('Id, DangKyThucTapId, TrangThaiBaoCao').eq('Id', reportId).maybeSingle();
    if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 });
    if (!existing || existing.TrangThaiBaoCao !== 'ChoDuyet') return NextResponse.json({ error: 'Báo cáo không còn ở trạng thái chờ duyệt.' }, { status: 409 });
    const { data: registration, error: registrationError } = await supabaseAdmin.from('DangKyThucTap').select('GiangVienHuongDanId').eq('Id', existing.DangKyThucTapId).maybeSingle();
    if (registrationError) return NextResponse.json({ error: registrationError.message }, { status: 500 });
    if (!registration || registration.GiangVienHuongDanId !== actor.giangVienId) return NextResponse.json({ error: 'Báo cáo không thuộc sinh viên bạn hướng dẫn.' }, { status: 403 });

    const { data: updated, error } = await supabaseAdmin
      .from('BaoCaoThucTap')
      .update({
        TrangThaiBaoCao: trangThaiBaoCao,
        NhanXetCuaGiangVien: nhanXetCuaGiangVien || null,
        UpdatedAt: new Date().toISOString(),
      })
      .eq('Id', reportId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await recordActivity(actor.nguoiDungId, 'DUYET_BAO_CAO_THUC_TAP', `Đã cập nhật báo cáo #${reportId} thành ${trangThaiBaoCao}.`, request);
    return NextResponse.json({
      success: true,
      message: `Đã cập nhật đánh giá báo cáo: ${trangThaiBaoCao === 'DatChuan' ? 'ĐẠT CHUẨN' : trangThaiBaoCao === 'YeuCauLamLai' ? 'YÊU CẦU LÀM LẠI' : 'CHỜ DUYỆT'}`,
      data: updated,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lỗi đánh giá báo cáo' },
      { status: 500 }
    );
  }
}
