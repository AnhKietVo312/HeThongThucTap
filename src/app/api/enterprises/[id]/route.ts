import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAuthError, requireRoles } from '@/lib/server-auth';

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  try {
    const actor = requireRoles(request, ['QuanTriVien']);
    if (isAuthError(actor)) return actor;
    const id = Number((await params).id);
    const body = await request.json();
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'Mã doanh nghiệp không hợp lệ.' }, { status: 400 });
    }

    const update: Record<string, unknown> = { UpdatedAt: new Date().toISOString() };
    if (typeof body.TenDoanhNghiep === 'string' && body.TenDoanhNghiep.trim()) update.TenDoanhNghiep = body.TenDoanhNghiep.trim();
    if (typeof body.DiaChi === 'string' && body.DiaChi.trim()) update.DiaChi = body.DiaChi.trim();
    if (typeof body.TrangThaiChuan === 'boolean') update.TrangThaiChuan = body.TrangThaiChuan;
    if (Object.keys(update).length === 1) {
      return NextResponse.json({ error: 'Không có thông tin doanh nghiệp cần cập nhật.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('DoanhNghiep')
      .update(update)
      .eq('Id', id)
      .select('*, NguoiHuongDanDoanhNghiep(*)')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không thể cập nhật doanh nghiệp.' }, { status: 500 });
  }
}
