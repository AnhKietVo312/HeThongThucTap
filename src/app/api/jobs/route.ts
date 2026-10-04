import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAuthError, requireRoles, requireSession } from '@/lib/server-auth';
import { recordActivity } from '@/lib/activity-log';

export async function GET(request: Request) {
  try {
    const actor = requireSession(request);
    if (isAuthError(actor)) return actor;
    const { searchParams } = new URL(request.url);
    const dotThucTapId = searchParams.get('dotThucTapId');
    const doanhNghiepId = searchParams.get('doanhNghiepId');
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('CongViecThucTap')
      .select(`
        *,
        DoanhNghiep:DoanhNghiepId(*),
        NguoiHuongDan:NguoiHuongDanDnId(*),
        DotThucTap:DotThucTapId(*)
      `);

    if (dotThucTapId) {
      query = query.eq('DotThucTapId', parseInt(dotThucTapId, 10));
    }
    if (doanhNghiepId) {
      query = query.eq('DoanhNghiepId', parseInt(doanhNghiepId, 10));
    }
    if (status) {
      query = query.eq('TrangThaiDuyetJob', status);
    }
    if (actor.role === 'DoanhNghiep') {
      if (!actor.doanhNghiepId) return NextResponse.json({ error: 'Tài khoản chưa được liên kết doanh nghiệp.' }, { status: 403 });
      query = query.eq('DoanhNghiepId', actor.doanhNghiepId);
    } else if (actor.role !== 'QuanTriVien') {
      query = query.eq('TrangThaiDuyetJob', 'DaDuyet');
    }

    const { data: jobs, error } = await query.order('CreatedAt', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const jobIds = (jobs || []).map((job) => job.Id);
    const counts = new Map<number, { applied: number; approved: number }>();
    if (jobIds.length) {
      const { data: applications, error: applicationsError } = await supabaseAdmin
        .from('DangKyThucTap')
        .select('CongViecId, TrangThaiDangKy')
        .in('CongViecId', jobIds);
      if (applicationsError) return NextResponse.json({ error: applicationsError.message }, { status: 500 });
      for (const application of applications || []) {
        if (!application.CongViecId) continue;
        const count = counts.get(application.CongViecId) || { applied: 0, approved: 0 };
        count.applied += 1;
        if (application.TrangThaiDangKy === 'DaDuyet') count.approved += 1;
        counts.set(application.CongViecId, count);
      }
    }
    const jobsWithCounts = (jobs || []).map((job) => ({
      ...job,
      TenDoanhNghiep: job.DoanhNghiep?.TenDoanhNghiep,
      MaSoThue: job.DoanhNghiep?.MaSoThue,
      soLuongDaNop: counts.get(job.Id)?.applied || 0,
      soLuongDaDuyet: counts.get(job.Id)?.approved || 0,
      mentorDn: job.NguoiHuongDan,
      doanhNghiep: job.DoanhNghiep,
      dotThucTap: job.DotThucTap,
    }));

    return NextResponse.json({ success: true, data: jobsWithCounts });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lỗi lấy danh sách công việc' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const actor = requireRoles(request, ['DoanhNghiep']);
    if (isAuthError(actor)) return actor;
    const body = await request.json();
    const {
      DoanhNghiepId,
      DotThucTapId,
      TieuDe,
      MoTaCongViec,
      YeuCauUngVien,
      SoLuongTuyen = 1,
      HanNopHoSo,
      NguoiHuongDanDnId,
      // Mentor details entered directly
      mentorTen,
      mentorSdt,
      mentorEmail,
    } = body;

    if (!DoanhNghiepId || !DotThucTapId || !TieuDe || !MoTaCongViec || !HanNopHoSo) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ tiêu đề, mô tả và hạn nộp hồ sơ' },
        { status: 400 }
      );
    }
    if (!actor.doanhNghiepId || Number(DoanhNghiepId) !== actor.doanhNghiepId) {
      return NextResponse.json({ error: 'Doanh nghiệp đăng nhập không khớp tài khoản.' }, { status: 403 });
    }
    const { data: enterprise, error: enterpriseError } = await supabaseAdmin.from('DoanhNghiep').select('Id, TrangThaiChuan').eq('Id', actor.doanhNghiepId).maybeSingle();
    if (enterpriseError) return NextResponse.json({ error: enterpriseError.message }, { status: 500 });
    if (!enterprise?.TrangThaiChuan) return NextResponse.json({ error: 'Doanh nghiệp cần được Khoa xác minh trước khi đăng tin.' }, { status: 403 });
    const { data: batch, error: batchError } = await supabaseAdmin.from('DotThucTap').select('NgayBatDauDangKy, NgayKetThucDangKy').eq('Id', DotThucTapId).maybeSingle();
    if (batchError) return NextResponse.json({ error: batchError.message }, { status: 500 });
    const now = Date.now();
    const deadline = Date.parse(HanNopHoSo);
    if (!batch || now < Date.parse(batch.NgayBatDauDangKy) || now > Date.parse(batch.NgayKetThucDangKy) || !Number.isFinite(deadline) || deadline <= now) {
      return NextResponse.json({ error: 'Đợt không nhận tin mới hoặc hạn nộp hồ sơ không hợp lệ.' }, { status: 409 });
    }
    const quota = Number(SoLuongTuyen);
    if (!Number.isInteger(quota) || quota < 1) return NextResponse.json({ error: 'Số lượng tuyển phải là số nguyên dương.' }, { status: 400 });

    let finalMentorId = NguoiHuongDanDnId;

    // Tự động phát sinh hoặc lưu vào bảng NguoiHuongDanDoanhNghiep nếu nhập mentor trực tiếp
    if (!finalMentorId && mentorTen) {
      const { data: existingMentor } = await supabaseAdmin
        .from('NguoiHuongDanDoanhNghiep')
        .select('Id')
        .eq('DoanhNghiepId', DoanhNghiepId)
        .eq('HoTen', mentorTen)
        .maybeSingle();

      if (existingMentor) {
        finalMentorId = existingMentor.Id;
      } else {
        const { data: newMentor, error: mentorErr } = await supabaseAdmin
          .from('NguoiHuongDanDoanhNghiep')
          .insert([
            {
              DoanhNghiepId,
              HoTen: mentorTen,
              SoDienThoai: mentorSdt || null,
              Email: mentorEmail || null,
            },
          ])
          .select()
          .single();

      if (mentorErr) return NextResponse.json({ error: mentorErr.message }, { status: 500 });
      if (newMentor) {
        finalMentorId = newMentor.Id;
      }
      }
    }
    if (finalMentorId) {
      const { data: mentor, error: mentorLookupError } = await supabaseAdmin.from('NguoiHuongDanDoanhNghiep').select('Id').eq('Id', finalMentorId).eq('DoanhNghiepId', actor.doanhNghiepId).maybeSingle();
      if (mentorLookupError) return NextResponse.json({ error: mentorLookupError.message }, { status: 500 });
      if (!mentor) return NextResponse.json({ error: 'Người hướng dẫn không thuộc doanh nghiệp này.' }, { status: 400 });
    }

    // Insert new job with default status 'ChoKhoaDuyet'
    const { data: newJob, error: jobErr } = await supabaseAdmin
      .from('CongViecThucTap')
      .insert([
        {
          DoanhNghiepId,
          DotThucTapId,
          TieuDe,
          MoTaCongViec,
          YeuCauUngVien: YeuCauUngVien || null,
          SoLuongTuyen: quota,
          HanNopHoSo,
          TrangThaiDuyetJob: 'ChoKhoaDuyet', // Trạng thái mặc định chờ Khoa duyệt
          NguoiHuongDanDnId: finalMentorId || null,
        },
      ])
      .select(`
        *,
        DoanhNghiep:DoanhNghiepId(*),
        NguoiHuongDan:NguoiHuongDanDnId(*)
      `)
      .single();

    if (jobErr) {
      return NextResponse.json({ error: jobErr.message }, { status: 500 });
    }

    await recordActivity(actor.nguoiDungId, 'TAO_TIN_TUYEN_DUNG', `Đã đăng công việc “${TieuDe}” (#${newJob.Id}).`, request);
    return NextResponse.json({
      success: true,
      message: 'Đăng tin tuyển dụng thành công. Vui lòng chờ Khoa CNTT phê duyệt.',
      data: newJob,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lỗi đăng tin tuyển dụng' },
      { status: 500 }
    );
  }
}
