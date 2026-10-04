import { supabaseAdmin } from '@/lib/supabase';

export async function recordActivity(
  nguoiDungId: number | undefined,
  hanhDong: string,
  chiTiet?: string,
  request?: Request,
) {
  if (!nguoiDungId || !Number.isInteger(nguoiDungId) || nguoiDungId < 1) return;
  try {
    const forwarded = request?.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    await supabaseAdmin.from('LichSuHoatDong').insert({
      NguoiDungId: nguoiDungId,
      HanhDong: hanhDong.slice(0, 100),
      ChiTiet: chiTiet?.slice(0, 2000) || null,
      IpAddress: forwarded?.slice(0, 45) || null,
    });
  } catch (error) {
    console.error('Could not write activity log:', error);
  }
}
