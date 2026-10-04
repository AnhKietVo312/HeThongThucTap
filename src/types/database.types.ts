// Type definitions based on HUIT Internship Management Database Schema

export type VaiTro = 'QuanTriVien' | 'GiangVien' | 'SinhVien' | 'DoanhNghiep';

export type ChuyenNganh =
  | 'Khoa học dữ liệu'
  | 'Hệ thống thông tin'
  | 'Kỹ thuật phần mềm'
  | 'Mạng máy tính và An toàn thông tin'
  | 'Công nghệ số';

export type ThuTuDot = 'Dot1' | 'Dot2' | 'Dot3' | 'DotDuPhong';

export type LoaiDangKy = 'UngTuyenJob' | 'NgoaiTruong';

export type TrangThaiDangKy =
  | 'DaDangKy'
  | 'ChoDoanhNghiepDuyet'
  | 'ChoPheDuyet'
  | 'DaDuyet'
  | 'TuChoi'
  | 'DaHuy';

export type TrangThaiDuyetJob = 'ChoKhoaDuyet' | 'DaDuyet' | 'TuChoi';

export type NguonNhanSu = 'DanhSachKhoa' | 'TuTim' | 'GvGioiThieu';

export type TrangThaiBaoCao = 'ChoDuyet' | 'DatChuan' | 'YeuCauLamLai';

export type NguoiCham = 'GiangVien' | 'DoanhNghiep';

export type DoiTuongXem = 'TatCa' | 'SinhVien' | 'GiangVien' | 'DoanhNghiep';

export interface NguoiDung {
  Id: number;
  TenDangNhap: string;
  MatKhauHash?: string;
  VaiTro: VaiTro;
  TrangThai: boolean;
  CreatedAt: string;
  UpdatedAt?: string;
  DeletedAt?: string | null;
}

export interface GiangVien {
  Id: number;
  NguoiDungId: number;
  MaGiangVien: string; // Chuỗi số: ví dụ '00123456'
  HoTen: string;
  SoDienThoai?: string;
  Email?: string;
  Khoa: string;
  TruongKhoa: boolean; // TRUE: Trưởng Khoa / Quản trị viên Khoa
  CoQuyenToChuc: boolean; // Được ủy quyền mở/tổ chức đợt thực tập
  CreatedAt: string;
  UpdatedAt?: string;
  DeletedAt?: string | null;
}

export interface SinhVien {
  Id: number;
  NguoiDungId: number;
  Mssv: string;
  HoTen: string;
  Lop: string;
  ChuyenNganh: ChuyenNganh;
  SoDienThoai?: string;
  Email?: string; // MSSV@huit.edu.vn
  CreatedAt: string;
  UpdatedAt?: string;
  DeletedAt?: string | null;
}

export interface DoanhNghiep {
  Id: number;
  NguoiDungId?: number; // Tài khoản Khoa cấp để DN đăng nhập (TenDangNhap = MaSoThue)
  TenDoanhNghiep: string;
  MaSoThue: string;
  DiaChi: string;
  TrangThaiChuan: boolean; // Doanh nghiệp đối tác của trường mặc định là Đạt chuẩn
  CreatedAt?: string;
  UpdatedAt?: string;
  DeletedAt?: string | null;
}

export interface NguoiHuongDanDoanhNghiep {
  Id: number;
  DoanhNghiepId: number;
  HoTen: string;
  SoDienThoai?: string;
  Email?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface DotThucTap {
  Id: number;
  TenDot: string;
  NamHoc: string; // Ví dụ: '2026-2027'
  ThuTuDot?: ThuTuDot; // 'Dot1' | 'Dot2' | 'Dot3' | 'DotDuPhong'
  NgayBatDauDangKy: string;
  NgayKetThucDangKy: string;
  NgayBatDau: string;
  NgayKetThuc: string;
  TaoBoiGiangVienId: number;
  CreatedAt?: string;
  UpdatedAt?: string;
  DeletedAt?: string | null;
}

// Bảng CongViecThucTap (Doanh nghiệp đăng tuyển trong đợt - Sàn việc làm nội bộ)
export interface CongViecThucTap {
  Id: number;
  DoanhNghiepId: number;
  DotThucTapId: number;
  TieuDe: string; // Vị trí tuyển dụng (vd: Thực tập sinh Backend Node.js)
  MoTaCongViec: string;
  YeuCauUngVien?: string;
  SoLuongTuyen: number;
  HanNopHoSo: string;
  TrangThaiDuyetJob: TrangThaiDuyetJob; // 'ChoKhoaDuyet' | 'DaDuyet' | 'TuChoi'
  LyDoTuChoi?: string;
  NguoiHuongDanDnId?: number; // Mentor đảm nhận job đăng tải
  CreatedAt?: string;
  UpdatedAt?: string;

