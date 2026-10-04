export const exportService = {
  async getExportData(dotThucTapId?: number, giangVienId?: number) {
    const params = new URLSearchParams();
    if (dotThucTapId) params.set('dotThucTapId', String(dotThucTapId));
    if (giangVienId) params.set('giangVienId', String(giangVienId));

    const res = await fetch(`/api/export/scores?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi xuất dữ liệu bảng điểm');
    return data;
  },

  async downloadExcel(dotThucTapId?: number, giangVienId?: number) {
    const params = new URLSearchParams();
    if (dotThucTapId) params.set('dotThucTapId', String(dotThucTapId));
    if (giangVienId) params.set('giangVienId', String(giangVienId));
    params.set('format', 'excel');

    const res = await fetch(`/api/export/scores?${params.toString()}`);
    if (!res.ok) throw new Error('Lỗi xuất tệp Excel');

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HUIT_BangDiemThucTap_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
