'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { UserSession, DangKyThucTap, KetQuaThucTap, DotThucTap } from '@/types/database.types';
import { batchService } from '@/features/batches/services/batchService';
import { getBatchDisplayStatus } from '@/lib/batch-status';
import { GradingRubricModal } from '@/components/modals/GradingRubricModal';
import { ExportScoreModal } from '@/components/modals/ExportScoreModal';
import {
  FileXls,
  FilePdf,
  Archive,
  CheckCircle,
  FileText,
  CircleNotch,
} from '@phosphor-icons/react';

interface LecturerUnifiedViewProps {
  currentUser: UserSession;
  activeTab: string;
  onNavigateTab: (tab: string) => void;
  showToast: (msg: string) => void;
}

type LecturerDashboardRow = {
  Id: number;
  ViTriPhanCong?: string | null;
  SinhVien?: { Mssv: string; HoTen: string; Lop: string; ChuyenNganh: string } | Array<{ Mssv: string; HoTen: string; Lop: string; ChuyenNganh: string }> | null;
  DoanhNghiep?: { TenDoanhNghiep: string } | Array<{ TenDoanhNghiep: string }> | null;
  CongViecThucTap?: { TieuDe: string; TenDoanhNghiep: string } | Array<{ TieuDe: string; TenDoanhNghiep: string }> | null;
  KetQuaThucTap?: { TongDiemDoanhNghiep: number | null; TongDiemGiangVien: number | null } | Array<{ TongDiemDoanhNghiep: number | null; TongDiemGiangVien: number | null }> | null;
  NhatKyThucTap?: Array<{ TuanThu: number }> | null;
  BaoCaoThucTap?: Array<{ CreatedAt?: string; DuongDanFile: string; TrangThaiBaoCao: string }> | null;
  [key: string]: unknown;
};

