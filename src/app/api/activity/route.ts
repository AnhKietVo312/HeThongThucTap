import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAuthError, requireRoles, requireSession } from '@/lib/server-auth';

export async function GET(request: Request) {
  const actor = requireSession(request);
  if (isAuthError(actor)) return actor;
  const params = new URL(request.url).searchParams;
  const requestedUser = Number(params.get('nguoiDungId'));
  const limit = Math.min(100, Math.max(10, Number(params.get('limit')) || 50));
  const isAdmin = actor.role === 'QuanTriVien';
  if (!isAdmin && requestedUser && requestedUser !== actor.nguoiDungId) {
    return NextResponse.json({ error: 'Bạn chỉ được xem lịch sử hoạt động của chính mình.' }, { status: 403 });
  }

  let query = supabaseAdmin.from('LichSuHoatDong')
    .select('Id, NguoiDungId, HanhDong, ChiTiet, IpAddress, CreatedAt, NguoiDung:NguoiDungId(TenDangNhap, VaiTro)')
    .order('CreatedAt', { ascending: false }).limit(limit);
  if (!isAdmin || requestedUser) query = query.eq('NguoiDungId', isAdmin && requestedUser ? requestedUser : actor.nguoiDungId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data: data || [] });
}

export async function DELETE(request: Request) {
  const actor = requireRoles(request, ['QuanTriVien']);
  if (isAuthError(actor)) return actor;
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get('id'));
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: 'Mã lịch sử không hợp lệ.' }, { status: 400 });
  const { error } = await supabaseAdmin.from('LichSuHoatDong').delete().eq('Id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
