import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAuthError, requireRoles } from '@/lib/server-auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = requireRoles(request, ['DoanhNghiep', 'QuanTriVien']);
    if (isAuthError(actor)) return actor;
    const { id } = await params;
    const doanhNghiepId = parseInt(id, 10);
    if (actor.role === 'DoanhNghiep' && actor.doanhNghiepId !== doanhNghiepId) return NextResponse.json({ error: 'Không có quyền xem doanh nghiệp này.' }, { status: 403 });

    const { data: mentors, error } = await supabaseAdmin
      .from('NguoiHuongDanDoanhNghiep')
      .select('*')
      .eq('DoanhNghiepId', doanhNghiepId)
      .order('CreatedAt', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: mentors });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lỗi lấy danh sách mentor' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = requireRoles(request, ['DoanhNghiep']);
    if (isAuthError(actor)) return actor;
    const { id } = await params;
    const doanhNghiepId = parseInt(id, 10);
    if (actor.doanhNghiepId !== doanhNghiepId) return NextResponse.json({ error: 'Không có quyền cập nhật doanh nghiệp này.' }, { status: 403 });
    const body = await request.json();
    const { HoTen, SoDienThoai, Email } = body;

    if (!HoTen) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp họ tên mentor' },
        { status: 400 }
      );
    }

    // Check if mentor already exists by email/phone for this enterprise
    let existingQuery = supabaseAdmin
      .from('NguoiHuongDanDoanhNghiep')
      .select('*')
      .eq('DoanhNghiepId', doanhNghiepId);

    if (Email) {
      existingQuery = existingQuery.eq('Email', Email);
    } else if (SoDienThoai) {
      existingQuery = existingQuery.eq('SoDienThoai', SoDienThoai);
    } else {
      existingQuery = existingQuery.eq('HoTen', HoTen);
    }

    const { data: existing } = await existingQuery.maybeSingle();

    if (existing) {
      return NextResponse.json({ success: true, data: existing, existing: true });
    }

    const { data: mentor, error: insertErr } = await supabaseAdmin
      .from('NguoiHuongDanDoanhNghiep')
      .insert([
        {
          DoanhNghiepId: doanhNghiepId,
          HoTen,
          SoDienThoai,
          Email,
        },
      ])
      .select()
      .single();

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: mentor, created: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lỗi tạo mentor doanh nghiệp' },
      { status: 500 }
    );
  }
}
