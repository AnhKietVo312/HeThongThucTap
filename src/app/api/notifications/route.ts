import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/server-auth';

export async function GET(request: Request) {
  const session = getSession(request);
  if (!session?.nguoiDungId) return NextResponse.json({ error: 'Vui lòng đăng nhập lại.' }, { status: 401 });
  const id = session.nguoiDungId;
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'Tài khoản không hợp lệ.' }, { status: 400 });
  const { data, error } = await supabaseAdmin.from('ThongBao').select('*').eq('NguoiDungId', id).order('CreatedAt', { ascending: false }).limit(30);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data: data || [] });
}

export async function PATCH(request: Request) {
  try {
    const session = getSession(request);
    if (!session?.nguoiDungId) return NextResponse.json({ error: 'Vui lòng đăng nhập lại.' }, { status: 401 });
    const id = session.nguoiDungId;
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'Tài khoản không hợp lệ.' }, { status: 400 });
    const { error } = await supabaseAdmin.from('ThongBao').update({ DaDoc: true }).eq('NguoiDungId', id).eq('DaDoc', false);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không thể cập nhật thông báo.' }, { status: 500 });
  }
}
