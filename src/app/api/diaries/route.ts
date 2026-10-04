import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAuthError, requireRoles, requireSession } from '@/lib/server-auth';
import { recordActivity } from '@/lib/activity-log';

export async function GET(request: Request) {
  try {
    const actor = requireSession(request);
    if (isAuthError(actor)) return actor;
    const { searchParams } = new URL(request.url);
    const dangKyThucTapId = searchParams.get('dangKyThucTapId');

    if (!dangKyThucTapId) {
      return NextResponse.json({ error: 'Thiếu mã hồ sơ đăng ký thực tập' }, { status: 400 });
    }
    const { data: registration, error: ownershipError } = await supabaseAdmin.from('DangKyThucTap').select('SinhVienId, GiangVienHuongDanId').eq('Id', dangKyThucTapId).maybeSingle();
    if (ownershipError) return NextResponse.json({ error: ownershipError.message }, { status: 500 });
    if (!registration) return NextResponse.json({ error: 'Không tìm thấy hồ sơ.' }, { status: 404 });
    const allowed = actor.role === 'QuanTriVien'
      || (actor.role === 'SinhVien' && actor.sinhVienId === registration.SinhVienId)
      || (actor.role === 'GiangVien' && actor.giangVienId === registration.GiangVienHuongDanId);
    if (!allowed) return NextResponse.json({ error: 'Bạn không có quyền xem nhật ký này.' }, { status: 403 });

    const { data: diaries, error } = await supabaseAdmin
      .from('NhatKyThucTap')
      .select('*')
      .eq('DangKyThucTapId', parseInt(dangKyThucTapId, 10))
      .order('TuanThu', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: diaries });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lỗi lấy nhật ký' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const actor = requireRoles(request, ['SinhVien']);
    if (isAuthError(actor)) return actor;
    const body = await request.json();
    const { DangKyThucTapId, TuanThu, NoiDungCongViec, KetQuaDatDuoc, NgayTao } = body;

    if (!DangKyThucTapId || !TuanThu || !NoiDungCongViec || !KetQuaDatDuoc) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp đầy đủ thông tin tuần, nội dung công việc và kết quả đạt được' },
        { status: 400 }
      );
    }
    const week = Number(TuanThu);
    if (!Number.isInteger(week) || week < 1 || week > 52) return NextResponse.json({ error: 'Tuần thực tập phải từ 1 đến 52.' }, { status: 400 });
    const { data: registration, error: ownershipError } = await supabaseAdmin.from('DangKyThucTap').select('SinhVienId, TrangThaiDangKy').eq('Id', DangKyThucTapId).maybeSingle();
    if (ownershipError) return NextResponse.json({ error: ownershipError.message }, { status: 500 });
    if (!registration || registration.SinhVienId !== actor.sinhVienId) return NextResponse.json({ error: 'Không tìm thấy hồ sơ của tài khoản.' }, { status: 404 });
    if (registration.TrangThaiDangKy !== 'DaDuyet') return NextResponse.json({ error: 'Chỉ hồ sơ đã được duyệt mới được ghi nhật ký.' }, { status: 409 });
    const { data: duplicate } = await supabaseAdmin.from('NhatKyThucTap').select('Id').eq('DangKyThucTapId', DangKyThucTapId).eq('TuanThu', week).maybeSingle();
    if (duplicate) return NextResponse.json({ error: `Nhật ký tuần ${week} đã được gửi.` }, { status: 409 });

    const { data: diary, error } = await supabaseAdmin
      .from('NhatKyThucTap')
      .insert([
        {
          DangKyThucTapId,
          TuanThu: week,
          NoiDungCongViec,
          KetQuaDatDuoc,
          NgayTao: NgayTao || new Date().toISOString().split('T')[0],
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await recordActivity(actor.nguoiDungId, 'NOP_NHAT_KY_THUC_TAP', `Đã gửi nhật ký tuần ${week} cho hồ sơ #${DangKyThucTapId}.`, request);
    return NextResponse.json({
      success: true,
      message: `Đã cập nhật nhật ký Tuần ${TuanThu} thành công`,
      data: diary,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lỗi thêm nhật ký thực tập' },
      { status: 500 }
    );
  }
}
