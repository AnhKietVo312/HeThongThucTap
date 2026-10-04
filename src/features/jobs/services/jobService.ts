import { CongViecThucTap } from '@/types/database.types';

export const jobService = {
  async getJobs(params?: {
    dotThucTapId?: number;
    doanhNghiepId?: number;
    status?: string;
  }): Promise<CongViecThucTap[]> {
    const query = new URLSearchParams();
    if (params?.dotThucTapId) query.set('dotThucTapId', String(params.dotThucTapId));
    if (params?.doanhNghiepId) query.set('doanhNghiepId', String(params.doanhNghiepId));
    if (params?.status) query.set('status', params.status);

    const res = await fetch(`/api/jobs?${query.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi lấy danh sách việc làm');
    return data.data;
  },

  async createJob(payload: {
    DoanhNghiepId: number;
    DotThucTapId: number;
    TieuDe: string;
    MoTaCongViec: string;
    YeuCauUngVien?: string;
    SoLuongTuyen?: number;
    HanNopHoSo: string;
    NguoiHuongDanDnId?: number;
    mentorTen?: string;
    mentorSdt?: string;
    mentorEmail?: string;
  }) {
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi đăng tin tuyển dụng');
    return data;
  },

  async reviewJob(jobId: number, status: 'ChoKhoaDuyet' | 'DaDuyet' | 'TuChoi', lyDoTuChoi?: string) {
    const res = await fetch(`/api/jobs/${jobId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, lyDoTuChoi }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi duyệt tin tuyển dụng');
    return data;
  },
};
