import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { UserSession, VaiTro } from '@/types/database.types';
import { createSessionResponse } from '@/lib/server-auth';
import { recordActivity } from '@/lib/activity-log';

function accountLookupError(context: string, label: string, error: unknown) {
  console.error(context, error);
  const detail = error instanceof Error
    ? error.message
    : typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
      ? error.message
      : String(error);
  const status = typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number'
    ? error.status
    : 0;
  const unavailable = status >= 500 || /<!doctype\s+html|<html\b|cloudflare|error code\s*522|\b5\d\d\b/i.test(detail);

  return NextResponse.json({
    error: unavailable
      ? 'Supabase đang tạm thời không phản hồi (lỗi kết nối 5xx). Vui lòng thử lại sau vài phút.'
      : process.env.NODE_ENV === 'development'
        ? `Lỗi truy vấn ${label} trên Supabase: ${detail}`
        : `Không thể truy vấn ${label}. Vui lòng thử lại.`,
  }, { status: unavailable ? 503 : 500 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, identifier, password } = body;

    if (!type || !identifier) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp đầy đủ loại tài khoản và định danh đăng nhập' },
        { status: 400 }
      );
    }

    const cleanId = String(identifier).trim();

    // 1. SINH VIÊN: Đăng nhập bằng email trường theo chuẩn MSSV@huit.edu.vn (hoặc nhập MSSV)
    if (type === 'sinhvien') {
      const email = cleanId.toLowerCase();
      // Query database SinhVien & NguoiDung
      let studentQuery = supabaseAdmin
        .from('SinhVien')
        .select('*, NguoiDung:NguoiDungId(*)');
      studentQuery = email.includes('@') ? studentQuery.ilike('Email', email) : studentQuery.eq('Mssv', cleanId);
      const { data: svData, error: svError } = await studentQuery.maybeSingle();

      if (svError) {
        return accountLookupError('Student login query failed:', 'tài khoản sinh viên', svError);
      }
      if (!svData) {
        return NextResponse.json({ error: 'Không tìm thấy tài khoản sinh viên.' }, { status: 401 });
      }

      // Check password if provided (for demo standard check)
      if (!password || !svData.NguoiDung?.MatKhauHash || svData.NguoiDung.MatKhauHash !== password) {
        return NextResponse.json({ error: 'Mật khẩu không chính xác' }, { status: 401 });
      }
      if (svData.DeletedAt || svData.NguoiDung?.DeletedAt || !svData.NguoiDung?.TrangThai || svData.NguoiDung.VaiTro !== 'SinhVien') {
        return NextResponse.json({ error: 'Tài khoản sinh viên đã bị khóa hoặc không hợp lệ.' }, { status: 403 });
      }

      const session: UserSession = {
        nguoiDungId: svData.NguoiDung?.Id,
        email: svData.Email,
        role: 'SinhVien' as VaiTro,
        hoTen: svData.HoTen,
        subInfo: `${svData.Mssv} • ${svData.Lop} • ${svData.ChuyenNganh}`,
        avatarChar: svData.HoTen.charAt(svData.HoTen.lastIndexOf(' ') + 1) || 'S',
        sinhVienId: svData.Id,
        mssv: svData.Mssv,
        chuyenNganh: svData.ChuyenNganh,
      };

      await recordActivity(session.nguoiDungId, 'DANG_NHAP', 'Đăng nhập thành công bằng mã sinh viên.', request);
      return createSessionResponse(session);
    }

    // 2. DOANH NGHIỆP: Đăng nhập bằng Mã số thuế (MST)
    if (type === 'doanhnghiep') {
      const mst = cleanId;

      const { data: dnData, error: dnError } = await supabaseAdmin
        .from('DoanhNghiep')
        .select('*, NguoiDung:NguoiDungId(*)')
        .eq('MaSoThue', mst)
        .maybeSingle();

      if (dnError) {
        return accountLookupError('Enterprise login query failed:', 'tài khoản doanh nghiệp', dnError);
      }
      if (!dnData) {
        return NextResponse.json({ error: 'Không tìm thấy tài khoản doanh nghiệp.' }, { status: 401 });
      }

      if (!password || !dnData.NguoiDung?.MatKhauHash || dnData.NguoiDung.MatKhauHash !== password) {
        return NextResponse.json({ error: 'Mật khẩu không chính xác' }, { status: 401 });
      }
      if (dnData.DeletedAt || dnData.NguoiDung?.DeletedAt || !dnData.NguoiDung?.TrangThai || dnData.NguoiDung.VaiTro !== 'DoanhNghiep') {
        return NextResponse.json({ error: 'Tài khoản doanh nghiệp chưa được kích hoạt.' }, { status: 403 });
      }

      const session: UserSession = {
        nguoiDungId: dnData.NguoiDung?.Id,
        email: `${dnData.MaSoThue}@partner.huit.edu.vn`,
        role: 'DoanhNghiep' as VaiTro,
        hoTen: dnData.TenDoanhNghiep,
        subInfo: `MST: ${dnData.MaSoThue} • ${dnData.TrangThaiChuan ? 'Đối tác chính thức' : 'Doanh nghiệp tiếp nhận'}`,
        avatarChar: dnData.TenDoanhNghiep.charAt(0) || 'D',
        maSoThue: dnData.MaSoThue,
        doanhNghiepId: dnData.Id,
      };

      await recordActivity(session.nguoiDungId, 'DANG_NHAP', 'Đăng nhập thành công bằng mã số thuế.', request);
      return createSessionResponse(session);
    }

    // 3. GIẢNG VIÊN & QUẢN TRỊ KHOA: tên đăng nhập là mã giảng viên
    if (type === 'giangvien') {
      const maGv = cleanId;
      const { data: userData, error: userError } = await supabaseAdmin
        .from('NguoiDung')
        .select('Id, TenDangNhap, MatKhauHash, VaiTro, TrangThai, DeletedAt')
        .eq('TenDangNhap', maGv)
        .maybeSingle();

      if (userError) {
        return accountLookupError('Lecturer account lookup failed:', 'tài khoản giảng viên', userError);
      }
      if (!userData) {
        return NextResponse.json({ error: 'Không tìm thấy tài khoản giảng viên.' }, { status: 401 });
      }
      if (!password || !userData.MatKhauHash || userData.MatKhauHash !== password) {
        return NextResponse.json({ error: 'Mật khẩu không chính xác' }, { status: 401 });
      }
      if (userData.DeletedAt || !userData.TrangThai || !['GiangVien', 'QuanTriVien'].includes(userData.VaiTro)) {
        return NextResponse.json({ error: 'Tài khoản giảng viên đã bị khóa hoặc không hợp lệ.' }, { status: 403 });
      }

      const { data: gvData, error: profileError } = await supabaseAdmin
        .from('GiangVien')
        .select('*')
        .eq('NguoiDungId', userData.Id)
        .maybeSingle();
      if (profileError) {
        return accountLookupError('Lecturer profile lookup failed:', 'hồ sơ giảng viên', profileError);
      }
      if (!gvData || gvData.DeletedAt) {
        return NextResponse.json({ error: 'Tài khoản chưa có hồ sơ giảng viên trong hệ thống.' }, { status: 403 });
      }

      // KIỂM TRA CỜ TruongKhoa:
      // - Nếu TRUE: điều hướng vào cổng Quản trị Khoa (role: QuanTriVien)
      // - Nếu FALSE: điều hướng vào cổng Giảng viên hướng dẫn (role: GiangVien)
      const role: VaiTro = gvData.TruongKhoa || userData.VaiTro === 'QuanTriVien' ? 'QuanTriVien' : 'GiangVien';
      const lecturerName = gvData.HoTen;

      const session: UserSession = {
        nguoiDungId: userData.Id,
        email: gvData.Email || userData.TenDangNhap,
        role,
        hoTen: lecturerName,
        subInfo: `Mã GV: ${gvData.MaGiangVien} • ${gvData.Khoa}${gvData.TruongKhoa ? ' (Trưởng Khoa)' : ''}`,
        avatarChar: lecturerName.charAt(lecturerName.lastIndexOf(' ') + 1) || 'G',
        maGiangVien: gvData.MaGiangVien,
        truongKhoa: gvData.TruongKhoa,
        coQuyenToChuc: gvData.CoQuyenToChuc || gvData.TruongKhoa || role === 'QuanTriVien',
        giangVienId: gvData.Id,
      };

      await recordActivity(session.nguoiDungId, 'DANG_NHAP', 'Đăng nhập thành công bằng mã giảng viên.', request);
      return createSessionResponse(session);
    }

    return NextResponse.json({ error: 'Loại tài khoản không hợp lệ' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Login API error:', error);
    if (error instanceof TypeError && /fetch failed/i.test(error.message)) {
      return NextResponse.json({ error: 'Không kết nối được Supabase. Kiểm tra mạng và NEXT_PUBLIC_SUPABASE_URL trong .env.local.' }, { status: 503 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Đăng nhập thất bại' },
      { status: 500 }
    );
  }
}