export const LecturerUnifiedView: React.FC<LecturerUnifiedViewProps> = ({
  currentUser,
  activeTab,
  onNavigateTab,
  showToast,
}) => {
  // 8 sinh viên thuộc nhóm hướng dẫn của Giảng viên với đầy đủ chuyên ngành, tiến độ và điểm số
  type StudentRow = { id: number; mssv: string; hoTen: string; lop: string; chuyenNganh: string; cty: string; viTri: string; baoCao: string; diemDN: number; diemGV: number; tienDoNhatKy: string; trangThaiBaoCao: string; registration: DangKyThucTap };
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [batches, setBatches] = useState<DotThucTap[]>([]);
  const [isCreatingBatch, setIsCreatingBatch] = useState(false);

  const [selectedStudentForGrading, setSelectedStudentForGrading] = useState<DangKyThucTap | null>(null);
  const [isExportScoreModalOpen, setIsExportScoreModalOpen] = useState(false);

  const registrationsForExport = useMemo(() => students.map((student) => student.registration), [students]);

  const handleCreateBatch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isCreatingBatch) return;
    if (!currentUser.giangVienId) {
      showToast('Tài khoản hiện tại chưa liên kết với hồ sơ giảng viên.');
      return;
    }

    const form = event.currentTarget;
    const order = form.querySelector<HTMLSelectElement>('[name="ThuTuDot"]')?.value || 'Dot1';

    setIsCreatingBatch(true);
    try {
      const result = await batchService.createBatch({
        NamHoc: form.querySelector<HTMLInputElement>('[name="NamHoc"]')?.value.trim() || '',
        ThuTuDot: order,
        NgayBatDauDangKy: form.querySelector<HTMLInputElement>('[name="NgayBatDauDangKy"]')?.value || '',
        NgayKetThucDangKy: form.querySelector<HTMLInputElement>('[name="NgayKetThucDangKy"]')?.value || '',
        NgayBatDau: form.querySelector<HTMLInputElement>('[name="NgayBatDau"]')?.value || '',
        NgayKetThuc: form.querySelector<HTMLInputElement>('[name="NgayKetThuc"]')?.value || '',
        TaoBoiGiangVienId: currentUser.giangVienId,
      });
      setBatches((previous) => [result.data, ...previous]);
      form.reset();
      showToast('✓ Đã tạo đợt thực tập và khởi tạo rubric.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể tạo đợt thực tập.');
    } finally {
      setIsCreatingBatch(false);
    }
  };

  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (!currentUser.giangVienId) return;
      try {
        const [dashboardResponse, batchRows] = await Promise.all([
          fetch('/api/lecturer/dashboard', { cache: 'no-store' }),
          batchService.getBatches(),
        ]);
        const dashboard: { error?: string; data?: LecturerDashboardRow[] } = await dashboardResponse.json();
        if (!dashboardResponse.ok) throw new Error(dashboard.error || 'Không thể tải dữ liệu hướng dẫn.');
        const first = <T,>(value: T | T[] | null | undefined): T | undefined => Array.isArray(value) ? value[0] as T : value ?? undefined;
        const enriched = (dashboard.data || []).map((row) => {
          const student = first(row.SinhVien);
          const enterprise = first(row.DoanhNghiep);
          const job = first(row.CongViecThucTap);
          const grade = first(row.KetQuaThucTap);
          const diaries = Array.isArray(row.NhatKyThucTap) ? row.NhatKyThucTap : [];
          const reports = Array.isArray(row.BaoCaoThucTap) ? row.BaoCaoThucTap : [];
          reports.sort((a: { CreatedAt?: string }, b: { CreatedAt?: string }) => String(b.CreatedAt || '').localeCompare(String(a.CreatedAt || '')));
          const report = reports[0];
          const registration = {
            ...row,
            sinhVien: student,
            doanhNghiep: enterprise,
            congViec: job,
          } as DangKyThucTap;
          return {
            id: row.Id, mssv: student?.Mssv || '', hoTen: student?.HoTen || '',
            lop: student?.Lop || '', chuyenNganh: student?.ChuyenNganh || '',
            cty: enterprise?.TenDoanhNghiep || job?.TenDoanhNghiep || '',
            viTri: row.ViTriPhanCong || job?.TieuDe || '', baoCao: report?.DuongDanFile || 'Chưa nộp',
            diemDN: grade?.TongDiemDoanhNghiep || 0, diemGV: grade?.TongDiemGiangVien || 0,
            tienDoNhatKy: `${diaries.length} tuần`, trangThaiBaoCao: report?.TrangThaiBaoCao || 'Chưa nộp', registration,
          } satisfies StudentRow;
        });
        if (alive) { setStudents(enriched); setBatches(batchRows); }
      } catch (error) { showToast(error instanceof Error ? error.message : 'Không thể tải danh sách sinh viên hướng dẫn.'); }
    };
    void load();
    return () => { alive = false; };
  }, [currentUser.giangVienId, showToast]);
  const handleSaveGrade = (regId: number, result: KetQuaThucTap) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === regId
          ? {
              ...s,
              diemDN: result.TongDiemDoanhNghiep,
              diemGV: result.TongDiemGiangVien,
            }
          : s
      )
    );
    showToast(`✓ Đã lưu bảng điểm Rubric (Tổng: ${result.DiemTongKet.toFixed(2)}/10.0)!`);
    setSelectedStudentForGrading(null);
  };

  const getClassification = (score: number) => {
    if (score >= 9.0) return { label: 'Xuất sắc', color: 'text-purple-700 bg-purple-50 border-purple-200' };
    if (score >= 8.0) return { label: 'Giỏi', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (score >= 7.0) return { label: 'Khá', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (score >= 5.5) return { label: 'Trung bình', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { label: 'Không đạt', color: 'text-rose-700 bg-rose-50 border-rose-200' };
  };

  return (
    <div className="space-y-5 fade-in w-full max-w-6xl mx-auto">
      {/* TAB: gv-my-students (Quản lý SV hướng dẫn) */}
      {activeTab === 'gv-my-students' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs text-xs">
          <div className="p-4 px-5 border-b border-gray-100 flex flex-wrap justify-between items-center gap-3">
            <div>
              <h3 className="font-bold text-base text-gray-900">
                Danh sách nhóm sinh viên hướng dẫn
              </h3>
              <p className="text-gray-500 mt-0.5 text-xs">
                Giảng viên phụ trách: <strong>{currentUser.hoTen}</strong> ({currentUser.subInfo})
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 font-bold rounded-full border border-emerald-200 text-xs">
                Sĩ số nhóm: {students.length} sinh viên
              </span>
              <button
                onClick={() => onNavigateTab('gv-grading')}
                className="px-3 py-1 bg-huit-blue text-white rounded-lg font-bold text-xs hover:bg-[#002244] transition cursor-pointer shadow-2xs"
              >
                Vào chấm điểm Rubric →
              </button>
            </div>
          </div>

          <table className="w-full text-left">
            <thead className="bg-gray-50 uppercase text-gray-500 border-b text-[11px] font-bold tracking-wider">
              <tr>
                <th className="py-2.5 px-4">MSSV & Sinh viên</th>
                <th className="py-2.5 px-4">Lớp & Chuyên ngành</th>
                <th className="py-2.5 px-4">Đơn vị & Vị trí thực tập</th>
                <th className="py-2.5 px-4 text-center">Tiến độ nhật ký</th>
                <th className="py-2.5 px-4 text-center">Báo cáo</th>
                <th className="py-2.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/60">
                  <td className="py-3 px-4">
                    <p className="font-bold text-huit-blue text-sm">{s.hoTen}</p>
                    <p className="font-mono text-gray-500 text-[11px]">{s.mssv}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-gray-800">{s.lop}</p>
                    <p className="text-gray-500 text-[11px]">{s.chuyenNganh}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-gray-900 block line-clamp-1">{s.cty}</span>
                    <span className="text-gray-500 text-[11px]">Vị trí: {s.viTri}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2.5 py-0.5 bg-blue-50 text-huit-blue font-bold rounded-full border border-blue-200 text-xs">
                      {s.tienDoNhatKy}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                        s.trangThaiBaoCao === 'Đã nộp'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {s.trangThaiBaoCao}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-1.5 shrink-0">
                    <button
                      onClick={() => showToast(`Xem chi tiết hồ sơ & nhật ký tuần của ${s.hoTen}`)}
                      className="px-2.5 py-1 border border-gray-200 hover:border-huit-blue rounded-lg font-semibold hover:bg-gray-50 cursor-pointer transition text-xs shadow-2xs"
                    >
                      Nhật ký
                    </button>
                    <button
                      onClick={() => {
                        const registration = students.find((student) => student.id === s.id)?.registration;
                        if (registration) setSelectedStudentForGrading(registration);
                      }}
                      className="px-2.5 py-1 bg-huit-blue hover:bg-[#002244] text-white rounded-lg font-bold cursor-pointer transition text-xs shadow-2xs"
                    >
                      Chấm Rubric
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB: gv-grading (Duyệt báo cáo & Chấm điểm Rubric) */}
      {activeTab === 'gv-grading' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs text-xs">
          <div className="p-5 border-b border-gray-100 flex flex-wrap justify-between items-center gap-3">
            <div>
              <h3 className="font-bold text-base text-gray-800">
                Bảng Đánh Giá & Chấm Điểm Rubric Hệ 10
              </h3>
              <p className="text-gray-500 mt-0.5">
                Cơ cấu điểm chuẩn HUIT: Điểm Doanh nghiệp (Max 5.0) + Điểm GVHD (Max 5.0) = Tổng (10.0)
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('gv-export')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
            >
              Xem & Xuất Bảng Điểm →
            </button>
          </div>

          <table className="w-full text-left">
            <thead className="bg-gray-50 uppercase text-gray-500 border-b text-[10px] font-bold tracking-wider">
              <tr>
                <th className="p-4">Sinh viên</th>
                <th className="p-4">Báo cáo nộp (PDF)</th>
                <th className="p-4 text-center">Điểm DN (5.0)</th>
                <th className="p-4 text-center">Điểm GV (5.0)</th>
                <th className="p-4 text-center">Tổng kết (10.0)</th>
                <th className="p-4 text-center">Xếp loại</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((s) => {
                const totalScore = s.diemDN + s.diemGV;
                const cls = getClassification(totalScore);
                return (
                  <tr key={s.id} className="hover:bg-gray-50/60">
                    <td className="p-4">
                      <p className="font-bold text-huit-blue text-sm">{s.hoTen}</p>
                      <p className="text-gray-400 font-mono text-[11px]">{s.mssv} • {s.lop}</p>
                    </td>
                    <td className="p-4">
                      <div
                        onClick={() => showToast(`Mở tệp báo cáo: ${s.baoCao}`)}
                        className="flex items-center gap-1.5 underline cursor-pointer text-gray-700 hover:text-huit-blue"
                      >
                        <FilePdf size={16} className="text-rose-600 shrink-0" weight="fill" />
                        <span className="line-clamp-1">{s.baoCao}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center font-mono font-bold text-sky-800 text-sm">
                      {s.diemDN.toFixed(2)}
                    </td>
                    <td className="p-4 text-center font-mono font-bold text-purple-800 text-sm">
                      {s.diemGV.toFixed(2)}
                    </td>
                    <td className="p-4 text-center font-mono font-black text-huit-red text-base">
                      {totalScore.toFixed(2)}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${cls.color}`}>
                        {cls.label}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => {
                          const registration = students.find((student) => student.id === s.id)?.registration;
                        if (registration) setSelectedStudentForGrading(registration);
                        }}
                        className="px-3 py-1.5 bg-huit-blue hover:bg-[#002244] text-white rounded-lg font-bold cursor-pointer transition shadow-xs text-xs"
                      >
                        ✎ Chấm điểm
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB: gv-export (Xuất Bảng Điểm - Dành cho TẤT CẢ GIẢNG VIÊN kể cả GV Thường) */}
      {activeTab === 'gv-export' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-6 text-xs">
          <div className="flex flex-wrap items-center justify-between pb-3 border-b border-gray-100 gap-3">
            <div>
              <h3 className="font-bold text-base text-gray-800">
                Xuất Báo cáo & Bảng điểm Thực tập Tốt nghiệp (GVHD)
              </h3>
              <p className="text-gray-500 mt-1">
                Giảng viên hướng dẫn: <strong>{currentUser.hoTen}</strong>. Kết xuất dữ liệu đánh
                giá chuẩn theo biểu mẫu Phòng Đào tạo HUIT.
              </p>
            </div>
            <button
              onClick={() => setIsExportScoreModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition cursor-pointer shadow-xs text-xs"
            >
              Mở hộp thoại Xuất bảng điểm →
            </button>
          </div>

          {/* 3 Nút Xuất Định Dạng Nhanh */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => setIsExportScoreModalOpen(true)}
              className="p-5 rounded-2xl border border-gray-200 hover:border-emerald-600 bg-gray-50/50 hover:bg-emerald-50/30 text-left transition flex flex-col justify-between h-36 cursor-pointer shadow-2xs group"
            >
              <FileXls
                size={36}
                weight="fill"
                className="text-emerald-600 group-hover:scale-110 transition"
              />
              <div>
                <p className="font-bold text-gray-800 text-sm">Bảng điểm Excel (.xlsx)</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Định dạng chuẩn biểu mẫu Phòng Đào tạo HUIT
                </p>
              </div>
            </button>

            <button
              onClick={() => setIsExportScoreModalOpen(true)}
              className="p-5 rounded-2xl border border-gray-200 hover:border-red-600 bg-gray-50/50 hover:bg-red-50/30 text-left transition flex flex-col justify-between h-36 cursor-pointer shadow-2xs group"
            >
              <FilePdf
                size={36}
                weight="fill"
                className="text-huit-red group-hover:scale-110 transition"
              />
              <div>
                <p className="font-bold text-gray-800 text-sm">Bảng điểm PDF (.pdf)</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Đầy đủ chữ ký xác nhận của Giảng viên hướng dẫn
                </p>
              </div>
            </button>

            <button
              onClick={() =>
                showToast(
                  '✓ Đang nén và tải xuống bộ Phiếu đánh giá Doanh nghiệp có mộc (.zip)...'
                )
              }
              className="p-5 rounded-2xl border border-gray-200 hover:border-huit-blue bg-gray-50/50 hover:bg-blue-50/30 text-left transition flex flex-col justify-between h-36 cursor-pointer shadow-2xs group"
            >
              <Archive
                size={36}
                weight="fill"
                className="text-huit-blue group-hover:scale-110 transition"
              />
              <div>
                <p className="font-bold text-gray-800 text-sm">Phiếu chấm Doanh nghiệp (.zip)</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Tải toàn bộ file scan có dấu mộc xác nhận
                </p>
              </div>
            </button>
          </div>

          {/* Bảng Xem Trước Kết Quả Điểm Của 8 Sinh Viên */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <span className="font-bold text-gray-800 text-xs">
                Xem trước bảng điểm nhóm hướng dẫn ({students.length} sinh viên)
              </span>
              <span className="text-gray-500 text-[11px]">
                Điểm TB nhóm:{' '}
                <strong className="text-emerald-700 font-mono">
                  {(
                    students.reduce((acc, s) => acc + s.diemDN + s.diemGV, 0) / students.length
                  ).toFixed(2)}
                  /10.0
                </strong>
              </span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 uppercase text-gray-500 border-b text-[10px] font-bold">
                <tr>
                  <th className="p-3">MSSV</th>
                  <th className="p-3">Họ và tên</th>
                  <th className="p-3">Chuyên ngành</th>
                  <th className="p-3 text-center">Điểm DN</th>
                  <th className="p-3 text-center">Điểm GV</th>
                  <th className="p-3 text-center">Tổng điểm</th>
                  <th className="p-3 text-center">Xếp loại</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((s) => {
                  const total = s.diemDN + s.diemGV;
                  const cls = getClassification(total);
                  return (
                    <tr key={s.id} className="hover:bg-gray-50/50">
                      <td className="p-3 font-mono text-gray-600 font-bold">{s.mssv}</td>
                      <td className="p-3 font-bold text-huit-blue">{s.hoTen}</td>
                      <td className="p-3 text-gray-600">{s.chuyenNganh}</td>
                      <td className="p-3 text-center font-mono font-bold text-sky-800">
                        {s.diemDN.toFixed(2)}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-purple-800">
                        {s.diemGV.toFixed(2)}
                      </td>
                      <td className="p-3 text-center font-mono font-black text-huit-red text-sm">
                        {total.toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${cls.color}`}>
                          {cls.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: shared-create-batch (Chỉ xuất hiện nếu coQuyenToChuc === true) */}
      {currentUser.coQuyenToChuc && activeTab === 'shared-create-batch' && (
        <div className="space-y-6 text-xs">
          {/* Form tạo đợt - đồng bộ giao diện với Quản trị Khoa */}
          <div className="max-w-3xl bg-white p-6 rounded-2xl border border-gray-200 space-y-5 shadow-2xs">
            <div>
              <h3 className="font-bold text-base text-gray-800">Tổ chức đợt thực tập tốt nghiệp mới</h3>
              <p className="text-gray-500 mt-1">
                Giảng viên được ủy quyền: <strong>{currentUser.hoTen}</strong> (CoQuyenToChuc: True). Giao diện và trường dữ liệu đồng bộ với cổng Quản trị Khoa.
              </p>
            </div>
            <form onSubmit={handleCreateBatch} aria-busy={isCreatingBatch} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    Năm học * (ví dụ: 2026-2027)
                  </label>
                  <input
                    name="NamHoc"
                    type="text"
                    required
                    pattern="[0-9]{4}-[0-9]{4}"
                    defaultValue="2026-2027"
                    className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:border-huit-blue text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    Thứ tự đợt *
                  </label>
                  <select
                    name="ThuTuDot"
                    defaultValue="Dot1"
                    className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:border-huit-blue text-xs bg-white cursor-pointer font-medium"
                  >
                    <option value="Dot1">Đợt 1 (Chính khóa HK2)</option>
                    <option value="Dot2">Đợt 2 (Chính khóa HK1)</option>
                    <option value="Dot3">Đợt 3 (Học kỳ Hè)</option>
                    <option value="DotDuPhong">Đợt dự phòng (Tốt nghiệp muộn)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    Bắt đầu nhận hồ sơ *
                  </label>
                  <input
                    name="NgayBatDauDangKy"
                    type="date"
                    required
                    defaultValue="2027-01-05"
                    className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:border-huit-blue text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    Kết thúc nhận hồ sơ *
                  </label>
                  <input
                    name="NgayKetThucDangKy"
                    type="date"
                    required
                    defaultValue="2027-01-25"
                    className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:border-huit-blue text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    Ngày bắt đầu thực tập tại DN *
                  </label>
                  <input
                    name="NgayBatDau"
                    type="date"
                    required
                    defaultValue="2027-02-15"
                    className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:border-huit-blue text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    Ngày kết thúc nộp báo cáo *
                  </label>
                  <input
                    name="NgayKetThuc"
                    type="date"
                    required
                    defaultValue="2027-05-30"
                    className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:border-huit-blue text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isCreatingBatch}
                  className="px-5 py-2.5 bg-huit-blue hover:bg-[#002244] text-white font-bold rounded-xl cursor-pointer shadow-sm transition"
                >
                  {isCreatingBatch ? <CircleNotch size={16} className="mr-2 inline animate-spin" /> : null}
                  {isCreatingBatch ? 'Đang tạo đợt...' : 'Khởi tạo & Kích hoạt đợt'}
                </button>
              </div>
            </form>
          </div>

          {/* Danh sách các đợt thực tập hiện có */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs space-y-4">
            <h4 className="font-bold text-sm text-gray-800">
              Danh sách các Đợt thực tập trên hệ thống
            </h4>
            <div className="space-y-3">
              {batches.map((dot) => (
                <div
                  key={dot.Id}
                  className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm">{dot.TenDot}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${getBatchDisplayStatus(dot).className}`}
                      >
                        {getBatchDisplayStatus(dot).label}
                      </span>
                    </div>
                    <p className="text-gray-500 mt-0.5">
                      Thứ tự đợt: <strong>{dot.ThuTuDot}</strong> • Năm học: <strong>{dot.NamHoc}</strong>
                    </p>
                    <p className="text-gray-500 font-mono text-[11px]">
                      Đăng ký: {dot.NgayBatDauDangKy} → {dot.NgayKetThucDangKy} | Thực tập:{' '}
                      {dot.NgayBatDau} → {dot.NgayKetThuc}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => showToast(`Xem chi tiết đợt: ${dot.TenDot}`)}
                      className="px-3 py-1.5 bg-white border border-gray-300 hover:border-huit-blue text-gray-700 rounded-lg font-semibold transition cursor-pointer"
                    >
                      Chi tiết
                    </button>
                    <button
                      onClick={() => showToast('Cấu hình biểu mẫu thành công!')}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-huit-blue rounded-lg font-bold transition cursor-pointer border border-blue-200"
                    >
                      Cấu hình
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Chấm điểm Rubric */}
      <GradingRubricModal
        isOpen={!!selectedStudentForGrading}
        onClose={() => setSelectedStudentForGrading(null)}
        registration={selectedStudentForGrading}
        onSaveGrade={handleSaveGrade}
      />

      {/* Modal Xuất Bảng Điểm */}
      <ExportScoreModal
        isOpen={isExportScoreModalOpen}
        onClose={() => setIsExportScoreModalOpen(false)}
        registrations={registrationsForExport}
        lecturerName={currentUser.hoTen}
      />
    </div>
  );
};
