import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAuthError, requireSession } from '@/lib/server-auth';

export async function GET(request: Request) {
  try {
    const actor = requireSession(request);
    if (isAuthError(actor)) return actor;
    const { searchParams } = new URL(request.url);
    const dotThucTapId = searchParams.get('dotThucTapId');
    const nguoiCham = searchParams.get('nguoiCham');

    let query = supabaseAdmin.from('TieuChiChamDiem').select('*');

    if (dotThucTapId) {
      query = query.eq('DotThucTapId', parseInt(dotThucTapId, 10));
    }
    if (nguoiCham) {
      query = query.eq('NguoiCham', nguoiCham);
    }

    const { data: rubrics, error } = await query.order('Stt', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: rubrics });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lỗi lấy tiêu chí Rubric' },
      { status: 500 }
    );
  }
}
