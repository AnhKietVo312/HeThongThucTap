import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAuthError, requireRoles } from '@/lib/server-auth';

export async function GET(request: Request) {
  try {
    const actor = requireRoles(request, ['QuanTriVien']);
    if (isAuthError(actor)) return actor;
    const { searchParams } = new URL(request.url);
    const dotThucTapId = searchParams.get('dotThucTapId');

    let registrationQuery = supabaseAdmin
      .from('DangKyThucTap')
      .select('GiangVienHuongDanId')
      .not('TrangThaiDangKy', 'in', '("TuChoi","DaHuy")')
      .not('GiangVienHuongDanId', 'is', null);
    if (dotThucTapId) registrationQuery = registrationQuery.eq('DotThucTapId', parseInt(dotThucTapId, 10));

    // These independent reads run together to avoid adding database round-trip latency.
    const [lecturerResult, assignmentResult] = await Promise.all([
      supabaseAdmin.from('GiangVien').select('*').order('MaGiangVien', { ascending: true }),
      registrationQuery,
    ]);
    const { data: lecturers, error } = lecturerResult;
    const { data: assignments, error: assignmentError } = assignmentResult;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (assignmentError) return NextResponse.json({ error: assignmentError.message }, { status: 500 });

    const counts = new Map<number, number>();
    for (const assignment of assignments || []) {
      const lecturerId = assignment.GiangVienHuongDanId;
      if (lecturerId) counts.set(lecturerId, (counts.get(lecturerId) || 0) + 1);
    }
    const lecturersWithCount = (lecturers || []).map((gv) => {
      const currentCount = counts.get(gv.Id) || 0;
      return {
        ...gv,
        currentCount,
        maxCount: 30,
        conNhanDuoc: Math.max(0, 30 - currentCount),
        daDay: currentCount >= 30,
      };
    });

    return NextResponse.json({ success: true, data: lecturersWithCount });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lỗi lấy danh sách giảng viên' },
      { status: 500 }
    );
  }
}
