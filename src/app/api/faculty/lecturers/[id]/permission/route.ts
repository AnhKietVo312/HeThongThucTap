import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAuthError, requireRoles } from '@/lib/server-auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = requireRoles(request, ['QuanTriVien']);
    if (isAuthError(actor)) return actor;
    const { id } = await params;
    const gvId = parseInt(id, 10);
    const body = await request.json();
    const { coQuyenToChuc } = body;

    if (typeof coQuyenToChuc !== 'boolean') {
      return NextResponse.json(
        { error: 'Trường coQuyenToChuc phải là giá trị boolean (true/false)' },
        { status: 400 }
      );
    }

    const { data: updated, error } = await supabaseAdmin
      .from('GiangVien')
      .update({
        CoQuyenToChuc: coQuyenToChuc,
        UpdatedAt: new Date().toISOString(),
      })
      .eq('Id', gvId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: coQuyenToChuc
        ? `Đã cấp quyền tổ chức đợt thực tập cho giảng viên ${updated.HoTen}`
        : `Đã thu hồi quyền tổ chức đợt thực tập của giảng viên ${updated.HoTen}`,
      data: updated,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lỗi cập nhật quyền giảng viên' },
      { status: 500 }
    );
  }
}
