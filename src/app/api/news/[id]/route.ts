import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAuthError, requireRoles } from '@/lib/server-auth';
import { recordActivity } from '@/lib/activity-log';

const audiences = ['TatCa', 'SinhVien', 'GiangVien', 'DoanhNghiep'] as const;

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = requireRoles(request, ['QuanTriVien']);
  if (isAuthError(actor)) return actor;
  const { id: rawId } = await context.params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: 'Mã tin tức không hợp lệ.' }, { status: 400 });
  try {
    const body = await request.json();
    const update: Record<string, unknown> = { UpdatedAt: new Date().toISOString() };
    if (typeof body.TieuDe === 'string') update.TieuDe = body.TieuDe.trim();
    if (typeof body.TomTat === 'string') update.TomTat = body.TomTat.trim() || null;
    if (typeof body.NoiDung === 'string') update.NoiDung = body.NoiDung.trim();
    if (typeof body.HinhAnhDaiDien === 'string' || body.HinhAnhDaiDien === null) update.HinhAnhDaiDien = body.HinhAnhDaiDien?.trim() || null;
    if (audiences.includes(body.DoiTuongXem)) update.DoiTuongXem = body.DoiTuongXem;
    if (typeof body.GhimTin === 'boolean') update.GhimTin = body.GhimTin;
    if (!Object.keys(update).some((key) => key !== 'UpdatedAt')) return NextResponse.json({ error: 'Không có nội dung hợp lệ để cập nhật.' }, { status: 400 });
    if (typeof update.TieuDe === 'string' && (!update.TieuDe || update.TieuDe.length > 255)) return NextResponse.json({ error: 'Tiêu đề không hợp lệ.' }, { status: 400 });
    if (typeof update.NoiDung === 'string' && (!update.NoiDung || update.NoiDung.length > 50000)) return NextResponse.json({ error: 'Nội dung không hợp lệ.' }, { status: 400 });
    const { data, error } = await supabaseAdmin.from('TinTuc').update(update).eq('Id', id).is('DeletedAt', null).select('*').maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Không tìm thấy tin tức.' }, { status: 404 });
    await recordActivity(actor.nguoiDungId, 'CAP_NHAT_TIN_TUC', `Đã cập nhật tin “${data.TieuDe}” (#${id}).`, request);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không thể cập nhật tin tức.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = requireRoles(request, ['QuanTriVien']);
  if (isAuthError(actor)) return actor;
  const { id: rawId } = await context.params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: 'Mã tin tức không hợp lệ.' }, { status: 400 });
  const { data, error } = await supabaseAdmin.from('TinTuc')
    .update({ DeletedAt: new Date().toISOString(), UpdatedAt: new Date().toISOString() })
    .eq('Id', id).is('DeletedAt', null).select('Id').maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Không tìm thấy tin tức.' }, { status: 404 });
  await recordActivity(actor.nguoiDungId, 'AN_TIN_TUC', `Đã ẩn tin tức #${id}.`, request);
  return NextResponse.json({ success: true });
}
