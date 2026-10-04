import { DangKyThucTap } from '@/types/database.types';

export const registrationService = {
  async getRegistrations(params?: {
    sinhVienId?: number;
    dotThucTapId?: number;
    congViecId?: number;
    doanhNghiepId?: number;
    giangVienId?: number;
    trangThai?: string;
    loaiDangKy?: string;
  }): Promise<DangKyThucTap[]> {
    const query = new URLSearchParams();
    if (params?.sinhVienId) query.set('sinhVienId', String(params.sinhVienId));
    if (params?.dotThucTapId) query.set('dotThucTapId', String(params.dotThucTapId));
    if (params?.congViecId) query.set('congViecId', String(params.congViecId));
    if (params?.doanhNghiepId) query.set('doanhNghiepId', String(params.doanhNghiepId));
    if (params?.giangVienId) query.set('giangVienId', String(params.giangVienId));
    if (params?.trangThai) query.set('trangThai', params.trangThai);
    if (params?.loaiDangKy) query.set('loaiDangKy', params.loaiDangKy);

    const res = await fetch(`/api/registrations?${query.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi lấy danh sách đăng ký thực tập');
    return data.data;
  },

  async submitStep1(payload: {
    sinhVienId: number;
    dotThucTapId: number;
    coVanHocTap?: string;
    diemGPA?: string | number;
    viTriUngTuyenDuKien?: string;
    nangLucChuyenMon?: string;
    trinhDoNgoaiNgu?: string;
    diaChiHoKhau?: string;
    diaChiHienTai?: string;
    duongDanCV?: string;
    camKetChinhXac: boolean;
    camKetQuyChe: boolean;
  }) {
    const res = await fetch('/api/registrations/step1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi lưu thông tin Bước 1');
    return data;
  },

  async applyJob(registrationId: number, jobId: number) {
    const res = await fetch('/api/registrations/apply-job', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registrationId, jobId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi ứng tuyển công việc');
    return data;
  },

  async submitExternal(payload: {
    registrationId: number;
    nguonNhanSu?: string;
    giaoVienGioiThieu?: string;
    tenDoanhNghiep: string;
    maSoThue: string;
    diaChi: string;
    viTriPhanCong: string;
    mentorTen?: string;
    mentorSdt?: string;
    mentorEmail?: string;
  }) {
    const res = await fetch('/api/registrations/external', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi gửi hồ sơ ngoài trường');
    return data;
  },

  async reviewEnterprise(registrationId: number, action: 'Duyet' | 'TuChoi', lyDoTuChoi?: string) {
    const res = await fetch(`/api/registrations/${registrationId}/enterprise-review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, lyDoTuChoi }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi duyệt hồ sơ từ doanh nghiệp');
    return data;
  },

  async reviewFaculty(registrationId: number, action: 'Duyet' | 'TuChoi', lyDoTuChoi?: string) {
    const res = await fetch(`/api/registrations/${registrationId}/faculty-review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, lyDoTuChoi }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi duyệt hồ sơ từ Khoa');
    return data;
  },

  async cancelRegistration(registrationId: number) {
    const res = await fetch('/api/registrations/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registrationId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi hủy hồ sơ');
    return data;
  },
};
