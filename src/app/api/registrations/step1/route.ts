import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAuthError, requireRoles } from '@/lib/server-auth';
import { recordActivity } from '@/lib/activity-log';

export async function POST(request: Request) {
  try {
    const actor = requireRoles(request, ['SinhVien']);
    if (isAuthError(actor)) return actor;
    const body = await request.json();
    const {
      sinhVienId,
      dotThucTapId,
      coVanHocTap,
      diemGPA,
      viTriUngTuyenDuKien,
      nangLucChuyenMon,
      trinhDoNgoaiNgu,
      diaChiHoKhau,
      diaChiHienTai,
      duongDanCV,
      camKetChinhXac,
      camKetQuyChe,
    } = body;

    if (!sinhVienId || !dotThucTapId) {
      return NextResponse.json(
        { error: 'Thiếu thông tin sinh viên hoặc đợt thực tập' },
        { status: 400 }
      );
    }
    if (camKetChinhXac !== true || camKetQuyChe !== true) {
      return NextResponse.json({ error: 'Bạn cần xác nhận đầy đủ hai nội dung cam kết.' }, { status: 400 });
    }
    if (!actor.sinhVienId || Number(sinhVienId) !== actor.sinhVienId) return NextResponse.json({ error: 'Chỉ có thể cập nhật hồ sơ của chính mình.' }, { status: 403 });
    if (duongDanCV && !String(duongDanCV).startsWith(`cv/${actor.sinhVienId}/`)) return NextResponse.json({ error: 'CV không thuộc tài khoản này.' }, { status: 400 });
    if (diemGPA !== undefined && diemGPA !== null && (!Number.isFinite(parseFloat(String(diemGPA).replace(',', '.'))) || parseFloat(String(diemGPA).replace(',', '.')) < 0 || parseFloat(String(diemGPA).replace(',', '.')) > 4)) {
      return NextResponse.json({ error: 'GPA phải nằm trong khoảng từ 0 đến 4.' }, { status: 400 });
    }

    const { data: batch, error: batchError } = await supabaseAdmin.from('DotThucTap').select('Id, NgayBatDauDangKy, NgayKetThucDangKy').eq('Id', dotThucTapId).maybeSingle();
    if (batchError) return NextResponse.json({ error: batchError.message }, { status: 500 });
    const now = Date.now();
    if (!batch || now < Date.parse(batch.NgayBatDauDangKy) || now > Date.parse(batch.NgayKetThucDangKy)) {
      return NextResponse.json({ error: 'Đợt thực tập hiện không trong thời gian kê khai hồ sơ.' }, { status: 409 });
    }

    const gpaNum = diemGPA ? parseFloat(String(diemGPA).replace(',', '.')) : null;

    // Check if there is an existing ACTIVE registration for this student in this batch
    const { data: existingActive } = await supabaseAdmin
      .from('DangKyThucTap')
      .select('Id, TrangThaiDangKy')
      .eq('SinhVienId', sinhVienId)
      .eq('DotThucTapId', dotThucTapId)
      .in('TrangThaiDangKy', ['DaDangKy', 'ChoDoanhNghiepDuyet', 'ChoPheDuyet', 'DaDuyet'])
      .maybeSingle();

    let registrationId: number;

    if (existingActive) {
      registrationId = existingActive.Id;
      // Update existing registration timestamp
      const { error: updateError } = await supabaseAdmin
        .from('DangKyThucTap')
        .update({ UpdatedAt: new Date().toISOString() })
        .eq('Id', registrationId);
      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
    } else {
      // Create new registration with status DaDangKy
      const { data: newReg, error: regErr } = await supabaseAdmin
        .from('DangKyThucTap')
        .insert([
          {
            SinhVienId: sinhVienId,
            DotThucTapId: dotThucTapId,
            LoaiDangKy: 'UngTuyenJob',
            TrangThaiDangKy: 'DaDangKy',
          },
        ])
        .select()
        .single();

      if (regErr || !newReg) {
        return NextResponse.json(
          { error: regErr?.message || 'Không thể tạo bản ghi đăng ký thực tập' },
          { status: 500 }
        );
      }
      registrationId = newReg.Id;
    }

    // Upsert HoSoThucTap for this registrationId
    const hoSoPayload = {
      DangKyThucTapId: registrationId,
      CoVanHocTap: coVanHocTap || null,
      DiemGPA: gpaNum,
      ViTriUngTuyenDuKien: viTriUngTuyenDuKien || null,
      NangLucChuyenMon: nangLucChuyenMon || null,
      TrinhDoNgoaiNgu: trinhDoNgoaiNgu || null,
      DiaChiHoKhau: diaChiHoKhau || null,
      DiaChiHienTai: diaChiHienTai || null,
      DuongDanCV: duongDanCV || null,
      CamKetChinhXac: true,
      CamKetQuyChe: true,
      UpdatedAt: new Date().toISOString(),
    };

    const { data: existingHoSo, error: lookupError } = await supabaseAdmin
      .from('HoSoThucTap')
      .select('DangKyThucTapId')
      .eq('DangKyThucTapId', registrationId)
      .maybeSingle();
    if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 });

    if (existingHoSo) {
      const { error: saveError } = await supabaseAdmin
        .from('HoSoThucTap')
        .update(hoSoPayload)
        .eq('DangKyThucTapId', registrationId);
      if (saveError) return NextResponse.json({ error: saveError.message }, { status: 500 });
    } else {
      const { error: saveError } = await supabaseAdmin.from('HoSoThucTap').insert([hoSoPayload]);
      if (saveError) return NextResponse.json({ error: saveError.message }, { status: 500 });
    }

    await recordActivity(actor.nguoiDungId, 'CAP_NHAT_HO_SO_THUC_TAP', `Đã lưu hồ sơ cá nhân cho đăng ký #${registrationId}.`, request);
    return NextResponse.json({
      success: true,
      message: 'Hoàn tất Bước 1: Kê khai hồ sơ năng lực cá nhân thành công. Đã mở khóa Bước 2.',
      registrationId,
      status: 'DaDangKy',
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lỗi xử lý Bước 1 đăng ký thực tập' },
      { status: 500 }
    );
  }
}
