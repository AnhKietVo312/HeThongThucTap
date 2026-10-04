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
    if (!allowed) return NextResponse.json({ error: 'Bạn không có quyền xem báo cáo này.' }, { status: 403 });

    const { data: reports, error } = await supabaseAdmin
      .from('BaoCaoThucTap')
      .select('*')
      .eq('DangKyThucTapId', parseInt(dangKyThucTapId, 10))
      .order('CreatedAt', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: reports });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lỗi lấy thông tin báo cáo' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const actor = requireRoles(request, ['SinhVien']);
    if (isAuthError(actor)) return actor;
    const body = await request.json();
    const { DangKyThucTapId, DuongDanFile } = body;

    if (!DangKyThucTapId || !DuongDanFile) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp đường dẫn tệp báo cáo' },
        { status: 400 }
      );
    }
    const { data: registration, error: ownershipError } = await supabaseAdmin.from('DangKyThucTap').select('SinhVienId, TrangThaiDangKy').eq('Id', DangKyThucTapId).maybeSingle();
    if (ownershipError) return NextResponse.json({ error: ownershipError.message }, { status: 500 });
    if (!registration || registration.SinhVienId !== actor.sinhVienId) return NextResponse.json({ error: 'Không tìm thấy hồ sơ của tài khoản.' }, { status: 404 });
    if (registration.TrangThaiDangKy !== 'DaDuyet') return NextResponse.json({ error: 'Chỉ sinh viên đã được duyệt mới được nộp báo cáo.' }, { status: 409 });
    if (!String(DuongDanFile).startsWith(`reports/${actor.sinhVienId}/`)) return NextResponse.json({ error: 'Tệp báo cáo không thuộc tài khoản này.' }, { status: 400 });

    const { data: report, error } = await supabaseAdmin
      .from('BaoCaoThucTap')
      .insert([
        {
          DangKyThucTapId: parseInt(String(DangKyThucTapId), 10),
          DuongDanFile,
          TrangThaiBaoCao: 'ChoDuyet',
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await recordActivity(actor.nguoiDungId, 'NOP_BAO_CAO_THUC_TAP', `Đã nộp báo cáo cho hồ sơ #${DangKyThucTapId}.`, request);
    return NextResponse.json({
      success: true,
      message: 'Nộp báo cáo thực tập thành công. Vui lòng chờ Giảng viên hướng dẫn đánh giá.',
      data: report,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lỗi nộp báo cáo thực tập' },
      { status: 500 }
    );
  }
}
