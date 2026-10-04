import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAuthError, requireRoles } from '@/lib/server-auth';
import { recordActivity } from '@/lib/activity-log';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = requireRoles(request, ['QuanTriVien']);
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

    if (action === 'TuChoi' && !lyDoTuChoi) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp lý do từ chối hồ sơ' },
        { status: 400 }
      );
    }

    const { data: registration, error: registrationError } = await supabaseAdmin
      .from('DangKyThucTap')
      .select('Id, LoaiDangKy, TrangThaiDangKy, DoanhNghiepId')
      .eq('Id', registrationId)
      .maybeSingle();
    if (registrationError) return NextResponse.json({ error: registrationError.message }, { status: 500 });
    if (!registration) return NextResponse.json({ error: 'Không tìm thấy hồ sơ thực tập.' }, { status: 404 });
    if (registration.LoaiDangKy !== 'NgoaiTruong' || registration.TrangThaiDangKy !== 'ChoPheDuyet') {
      return NextResponse.json({ error: 'Chỉ hồ sơ ngoài trường đang chờ Khoa mới được xét duyệt.' }, { status: 409 });
    }

    const updatePayload: {
      TrangThaiDangKy: 'DaDuyet' | 'TuChoi';
      UpdatedAt: string;
      LyDoTuChoi: string | null;
    } = {
      TrangThaiDangKy: action === 'Duyet' ? 'DaDuyet' : 'TuChoi',
      UpdatedAt: new Date().toISOString(),
      LyDoTuChoi: action === 'Duyet' ? null : String(lyDoTuChoi).trim(),
    };

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('DangKyThucTap')
      .update(updatePayload)
      .eq('Id', registrationId)
      .select(`
        *,
        SinhVien:SinhVienId(*),
        DoanhNghiep:DoanhNghiepId(*),
        NguoiHuongDanDoanhNghiep:NguoiHuongDanDnId(*)
      `)
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // If approved, also set DoanhNghiep TrangThaiChuan = true if not set
    if (action === 'Duyet' && updated.DoanhNghiepId) {
      const { error: enterpriseError } = await supabaseAdmin
        .from('DoanhNghiep')
        .update({ TrangThaiChuan: true })
        .eq('Id', updated.DoanhNghiepId);
      if (enterpriseError) return NextResponse.json({ error: enterpriseError.message }, { status: 500 });
    }

    await recordActivity(actor.nguoiDungId, action === 'Duyet' ? 'KHOA_DUYET_HO_SO' : 'KHOA_TU_CHOI_HO_SO', `Đã ${action === 'Duyet' ? 'duyệt' : 'từ chối'} hồ sơ #${registrationId}.`, request);
    return NextResponse.json({
      success: true,
      message: action === 'Duyet' ? 'Khoa đã phê duyệt hồ sơ ngoài trường thành công!' : 'Đã từ chối hồ sơ',
      data: updated,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lỗi xử lý duyệt hồ sơ từ Khoa' },
      { status: 500 }
    );
  }
}
