export interface LecturerAssignmentItem {
  Id: number;
  MaGiangVien: string;
  HoTen: string;
  Email?: string;
  SoDienThoai?: string;
  Khoa: string;
  TruongKhoa: boolean;
  CoQuyenToChuc: boolean;
  currentCount: number;
  maxCount: number;
  conNhanDuoc: number;
  daDay: boolean;
}

export const advisorService = {
  async getLecturers(dotThucTapId?: number): Promise<LecturerAssignmentItem[]> {
    const query = dotThucTapId ? `?dotThucTapId=${dotThucTapId}` : '';
    const res = await fetch(`/api/faculty/lecturers${query}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi lấy danh sách giảng viên');
    return data.data;
  },

  async assignAdvisor(payload: {
    registrationIds: number[];
    giangVienId: number;
    dotThucTapId: number;
  }) {
    const res = await fetch('/api/faculty/assign-advisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi phân công giảng viên hướng dẫn');
    return data;
  },

  async updatePermission(giangVienId: number, coQuyenToChuc: boolean) {
    const res = await fetch(`/api/faculty/lecturers/${giangVienId}/permission`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coQuyenToChuc }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi cập nhật quyền tổ chức');
    return data;
  },
};
