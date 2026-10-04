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
    const diaryId = parseInt(id, 10);
    const body = await request.json();
    const { nhanXetGv } = body;
    if (typeof nhanXetGv !== 'string' || !nhanXetGv.trim()) return NextResponse.json({ error: 'Vui lòng nhập nhận xét.' }, { status: 400 });

    const { data: diary, error: diaryError } = await supabaseAdmin.from('NhatKyThucTap').select('Id, DangKyThucTapId').eq('Id', diaryId).maybeSingle();
    if (diaryError) return NextResponse.json({ error: diaryError.message }, { status: 500 });
    if (!diary) return NextResponse.json({ error: 'Không tìm thấy nhật ký.' }, { status: 404 });
    const { data: registration, error: registrationError } = await supabaseAdmin.from('DangKyThucTap').select('GiangVienHuongDanId').eq('Id', diary.DangKyThucTapId).maybeSingle();
    if (registrationError) return NextResponse.json({ error: registrationError.message }, { status: 500 });
    if (!registration || registration.GiangVienHuongDanId !== actor.giangVienId) return NextResponse.json({ error: 'Nhật ký không thuộc sinh viên bạn hướng dẫn.' }, { status: 403 });

    const { data: updated, error } = await supabaseAdmin
      .from('NhatKyThucTap')
      .update({
        NhanXetCuaGiangVien: nhanXetGv.trim(),
        UpdatedAt: new Date().toISOString(),
      })
      .eq('Id', diaryId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await recordActivity(actor.nguoiDungId, 'NHAN_XET_NHAT_KY', `Đã nhận xét nhật ký #${diaryId}.`, request);
    return NextResponse.json({
      success: true,
      message: 'Đã lưu nhận xét nhật ký của giảng viên',
      data: updated,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lỗi cập nhật nhận xét nhật ký' },
      { status: 500 }
    );
  }
}
