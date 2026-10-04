import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAuthError, requireRoles, requireSession } from '@/lib/server-auth';

export async function GET(request: Request) {
  try {
    const actor = requireSession(request);
    if (isAuthError(actor)) return actor;
    const { searchParams } = new URL(request.url);
    const dangKyThucTapId = searchParams.get('dangKyThucTapId');

    if (!dangKyThucTapId) {
      return NextResponse.json({ error: 'Thiếu mã hồ sơ đăng ký thực tập' }, { status: 400 });
    }

    const { data: registration } = await supabaseAdmin.from('DangKyThucTap').select('SinhVienId, GiangVienHuongDanId, DoanhNghiepId').eq('Id', dangKyThucTapId).maybeSingle();
    if (!registration) return NextResponse.json({ error: 'Không tìm thấy hồ sơ.' }, { status: 404 });
    const allowed = actor.role === 'QuanTriVien'
      || (actor.role === 'SinhVien' && actor.sinhVienId === registration.SinhVienId)
      || (actor.role === 'GiangVien' && actor.giangVienId === registration.GiangVienHuongDanId)
      || (actor.role === 'DoanhNghiep' && actor.doanhNghiepId === registration.DoanhNghiepId);
    if (!allowed) return NextResponse.json({ error: 'Bạn không có quyền xem điểm của hồ sơ này.' }, { status: 403 });

    const { data: grade, error } = await supabaseAdmin
      .from('KetQuaThucTap')
      .select(`
        *,
        ChiTietKetQuaThucTap(*, TieuChiChamDiem(*)),
        NguoiHuongDanDoanhNghiep(*)
      `)
      .eq('DangKyThucTapId', parseInt(dangKyThucTapId, 10))
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formatted = grade ? {
      ...grade,
      ChiTietDiem: (grade.ChiTietKetQuaThucTap || []).map((item: Record<string, unknown>) => ({
        ...item,
        tieuChi: item.TieuChiChamDiem,
      })),
    } : null;
    return NextResponse.json({ success: true, data: formatted });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lỗi lấy bảng điểm thực tập' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const actor = requireRoles(request, ['DoanhNghiep', 'GiangVien']);
    if (isAuthError(actor)) return actor;
    const body = await request.json();
    const {
      dangKyThucTapId,
      nguoiCham, // 'DoanhNghiep' | 'GiangVien'
      scores, // Array<{ tieuChiId: number, diemDanhGia: number, nhanXetTieuChi?: string }>
      nhanXetChung,
      nguoiHuongDanDnId,
    } = body;

    if (!dangKyThucTapId || !nguoiCham || !Array.isArray(scores)) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp đầy đủ thông tin chấm điểm và danh sách điểm tiêu chí' },
        { status: 400 }
      );
    }

    const { data: registration, error: registrationError } = await supabaseAdmin
      .from('DangKyThucTap')
      .select('Id, DotThucTapId, TrangThaiDangKy, NguoiHuongDanDnId, GiangVienHuongDanId, DoanhNghiepId')
      .eq('Id', dangKyThucTapId)
      .maybeSingle();
    if (registrationError) return NextResponse.json({ error: registrationError.message }, { status: 500 });
    if (!registration || registration.TrangThaiDangKy !== 'DaDuyet') {
      return NextResponse.json({ error: 'Chỉ có thể chấm điểm hồ sơ đã được duyệt.' }, { status: 409 });
    }
    if ((nguoiCham === 'GiangVien' && (actor.role !== 'GiangVien' || actor.giangVienId !== registration.GiangVienHuongDanId))
      || (nguoiCham === 'DoanhNghiep' && (actor.role !== 'DoanhNghiep' || actor.doanhNghiepId !== registration.DoanhNghiepId))) {
      return NextResponse.json({ error: 'Tài khoản không được phân công chấm hồ sơ này.' }, { status: 403 });
    }
    if (!['GiangVien', 'DoanhNghiep'].includes(nguoiCham)) return NextResponse.json({ error: 'Bên chấm điểm không hợp lệ.' }, { status: 400 });

    const criterionIds = [...new Set(scores.map((item) => Number(item.tieuChiId)))];
    if (criterionIds.length !== scores.length || criterionIds.some((id) => !Number.isInteger(id) || id <= 0)) {
      return NextResponse.json({ error: 'Danh sách tiêu chí chấm điểm không hợp lệ.' }, { status: 400 });
    }
    const { data: criteria, error: criteriaError } = await supabaseAdmin
      .from('TieuChiChamDiem')
      .select('Id, DiemToiDa, NguoiCham')
      .eq('DotThucTapId', registration.DotThucTapId)
      .eq('NguoiCham', nguoiCham)
      .in('Id', criterionIds);
    if (criteriaError) return NextResponse.json({ error: criteriaError.message }, { status: 500 });
    if (!criteria || criteria.length !== scores.length) {
      return NextResponse.json({ error: 'Có tiêu chí không thuộc rubric của đợt hoặc không thuộc bên chấm.' }, { status: 400 });
    }

    const criteriaById = new Map(criteria.map((criterion) => [criterion.Id, Number(criterion.DiemToiDa)]));
    for (const item of scores) {
      const score = Number(item.diemDanhGia);
      const maximum = criteriaById.get(Number(item.tieuChiId));
      if (!Number.isFinite(score) || maximum === undefined || score < 0 || score > maximum) {
        return NextResponse.json({ error: 'Điểm từng tiêu chí phải nằm trong giới hạn rubric.' }, { status: 400 });
      }
    }
    const sumPartyScore = scores.reduce((sum, item) => sum + Number(item.diemDanhGia), 0);

    // RÀNG BUỘC: Doanh nghiệp tối đa 5.0đ, Giảng viên tối đa 5.0đ
    const partyMaximum = Math.min(5, criteria.reduce((sum, item) => sum + Number(item.DiemToiDa), 0));
    if (sumPartyScore > partyMaximum + 0.001) {
      return NextResponse.json(
        {
          error: `Điểm đánh giá vượt quá mức tối đa ${partyMaximum.toFixed(2)} điểm.`,
        },
        { status: 400 }
      );
    }

    // Check existing KetQuaThucTap
    const { data: existingGrade } = await supabaseAdmin
      .from('KetQuaThucTap')
      .select('*')
      .eq('DangKyThucTapId', dangKyThucTapId)
      .maybeSingle();

    let tongDiemDN = existingGrade?.TongDiemDoanhNghiep || 0;
    let tongDiemGV = existingGrade?.TongDiemGiangVien || 0;

    if (nguoiCham === 'DoanhNghiep') {
      tongDiemDN = Math.min(5.0, sumPartyScore);
    } else {
      tongDiemGV = Math.min(5.0, sumPartyScore);
    }

    const diemTongKet = parseFloat((tongDiemDN + tongDiemGV).toFixed(2));

    let ketQuaId: number;

    if (existingGrade) {
      const updateData: {
        TongDiemDoanhNghiep: number;
        TongDiemGiangVien: number;
        DiemTongKet: number;
        NhanXetChung?: string;
        NguoiHuongDanDnId?: number;
        UpdatedAt: string;
      } = {
        TongDiemDoanhNghiep: tongDiemDN,
        TongDiemGiangVien: tongDiemGV,
        DiemTongKet: diemTongKet,
        UpdatedAt: new Date().toISOString(),
      };

      if (nhanXetChung) updateData.NhanXetChung = nhanXetChung;
      if (nguoiHuongDanDnId) updateData.NguoiHuongDanDnId = nguoiHuongDanDnId;

      const { data: updated, error: updateErr } = await supabaseAdmin
        .from('KetQuaThucTap')
        .update(updateData)
        .eq('Id', existingGrade.Id)
        .select()
        .single();

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
      ketQuaId = updated.Id;
    } else {
      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from('KetQuaThucTap')
        .insert([
          {
            DangKyThucTapId: dangKyThucTapId,
            TongDiemDoanhNghiep: tongDiemDN,
            TongDiemGiangVien: tongDiemGV,
            DiemTongKet: diemTongKet,
            NhanXetChung: nhanXetChung || null,
            NguoiHuongDanDnId: nguoiHuongDanDnId || null,
          },
        ])
        .select()
        .single();

      if (insertErr || !inserted) {
        return NextResponse.json({ error: insertErr?.message || 'Không thể tạo bản ghi điểm' }, { status: 500 });
      }
      ketQuaId = inserted.Id;
    }

    const { data: existingDetails, error: detailLookupError } = await supabaseAdmin
      .from('ChiTietKetQuaThucTap')
      .select('Id, TieuChiId')
      .eq('KetQuaThucTapId', ketQuaId)
      .in('TieuChiId', criterionIds);
    if (detailLookupError) return NextResponse.json({ error: detailLookupError.message }, { status: 500 });
    const detailIdByCriterion = new Map((existingDetails || []).map((detail) => [detail.TieuChiId, detail.Id]));
    const detailWrites = await Promise.all(scores.map((item) => {
      const values = {
        DiemDanhGia: Number(item.diemDanhGia),
        NhanXetTieuChi: item.nhanXetTieuChi || null,
        UpdatedAt: new Date().toISOString(),
      };
      const existingId = detailIdByCriterion.get(Number(item.tieuChiId));
      return existingId
        ? supabaseAdmin.from('ChiTietKetQuaThucTap').update(values).eq('Id', existingId)
        : supabaseAdmin.from('ChiTietKetQuaThucTap').insert({
            KetQuaThucTapId: ketQuaId,
            TieuChiId: Number(item.tieuChiId),
            ...values,
          });
    }));
    const detailWriteError = detailWrites.find((result) => result.error)?.error;
    if (detailWriteError) return NextResponse.json({ error: detailWriteError.message }, { status: 500 });

    // Retrieve updated grade record with criteria details
    const { data: finalResult, error: finalError } = await supabaseAdmin
      .from('KetQuaThucTap')
      .select(`
        *,
        ChiTietKetQuaThucTap(*, TieuChiChamDiem(*))
      `)
      .eq('Id', ketQuaId)
      .single();
    if (finalError) return NextResponse.json({ error: finalError.message }, { status: 500 });

    return NextResponse.json({
      success: true,
      message: `Đã lưu bảng điểm thành công! (Điểm DN: ${tongDiemDN}/5.0 • Điểm GV: ${tongDiemGV}/5.0 • Tổng kết: ${diemTongKet}/10.0)`,
      data: finalResult,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lỗi cập nhật bảng điểm Rubric' },
      { status: 500 }
    );
  }
}
