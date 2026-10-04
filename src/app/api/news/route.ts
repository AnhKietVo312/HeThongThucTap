import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAuthError, requireRoles, requireSession } from '@/lib/server-auth';
import { recordActivity } from '@/lib/activity-log';

const audiences = ['TatCa', 'SinhVien', 'GiangVien', 'DoanhNghiep'] as const;

function makeSlug(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 220);
}

export async function GET(request: Request) {
  const actor = requireSession(request);
  if (isAuthError(actor)) return actor;

  const url = new URL(request.url);
  const requestedId = Number(url.searchParams.get('id'));
  let query = supabaseAdmin.from('TinTuc').select('*').is('DeletedAt', null)
    .order('GhimTin', { ascending: false }).order('CreatedAt', { ascending: false }).limit(100);
  if (Number.isInteger(requestedId) && requestedId > 0) query = query.eq('Id', requestedId);
  if (actor.role !== 'QuanTriVien') query = query.in('DoiTuongXem', ['TatCa', actor.role]);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (Number.isInteger(requestedId) && requestedId > 0) {
    const article = (data || []).find((item) => item.Id === requestedId);
    if (!article) return NextResponse.json({ error: 'Không tìm thấy tin tức.' }, { status: 404 });
    const { error: viewError } = await supabaseAdmin.from('TinTuc')
      .update({ LuotXem: (article.LuotXem || 0) + 1 }).eq('Id', article.Id);
    if (viewError) return NextResponse.json({ error: viewError.message }, { status: 500 });
    return NextResponse.json({ success: true, data: { ...article, LuotXem: (article.LuotXem || 0) + 1 } });
  }
  return NextResponse.json({ success: true, data: data || [] });
}

export async function POST(request: Request) {
  const actor = requireRoles(request, ['QuanTriVien']);
  if (isAuthError(actor)) return actor;
  try {
    const body = await request.json();
    const TieuDe = typeof body.TieuDe === 'string' ? body.TieuDe.trim() : '';
    const NoiDung = typeof body.NoiDung === 'string' ? body.NoiDung.trim() : '';
    const TomTat = typeof body.TomTat === 'string' ? body.TomTat.trim() : '';
    const DoiTuongXem = audiences.includes(body.DoiTuongXem) ? body.DoiTuongXem : 'TatCa';
    const HinhAnhDaiDien = typeof body.HinhAnhDaiDien === 'string' ? body.HinhAnhDaiDien.trim() : null;
    if (TieuDe.length < 4 || TieuDe.length > 255 || !NoiDung || NoiDung.length > 50000 || TomTat.length > 2000) {
      return NextResponse.json({ error: 'Tiêu đề, nội dung hoặc tóm tắt không hợp lệ.' }, { status: 400 });
    }
    const baseSlug = makeSlug(typeof body.Slug === 'string' && body.Slug.trim() ? body.Slug.trim() : TieuDe);
    if (!baseSlug) return NextResponse.json({ error: 'Không thể tạo đường dẫn tin tức từ tiêu đề.' }, { status: 400 });
    const { data: existing } = await supabaseAdmin.from('TinTuc').select('Slug').like('Slug', `${baseSlug}%`);
    const used = new Set((existing || []).map((row) => row.Slug));
    let Slug = baseSlug;
    let suffix = 2;
    while (used.has(Slug)) Slug = `${baseSlug}-${suffix++}`;

    const { data, error } = await supabaseAdmin.from('TinTuc').insert({
      TieuDe, Slug, TomTat: TomTat || null, NoiDung, HinhAnhDaiDien,
      DoiTuongXem, GhimTin: body.GhimTin === true, TacGiaId: actor.nguoiDungId,
    }).select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await recordActivity(actor.nguoiDungId, 'TAO_TIN_TUC', `Đã đăng tin “${TieuDe}” (#${data.Id}).`, request);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không thể tạo tin tức.' }, { status: 500 });
  }
}
