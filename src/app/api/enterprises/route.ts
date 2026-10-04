import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAuthError, requireRoles } from '@/lib/server-auth';

export async function GET(request: Request) {
  try {
    const actor = requireRoles(request, ['QuanTriVien']);
    if (isAuthError(actor)) return actor;
    const { searchParams } = new URL(request.url);
    const mst = searchParams.get('mst');

    let query = supabaseAdmin
      .from('DoanhNghiep')
      .select('*, NguoiHuongDanDoanhNghiep(*)');

    if (mst) {
      query = query.eq('MaSoThue', mst);
    }

    const { data: enterprises, error } = await query.order('CreatedAt', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: enterprises });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lỗi lấy danh mục doanh nghiệp' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const actor = requireRoles(request, ['QuanTriVien']);
    if (isAuthError(actor)) return actor;
    const body = await request.json();
    const { TenDoanhNghiep, MaSoThue, DiaChi, TrangThaiChuan = true } = body;

    if (!TenDoanhNghiep || !MaSoThue || !DiaChi) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp đầy đủ Tên, Mã số thuế và Địa chỉ doanh nghiệp' },
        { status: 400 }
      );
    }

    // Check if enterprise already exists by MST
    const { data: existing } = await supabaseAdmin
      .from('DoanhNghiep')
      .select('Id')
      .eq('MaSoThue', MaSoThue)
      .single();

    if (existing) {
      const { data: updated, error: updateErr } = await supabaseAdmin
        .from('DoanhNghiep')
        .update({ TenDoanhNghiep, DiaChi, TrangThaiChuan, UpdatedAt: new Date().toISOString() })
        .eq('Id', existing.Id)
        .select()
        .single();

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: updated, updated: true });
    }

    // Insert new Enterprise
    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from('DoanhNghiep')
      .insert([{ TenDoanhNghiep, MaSoThue, DiaChi, TrangThaiChuan }])
      .select()
      .single();

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: inserted, created: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lỗi lưu thông tin doanh nghiệp' },
      { status: 500 }
    );
  }
}
