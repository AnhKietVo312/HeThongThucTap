import { TieuChiChamDiem, KetQuaThucTap, NhatKyThucTap, BaoCaoThucTap } from '@/types/database.types';

export const evaluationService = {
  async getRubrics(dotThucTapId?: number, nguoiCham?: 'GiangVien' | 'DoanhNghiep'): Promise<TieuChiChamDiem[]> {
    const params = new URLSearchParams();
    if (dotThucTapId) params.set('dotThucTapId', String(dotThucTapId));
    if (nguoiCham) params.set('nguoiCham', nguoiCham);

    const res = await fetch(`/api/evaluation/rubrics?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi lấy tiêu chí Rubric');
    return data.data;
  },

  async getGrades(dangKyThucTapId: number): Promise<KetQuaThucTap | null> {
    const res = await fetch(`/api/evaluation/grades?dangKyThucTapId=${dangKyThucTapId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi lấy bảng điểm');
    return data.data;
  },

  async submitGrade(payload: {
    dangKyThucTapId: number;
    nguoiCham: 'DoanhNghiep' | 'GiangVien';
    scores: Array<{ tieuChiId: number; diemDanhGia: number; nhanXetTieuChi?: string }>;
    nhanXetChung?: string;
    nguoiHuongDanDnId?: number;
  }) {
    const res = await fetch('/api/evaluation/grades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi lưu bảng điểm');
    return data;
  },

  async getDiaries(dangKyThucTapId: number): Promise<NhatKyThucTap[]> {
    const res = await fetch(`/api/diaries?dangKyThucTapId=${dangKyThucTapId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi lấy danh sách nhật ký');
    return data.data;
  },

  async addDiary(payload: {
    DangKyThucTapId: number;
    TuanThu: number;
    NoiDungCongViec: string;
    KetQuaDatDuoc: string;
    NgayTao?: string;
  }) {
    const res = await fetch('/api/diaries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi thêm nhật ký');
    return data;
  },

  async feedbackDiary(diaryId: number, nhanXetGv: string) {
    const res = await fetch(`/api/diaries/${diaryId}/feedback`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nhanXetGv }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi lưu nhận xét nhật ký');
    return data;
  },

  async getReports(dangKyThucTapId: number): Promise<BaoCaoThucTap[]> {
    const res = await fetch(`/api/reports?dangKyThucTapId=${dangKyThucTapId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi lấy thông tin báo cáo');
    return data.data;
  },

  async submitReport(payload: {
    DangKyThucTapId: number;
    DuongDanFile: string;
  }) {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi nộp báo cáo');
    return data;
  },

  async reviewReport(reportId: number, trangThaiBaoCao: string, nhanXetCuaGiangVien?: string) {
    const res = await fetch(`/api/reports/${reportId}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trangThaiBaoCao, nhanXetCuaGiangVien }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi đánh giá báo cáo');
    return data;
  },
};
