import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAuthError, requireRoles } from '@/lib/server-auth';
import { recordActivity } from '@/lib/activity-log';

export async function POST(request: Request) {
  try {
    const actor = requireRoles(request, ['QuanTriVien']);
    if (isAuthError(actor)) return actor;
    const body = await request.json();
    const { registrationIds, giangVienId, dotThucTapId } = body;

    // Support single or multiple registrationIds
    const regIds: number[] = Array.isArray(registrationIds)
      ? registrationIds.map((id: string | number) => parseInt(String(id), 10))
      : [parseInt(String(registrationIds), 10)];

    if (!regIds.length || isNaN(regIds[0]) || !giangVienId || !dotThucTapId) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp đầy đủ danh sách sinh viên, giảng viên hướng dẫn và đợt thực tập' },
        { status: 400 }
      );
    }
    if (regIds.some((id) => !Number.isInteger(id) || id <= 0) || new Set(regIds).size !== regIds.length) {
      return NextResponse.json({ error: 'Danh sách hồ sơ không hợp lệ hoặc bị trùng.' }, { status: 400 });
    }

    // 1. Fetch lecturer information
    const { data: gv, error: gvErr } = await supabaseAdmin
      .from('GiangVien')
      .select('Id, HoTen, MaGiangVien')
      .eq('Id', giangVienId)
      .single();

    if (gvErr || !gv) {
      return NextResponse.json({ error: 'Không tìm thấy giảng viên được chọn' }, { status: 404 });
    }

    const { data: requestedRegistrations, error: requestedError } = await supabaseAdmin
      .from('DangKyThucTap')
      .select('Id, DotThucTapId, TrangThaiDangKy, GiangVienHuongDanId')
      .in('Id', regIds);
    if (requestedError) return NextResponse.json({ error: requestedError.message }, { status: 500 });
    if ((requestedRegistrations || []).length !== regIds.length || requestedRegistrations!.some((registration) => registration.DotThucTapId !== Number(dotThucTapId) || registration.TrangThaiDangKy !== 'DaDuyet' || registration.GiangVienHuongDanId)) {
      return NextResponse.json({ error: 'Chỉ được phân công hồ sơ đã duyệt, chưa có GVHD và cùng đợt.' }, { status: 409 });
    }

    // 2. RÀNG BUỘC CỨNG: Kiểm soát tối đa 30 sinh viên trên 1 giảng viên trong mỗi đợt
    const { count: currentCount, error: countErr } = await supabaseAdmin
      .from('DangKyThucTap')
      .select('*', { count: 'exact', head: true })
      .eq('DotThucTapId', dotThucTapId)
      .eq('GiangVienHuongDanId', giangVienId)
      .not('TrangThaiDangKy', 'in', '("TuChoi","DaHuy")');

    if (countErr) {
      return NextResponse.json({ error: countErr.message }, { status: 500 });
    }

    const assignedCount = currentCount || 0;
    const requestedCount = requestedRegistrations?.length || 0;
    const MAX_QUOTA = 30;

    if (assignedCount + requestedCount > MAX_QUOTA) {
      return NextResponse.json(
        {
          error: `VƯỢT ĐỊNH MỨC QUY ĐỊNH! Giảng viên ${gv.HoTen} hiện đã hướng dẫn ${assignedCount}/${MAX_QUOTA} sinh viên. Chỉ có thể phân công thêm tối đa ${Math.max(0, MAX_QUOTA - assignedCount)} sinh viên nữa trong đợt này.`,
          currentCount: assignedCount,
          maxCount: MAX_QUOTA,
          exceededBy: assignedCount + requestedCount - MAX_QUOTA,
        },
        { status: 400 }
      );
    }

    // 3. Thực hiện phân công
    const { data: updatedList, error: updateErr } = await supabaseAdmin
      .from('DangKyThucTap')
      .update({
        GiangVienHuongDanId: giangVienId,
        UpdatedAt: new Date().toISOString(),
      })
      .in('Id', regIds)
      .select();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    await recordActivity(actor.nguoiDungId, 'PHAN_CONG_GIANG_VIEN', `Đã phân công giảng viên #${giangVienId} cho ${regIds.length} hồ sơ trong đợt #${dotThucTapId}.`, request);
    return NextResponse.json({
      success: true,
      message: `Phân công thành công ${regIds.length} sinh viên cho Giảng viên ${gv.HoTen} (Đã nhận: ${assignedCount + requestedCount}/${MAX_QUOTA}).`,
      data: updatedList,
      newTotalCount: assignedCount + requestedCount,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lỗi phân công giảng viên hướng dẫn' },
      { status: 500 }
    );
  }
}
