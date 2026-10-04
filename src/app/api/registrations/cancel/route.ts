import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAuthError, requireRoles } from '@/lib/server-auth';
import { recordActivity } from '@/lib/activity-log';

export async function POST(request: Request) {
  try {
    const actor = requireRoles(request, ['SinhVien']);
    if (isAuthError(actor)) return actor;
    const body = await request.json();
    const { registrationId } = body;

    if (!registrationId) {
      return NextResponse.json({ error: 'Thiếu mã hồ sơ cần hủy' }, { status: 400 });
    }

    const { data: registration, error: lookupError } = await supabaseAdmin.from('DangKyThucTap').select('SinhVienId, TrangThaiDangKy').eq('Id', registrationId).maybeSingle();
    if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 });
    if (!registration || registration.SinhVienId !== actor.sinhVienId) return NextResponse.json({ error: 'Không tìm thấy hồ sơ của tài khoản.' }, { status: 404 });
    if (!['DaDangKy', 'ChoDoanhNghiepDuyet', 'ChoPheDuyet'].includes(registration.TrangThaiDangKy)) return NextResponse.json({ error: 'Hồ sơ không thể hủy ở trạng thái hiện tại.' }, { status: 409 });

    const { data: updated, error } = await supabaseAdmin
      .from('DangKyThucTap')
      .update({
        TrangThaiDangKy: 'DaHuy',
        UpdatedAt: new Date().toISOString(),
      })
      .eq('Id', registrationId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await recordActivity(actor.nguoiDungId, 'HUY_DANG_KY_THUC_TAP', `Đã hủy hồ sơ đăng ký #${registrationId}.`, request);
    return NextResponse.json({
      success: true,
      message: 'Đã hủy hồ sơ thành công. Bạn có thể đăng ký lại nguyện vọng mới trong đợt này.',
      data: updated,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lỗi hủy hồ sơ' },
      { status: 500 }
    );
  }
}
