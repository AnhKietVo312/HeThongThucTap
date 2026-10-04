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
      registrationId,
      nguonNhanSu = 'TuTim',
      giaoVienGioiThieu,
      tenDoanhNghiep,
      maSoThue,
      diaChi,
      viTriPhanCong,
      mentorTen,
      mentorSdt,
      mentorEmail,
    } = body;

    if (!registrationId || !tenDoanhNghiep || !maSoThue || !diaChi || !viTriPhanCong) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp đầy đủ thông tin doanh nghiệp, mã số thuế, địa chỉ và vị trí thực tập' },
        { status: 400 }
      );
    }
    if (!actor.sinhVienId) return NextResponse.json({ error: 'Tài khoản chưa được liên kết hồ sơ sinh viên.' }, { status: 403 });
    const { data: registration, error: registrationError } = await supabaseAdmin.from('DangKyThucTap').select('Id, SinhVienId, DotThucTapId, TrangThaiDangKy').eq('Id', registrationId).maybeSingle();
    if (registrationError) return NextResponse.json({ error: registrationError.message }, { status: 500 });
    if (!registration || registration.SinhVienId !== actor.sinhVienId) return NextResponse.json({ error: 'Không tìm thấy hồ sơ của tài khoản.' }, { status: 404 });
    if (registration.TrangThaiDangKy !== 'DaDangKy') return NextResponse.json({ error: 'Hồ sơ không ở trạng thái được phép khai báo doanh nghiệp.' }, { status: 409 });
    const { data: batch } = await supabaseAdmin.from('DotThucTap').select('NgayBatDauDangKy, NgayKetThucDangKy').eq('Id', registration.DotThucTapId).maybeSingle();
    const now = Date.now();
    if (!batch || now < Date.parse(batch.NgayBatDauDangKy) || now > Date.parse(batch.NgayKetThucDangKy)) return NextResponse.json({ error: 'Đợt thực tập hiện không trong thời gian nhận hồ sơ.' }, { status: 409 });
    if (!['TuTim', 'GvGioiThieu'].includes(nguonNhanSu) || (nguonNhanSu === 'GvGioiThieu' && !giaoVienGioiThieu?.trim())) return NextResponse.json({ error: 'Vui lòng chọn nguồn nhân sự hợp lệ và khai tên giảng viên giới thiệu.' }, { status: 400 });

    // 1. Find or create DoanhNghiep
    let doanhNghiepId: number;
    const { data: existingDn } = await supabaseAdmin
      .from('DoanhNghiep')
      .select('Id')
      .eq('MaSoThue', maSoThue.trim())
      .maybeSingle();

    if (existingDn) {
      doanhNghiepId = existingDn.Id;
    } else {
      const { data: newDn, error: dnErr } = await supabaseAdmin
        .from('DoanhNghiep')
        .insert([
          {
            TenDoanhNghiep: tenDoanhNghiep.trim(),
            MaSoThue: maSoThue.trim(),
            DiaChi: diaChi.trim(),
            TrangThaiChuan: false, // Doanh nghiệp ngoài trường cần Khoa thẩm định
          },
        ])
        .select()
        .single();

      if (dnErr || !newDn) {
        return NextResponse.json({ error: dnErr?.message || 'Không thể tạo thông tin doanh nghiệp' }, { status: 500 });
      }
      doanhNghiepId = newDn.Id;
    }

    // 2. Find or create NguoiHuongDanDoanhNghiep
    let mentorId: number | null = null;
    if (mentorTen) {
      const { data: existingMentor } = await supabaseAdmin
        .from('NguoiHuongDanDoanhNghiep')
        .select('Id')
        .eq('DoanhNghiepId', doanhNghiepId)
        .eq('HoTen', mentorTen.trim())
        .maybeSingle();

      if (existingMentor) {
        mentorId = existingMentor.Id;
      } else {
        const { data: newMentor } = await supabaseAdmin
          .from('NguoiHuongDanDoanhNghiep')
          .insert([
            {
              DoanhNghiepId: doanhNghiepId,
              HoTen: mentorTen.trim(),
              SoDienThoai: mentorSdt ? mentorSdt.trim() : null,
              Email: mentorEmail ? mentorEmail.trim() : null,
            },
          ])
          .select()
          .single();

        if (newMentor) {
          mentorId = newMentor.Id;
        }
      }
    }

    // 3. Update DangKyThucTap -> NgoaiTruong, ChoPheDuyet
    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('DangKyThucTap')
      .update({
        LoaiDangKy: 'NgoaiTruong',
        NguonNhanSu: nguonNhanSu,
        GiaoVienGioiThieu: nguonNhanSu === 'GvGioiThieu' ? (giaoVienGioiThieu || 'Có GV giới thiệu') : 'không',
        DoanhNghiepId: doanhNghiepId,
        ViTriPhanCong: viTriPhanCong.trim(),
        NguoiHuongDanDnId: mentorId,
        TrangThaiDangKy: 'ChoPheDuyet', // Chờ Khoa thẩm định pháp lý doanh nghiệp
        UpdatedAt: new Date().toISOString(),
      })
      .eq('Id', registrationId)
      .select(`
        *,
        DoanhNghiep:DoanhNghiepId(*),
        NguoiHuongDanDoanhNghiep:NguoiHuongDanDnId(*)
      `)
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    await recordActivity(actor.nguoiDungId, 'KHAI_BAO_DOANH_NGHIEP_THUC_TAP', `Đã gửi hồ sơ thực tập ngoài trường cho doanh nghiệp #${doanhNghiepId}.`, request);
    return NextResponse.json({
      success: true,
      message: 'Đã gửi hồ sơ thực tập ngoài trường thành công. Hồ sơ đang ở trạng thái Chờ Khoa thẩm định phê duyệt.',
      data: updated,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lỗi gửi hồ sơ thực tập ngoài trường' },
      { status: 500 }
    );
  }
}
