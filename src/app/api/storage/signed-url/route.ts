import { NextResponse } from 'next/server';
import { getPrivateFileSignedUrl, supabaseAdmin } from '@/lib/supabase';
import { isAuthError, requireSession } from '@/lib/server-auth';

export async function GET(request: Request) {
  try {
    const actor = requireSession(request);
    if (isAuthError(actor)) return actor;
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    const expiresIn = Number(searchParams.get('expiresIn') || '3600');

    if (!path) {
      return NextResponse.json({ error: 'Thiếu đường dẫn tệp tin' }, { status: 400 });
    }
    if (!Number.isInteger(expiresIn) || expiresIn < 60 || expiresIn > 3600) return NextResponse.json({ error: 'Thời hạn liên kết phải từ 60 đến 3600 giây.' }, { status: 400 });

    const { data: registrations, error: registrationError } = await supabaseAdmin
      .from('DangKyThucTap')
      .select('Id, SinhVienId, GiangVienHuongDanId, DoanhNghiepId, HoSoThucTap(DuongDanCV), BaoCaoThucTap(DuongDanFile)');
    if (registrationError) return NextResponse.json({ error: registrationError.message }, { status: 500 });
    const matches = (registrations || []).filter((registration) => {
      const profile = Array.isArray(registration.HoSoThucTap) ? registration.HoSoThucTap[0] : registration.HoSoThucTap;
      const reports = Array.isArray(registration.BaoCaoThucTap) ? registration.BaoCaoThucTap : [];
      const ownsPath = profile?.DuongDanCV === path || reports.some((report: { DuongDanFile: string }) => report.DuongDanFile === path);
      const hasAccess = actor.role === 'QuanTriVien'
        || (actor.role === 'SinhVien' && actor.sinhVienId === registration.SinhVienId)
        || (actor.role === 'GiangVien' && actor.giangVienId === registration.GiangVienHuongDanId)
        || (actor.role === 'DoanhNghiep' && actor.doanhNghiepId === registration.DoanhNghiepId && profile?.DuongDanCV === path);
      return ownsPath && hasAccess;
    });
    if (!matches.length) return NextResponse.json({ error: 'Không tìm thấy tệp hoặc bạn không có quyền xem.' }, { status: 403 });

    const result = await getPrivateFileSignedUrl(path, expiresIn);

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      signedUrl: result.signedUrl,
      path,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lỗi tạo liên kết bảo mật tải tệp' },
      { status: 500 }
    );
  }
}