  // Joined fields for UI
  TenDoanhNghiep?: string;
  MaSoThue?: string;
  NguoiHuongDan?: {
    HoTen: string;
    SoDienThoai: string;
    Email: string;
  };
  doanhNghiep?: DoanhNghiep;
  mentorDn?: NguoiHuongDanDoanhNghiep;
  dotThucTap?: DotThucTap;
  soLuongDaNop?: number;
}

export interface HoSoThucTap {
  DangKyThucTapId: number; // 1-1 với DangKyThucTap
  CoVanHocTap?: string;
  DiemGPA?: number;
  ViTriUngTuyenDuKien?: string;
  NangLucChuyenMon?: string;
  TrinhDoNgoaiNgu?: string;
  DiaChiHoKhau?: string;
  DiaChiHienTai?: string;
  DuongDanCV?: string;
  CamKetQuyChe: boolean;
  CamKetChinhXac: boolean;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface DangKyThucTap {
  Id: number;
  SinhVienId: number;
  DotThucTapId: number;
  LoaiDangKy?: LoaiDangKy; // 'UngTuyenJob' | 'NgoaiTruong'
  CongViecId?: number; // Khóa ngoại tới Job nếu là 'UngTuyenJob'
  TrangThaiDangKy: TrangThaiDangKy;
  NguonNhanSu?: NguonNhanSu;
  GiaoVienGioiThieu?: string;
  DoanhNghiepId?: number;
  ViTriPhanCong?: string;
  NguoiHuongDanDnId?: number;
  GiangVienHuongDanId?: number;
  LyDoTuChoi?: string;
  ActiveSinhVienId?: number | null;
  CreatedAt: string;
  UpdatedAt?: string;

  // Joined / computed data for UI
  sinhVien?: SinhVien;
  hoSoThucTap?: HoSoThucTap;
  congViec?: CongViecThucTap;
  doanhNghiep?: DoanhNghiep;
  mentorDn?: NguoiHuongDanDoanhNghiep;
  giangVienHuongDan?: GiangVien;
  dotThucTap?: DotThucTap;
}

export interface NhatKyThucTap {
  Id: number;
  DangKyThucTapId: number;
  TuanThu: number;
  NoiDungCongViec: string;
  KetQuaDatDuoc: string;
  NgayTao: string;
  NhanXetCuaGiangVien?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface BaoCaoThucTap {
  Id: number;
  DangKyThucTapId: number;
  DuongDanFile: string;
  TrangThaiBaoCao: TrangThaiBaoCao;
  NhanXetCuaGiangVien?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface TieuChiChamDiem {
  Id: number;
  DotThucTapId: number;
  Stt: number;
  NoiDungDanhGia: string;
  DiemToiDa: number;
  Clo?: string; // vd: CLO1.1, CLO4.1
  NguoiCham: NguoiCham;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface ChiTietKetQuaThucTap {
  Id: number;
  KetQuaThucTapId: number;
  TieuChiId: number;
  DiemDanhGia: number;
  NhanXetTieuChi?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
  tieuChi?: TieuChiChamDiem;
}

export interface KetQuaThucTap {
  Id: number;
  DangKyThucTapId: number;
  TongDiemDoanhNghiep: number; // max 5.0
  TongDiemGiangVien: number;   // max 5.0
  DiemTongKet: number;         // Thang điểm 10 (DN + GV)
  NhanXetChung?: string;
  NguoiHuongDanDnId?: number | null;
  CreatedAt?: string;
  UpdatedAt?: string;
  ChiTietDiem?: ChiTietKetQuaThucTap[];
  NgayCham?: string;
}

export interface ThongBao {
  Id: number;
  NguoiDungId: number;
  TieuDe: string;
  NoiDung: string;
  DaDoc: boolean;
  LoaiThongBao?: string;
  DuongDan?: string;
  CreatedAt: string;
}

export interface LichSuHoatDong {
  Id: number;
  NguoiDungId: number;
  HanhDong: string;
  ChiTiet?: string;
  IpAddress?: string;
  CreatedAt: string;
}

export interface TinTuc {
  Id: number;
  TieuDe: string;
  Slug: string;
  TomTat?: string | null;
  NoiDung: string;
  HinhAnhDaiDien?: string | null;
  DoiTuongXem: DoiTuongXem;
  GhimTin: boolean;
  TacGiaId: number;
  LuotXem: number;
  CreatedAt: string;
  UpdatedAt?: string;
  DeletedAt?: string | null;
}

// Current logged in user session
export interface UserSession {
  nguoiDungId?: number;
  email: string;
  role: VaiTro;
  hoTen: string;
  subInfo: string;
  avatarChar: string;
  coQuyenToChuc?: boolean; // For GiangVien
  truongKhoa?: boolean; // For GiangVien (TRUE: Trưởng Khoa)
  sinhVienId?: number;
  giangVienId?: number;
  doanhNghiepId?: number;
  maSoThue?: string;
  maGiangVien?: string;
  mssv?: string;
  chuyenNganh?: ChuyenNganh;
}
