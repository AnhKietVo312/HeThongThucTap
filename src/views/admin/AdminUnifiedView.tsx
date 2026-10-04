'use client';

import React, { useEffect, useState } from 'react';
import { UserSession, CongViecThucTap, DoanhNghiep, DotThucTap, TieuChiChamDiem } from '@/types/database.types';
import { jobService } from '@/features/jobs/services/jobService';
import { registrationService } from '@/features/registration/services/registrationService';
import { advisorService } from '@/features/advisor-assignment/services/advisorService';
import { batchService } from '@/features/batches/services/batchService';
import { evaluationService } from '@/features/evaluation/services/evaluationService';
import { Modal } from '@/shared/ui/Modal';
import { getBatchDisplayStatus } from '@/lib/batch-status';
import {
  FilePdf,
  CheckCircle,
  XCircle,
  Clock,
  Buildings,
  GraduationCap,
  CalendarBlank,
  FileText,
  Briefcase,
  Storefront,
  Funnel,
  Plus,
  ArrowCounterClockwise,
} from '@phosphor-icons/react';

interface AdminUnifiedViewProps {
  currentUser: UserSession;
  activeTab: string;
  onNavigateTab: (tab: string) => void;
  showToast: (msg: string) => void;
}

const MAJORS = ['Khoa học dữ liệu', 'Hệ thống thông tin', 'Kỹ thuật phần mềm', 'Mạng máy tính và An toàn thông tin', 'Công nghệ số'];

export const AdminUnifiedView: React.FC<AdminUnifiedViewProps> = ({
  currentUser,
  activeTab,
  onNavigateTab,
  showToast,
}) => {
  // Tổng hợp danh sách sinh viên từ hồ sơ đăng ký do API tải về.
  type StudentRow = { id: number; registrationId: number; sinhVienId: number; dotThucTapId: number; mssv: string; hoTen: string; lop: string; chuyenNganh: string; gpa: string; ngoaiNgu: string; cv: string; cty: string; mst: string; mentor: string; trangThai: string; gvhdId: number | null };
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [reviewingStudent, setReviewingStudent] = useState<StudentRow | null>(null);
  const [adminEnterprises, setAdminEnterprises] = useState<DoanhNghiep[]>([]);
  const [batches, setBatches] = useState<DotThucTap[]>([]);
  const [rubrics, setRubrics] = useState<TieuChiChamDiem[]>([]);
  const [reportOverview, setReportOverview] = useState<{
    total: number; approved: number; pending: number; enterpriseCount: number; graded: number;
    reportsPending: number; diaryRegistrationCount: number;
    sourceCounts: { DanhSachKhoa: number; TuTim: number; GvGioiThieu: number };
    byMajor: Array<{ name: string; count: number; percent: number; complete: number }>;
  } | null>(null);
  const [reportOverviewLoading, setReportOverviewLoading] = useState(false);
  const [isCreatingBatch, setIsCreatingBatch] = useState(false);

  // Danh sách giảng viên với định mức chuẩn tối đa 30 sinh viên
  const [lecturers, setLecturers] = useState<Array<{ id: number; maGV: string; hoTen: string; email?: string; boMon: string; coQuyenToChuc: boolean; currentCount: number; maxCount: number }>>([]);

  // Bộ lọc cho tab duyệt hồ sơ
  const [approveFilterMajor, setApproveFilterMajor] = useState('Tất cả chuyên ngành');
  const [approveFilterStatus, setApproveFilterStatus] = useState('Tất cả trạng thái');

  // Bộ lọc và chọn phân công GVHD
  const [selectedMajorFilter, setSelectedMajorFilter] = useState('Tất cả chuyên ngành');
  const [selectedGvId, setSelectedGvId] = useState(0);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);

  // Danh mục tab con
  const [catalogSubTab, setCatalogSubTab] = useState<'enterprises' | 'majors' | 'rubric'>('enterprises');

  // Quản lý kiểm duyệt vị trí tuyển dụng của Doanh nghiệp (Nghiệp vụ 2)
  const [adminJobs, setAdminJobs] = useState<CongViecThucTap[]>([]);
  const [jobStatusFilter, setJobStatusFilter] = useState<'TatCa' | 'ChoKhoaDuyet' | 'DaDuyet' | 'TuChoi'>('TatCa');
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        if (activeTab === 'admin-jobs') {
          const rows = await jobService.getJobs();
          if (alive) setAdminJobs(rows);
        } else if (activeTab === 'admin-approve' || (activeTab === 'admin-catalog' && catalogSubTab === 'majors')) {
          const rows = await registrationService.getRegistrations();
          if (alive) setStudents(rows.filter((r) => r.sinhVien).map((r) => ({
            id: r.Id, registrationId: r.Id, sinhVienId: r.SinhVienId, dotThucTapId: r.DotThucTapId,
            mssv: r.sinhVien!.Mssv, hoTen: r.sinhVien!.HoTen, lop: r.sinhVien!.Lop, chuyenNganh: r.sinhVien!.ChuyenNganh,
            gpa: r.hoSoThucTap?.DiemGPA == null ? '?' : String(r.hoSoThucTap.DiemGPA),
            ngoaiNgu: r.hoSoThucTap?.TrinhDoNgoaiNgu || '?', cv: r.hoSoThucTap?.DuongDanCV || '',
            cty: r.doanhNghiep?.TenDoanhNghiep || r.congViec?.TenDoanhNghiep || '?', mst: r.doanhNghiep?.MaSoThue || r.congViec?.MaSoThue || '?',
            mentor: r.mentorDn?.HoTen || '?', trangThai: r.TrangThaiDangKy, gvhdId: r.GiangVienHuongDanId || null,
          })));
        } else if (activeTab === 'admin-assign') {
          const [registrations, batchRows, lecturerRows] = await Promise.all([
            registrationService.getRegistrations(), batchService.getBatches(), advisorService.getLecturers(),
          ]);
          if (!alive) return;
          setStudents(registrations.filter((r) => r.sinhVien).map((r) => ({
            id: r.Id, registrationId: r.Id, sinhVienId: r.SinhVienId, dotThucTapId: r.DotThucTapId,
            mssv: r.sinhVien!.Mssv, hoTen: r.sinhVien!.HoTen, lop: r.sinhVien!.Lop, chuyenNganh: r.sinhVien!.ChuyenNganh,
            gpa: r.hoSoThucTap?.DiemGPA == null ? '?' : String(r.hoSoThucTap.DiemGPA),
            ngoaiNgu: r.hoSoThucTap?.TrinhDoNgoaiNgu || '?', cv: r.hoSoThucTap?.DuongDanCV || '',
            cty: r.doanhNghiep?.TenDoanhNghiep || r.congViec?.TenDoanhNghiep || '?', mst: r.doanhNghiep?.MaSoThue || r.congViec?.MaSoThue || '?',
            mentor: r.mentorDn?.HoTen || '?', trangThai: r.TrangThaiDangKy, gvhdId: r.GiangVienHuongDanId || null,
          })));
          setBatches(batchRows);
          setLecturers(lecturerRows.map((g) => ({ id: g.Id, maGV: g.MaGiangVien, hoTen: g.HoTen, email: g.Email, boMon: g.Khoa, coQuyenToChuc: g.CoQuyenToChuc, currentCount: g.currentCount, maxCount: g.maxCount })));
        } else if (activeTab === 'shared-create-batch') {
          const rows = await batchService.getBatches();
          if (alive) setBatches(rows);
        } else if (activeTab === 'admin-permissions') {
          const rows = await advisorService.getLecturers();
          if (alive) setLecturers(rows.map((g) => ({ id: g.Id, maGV: g.MaGiangVien, hoTen: g.HoTen, email: g.Email, boMon: g.Khoa, coQuyenToChuc: g.CoQuyenToChuc, currentCount: g.currentCount, maxCount: g.maxCount })));
        } else if (activeTab === 'admin-catalog') {
          if (catalogSubTab === 'enterprises') {
            const response = await fetch('/api/enterprises');
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Unable to load enterprises.');
            if (alive && result.success) setAdminEnterprises(result.data || []);
          } else if (catalogSubTab === 'rubric') {
            const rows = await evaluationService.getRubrics();
            if (alive) setRubrics(rows);
          }
        }
      } catch (error) {
        if (alive) showToast(error instanceof Error ? error.message : 'Unable to load admin data.');
      }
    };
    void load();
    return () => { alive = false; };
  }, [activeTab, catalogSubTab, showToast]);

  useEffect(() => {
    if (activeTab !== 'admin-stats') return;
    const controller = new AbortController();
    queueMicrotask(() => {
      if (controller.signal.aborted) return;
      setReportOverviewLoading(true);
      void fetch('/api/reports/overview', { signal: controller.signal, cache: 'no-store' })
        .then(async (response) => {
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || 'Không thể tải báo cáo thống kê.');
          setReportOverview(result.data);
        })
        .catch((error: unknown) => {
          if (!controller.signal.aborted) showToast(error instanceof Error ? error.message : 'Không thể tải báo cáo thống kê.');
        })
        .finally(() => { if (!controller.signal.aborted) setReportOverviewLoading(false); });
    });
    return () => controller.abort();
  }, [activeTab, showToast]);

  const handleCreateBatch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isCreatingBatch) return;
    const form = event.currentTarget;
    const order = form.querySelector<HTMLSelectElement>('[name="ThuTuDot"]')?.value || 'Dot1';
    if (!currentUser.giangVienId) {
      showToast('Tài khoản hiện tại không có mã giảng viên để tạo đợt.');
      return;
    }
    setIsCreatingBatch(true);
    try {
      const result = await batchService.createBatch({
        NamHoc: form.querySelector<HTMLInputElement>('[name="NamHoc"]')?.value.trim() || '', ThuTuDot: order,
        NgayBatDauDangKy: form.querySelector<HTMLInputElement>('[name="NgayBatDauDangKy"]')?.value || '',
        NgayKetThucDangKy: form.querySelector<HTMLInputElement>('[name="NgayKetThucDangKy"]')?.value || '',
        NgayBatDau: form.querySelector<HTMLInputElement>('[name="NgayBatDau"]')?.value || '',
        NgayKetThuc: form.querySelector<HTMLInputElement>('[name="NgayKetThuc"]')?.value || '',
        TaoBoiGiangVienId: currentUser.giangVienId,
      });
      setBatches((prev) => [result.data, ...prev]);
      form.reset();
      showToast('Đã tạo đợt thực tập và khởi tạo rubric.');
    } catch (error) { showToast(error instanceof Error ? error.message : 'Không thể tạo đợt thực tập.'); }
    finally { setIsCreatingBatch(false); }
  };
  const handleApproveJob = async (jobId: number) => {
    try {
      await jobService.reviewJob(jobId, 'DaDuyet');
      setAdminJobs((prev) => prev.map((job) => job.Id === jobId ? { ...job, TrangThaiDuyetJob: 'DaDuyet' } : job));
      showToast('Đã duyệt tin tuyển dụng.');
    } catch (error) { showToast(error instanceof Error ? error.message : 'Không thể duyệt tin tuyển dụng.'); }
  };

  const handleRejectJob = async (jobId: number) => {
    const reason = prompt('Nhập lý do từ chối bài tuyển dụng:', 'Mô tả công việc chưa phù hợp chuyên ngành đào tạo');
    if (reason && reason.trim()) {
      try {
        await jobService.reviewJob(jobId, 'TuChoi', reason);
        setAdminJobs((prev) => prev.map((job) => job.Id === jobId ? { ...job, TrangThaiDuyetJob: 'TuChoi', LyDoTuChoi: reason } : job));
        showToast(`Đã từ chối tin tuyển dụng: ${reason}`);
      } catch (error) { showToast(error instanceof Error ? error.message : 'Không thể từ chối tin tuyển dụng.'); }
    }
  };

  const handleRevokeJobApproval = async (jobId: number) => {
    try {
      await jobService.reviewJob(jobId, 'ChoKhoaDuyet');
      setAdminJobs((prev) => prev.map((job) => job.Id === jobId ? { ...job, TrangThaiDuyetJob: 'ChoKhoaDuyet' } : job));
      showToast('Đã thu hồi phê duyệt; tin tuyển dụng đang chờ xét duyệt lại.');
    } catch (error) { showToast(error instanceof Error ? error.message : 'Không thể thu hồi phê duyệt tin tuyển dụng.'); }
  };

  // Xử lý duyệt hồ sơ
  const handleApprove = async (id: number) => {
    try {
      await registrationService.reviewFaculty(id, 'Duyet');
      setStudents((prev) => prev.map((student) => student.id === id ? { ...student, trangThai: 'DaDuyet' } : student));
      showToast('Đã duyệt hồ sơ đăng ký thực tập.');
      setReviewingStudent(null);
    } catch (error) { showToast(error instanceof Error ? error.message : 'Không thể duyệt hồ sơ.'); }
  };

  const handleReject = async (id: number) => {
    const reason = prompt('Nhập lý do từ chối hồ sơ:', 'Thông tin doanh nghiệp chưa đầy đủ / MST không hợp lệ');
    if (reason && reason.trim()) {
      try {
        await registrationService.reviewFaculty(id, 'TuChoi', reason);
        setStudents((prev) => prev.map((student) => student.id === id ? { ...student, trangThai: 'TuChoi' } : student));
        showToast(`Đã từ chối hồ sơ: ${reason}`);
        setReviewingStudent(null);
      } catch (error) { showToast(error instanceof Error ? error.message : 'Không thể từ chối hồ sơ.'); }
    }
  };

  // Toggle chọn sinh viên phân công
  const handleToggleSelectStudent = (id: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Chọn toàn bộ sinh viên đang hiển thị chưa được phân công
  const handleSelectAllUnassigned = (displayedStudents: typeof students) => {
    const unassignedIds = displayedStudents.filter((s) => !s.gvhdId).map((s) => s.id);
    const allSelected = unassignedIds.every((id) => selectedStudentIds.includes(id));
    if (allSelected) {
      setSelectedStudentIds((prev) => prev.filter((id) => !unassignedIds.includes(id)));
    } else {
      setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...unassignedIds])));
    }
  };

  // Lưu phân công GVHD (Ràng buộc nghiêm ngặt hạn mức 30 SV)
  const handleAssignSave = async () => {
    if (selectedStudentIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 sinh viên để phân công!');
      return;
    }

    const targetGv = lecturers.find((g) => g.id === selectedGvId);
    if (!targetGv) return;

    // RULE 1: Giảng viên đã đạt mức tối đa 30/30 SV
    if (targetGv.currentCount >= targetGv.maxCount) {
      alert(
        `⚠️ CẢNH BÁO QUÁ TẢI (Max 30 SV):\nGiảng viên ${targetGv.hoTen} đã đạt tối đa hạn mức ${targetGv.currentCount}/${targetGv.maxCount} sinh viên hướng dẫn trong đợt. Hệ thống từ chối phân công thêm!`
      );
      return;
    }

    // RULE 2: Số lượng phân công mới cộng dồn vượt quá 30
    if (targetGv.currentCount + selectedStudentIds.length > targetGv.maxCount) {
      alert(
        `⚠️ CẢNH BÁO: Giảng viên ${targetGv.hoTen} chỉ còn nhận thêm được ${
          targetGv.maxCount - targetGv.currentCount
        } sinh viên. Bạn đang chọn ${selectedStudentIds.length} sinh viên.`
      );
      return;
    }

    const selectedRows = students.filter((student) => selectedStudentIds.includes(student.id));
    const batchId = selectedRows[0]?.dotThucTapId;
    if (!batchId || selectedRows.some((student) => student.dotThucTapId !== batchId)) {
      showToast('Chỉ có thể phân công sinh viên thuộc cùng một đợt.');
      return;
    }
    try {
      await advisorService.assignAdvisor({ registrationIds: selectedStudentIds, giangVienId: selectedGvId, dotThucTapId: batchId });
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể phân công giảng viên.');
      return;
    }

    // Cập nhật phân công sinh viên
    setStudents((prev) =>
      prev.map((s) => (selectedStudentIds.includes(s.id) ? { ...s, gvhdId: selectedGvId } : s))
    );

    // Cập nhật sĩ số hiện tại của GVHD
    setLecturers((prev) =>
      prev.map((g) =>
        g.id === selectedGvId
          ? { ...g, currentCount: g.currentCount + selectedStudentIds.length }
          : g
      )
    );

    showToast(
      `✓ Phân công thành công cho ${targetGv.hoTen}! Sĩ số mới: ${
        targetGv.currentCount + selectedStudentIds.length
      }/30 SV.`
    );
    setSelectedStudentIds([]);
  };

  // Cấp hoặc thu hồi cờ quyền CoQuyenToChuc
  const handleTogglePermission = async (gvId: number) => {
    const gv = lecturers.find((g) => g.id === gvId);
    if (gv) {
      try {
        await advisorService.updatePermission(gvId, !gv.coQuyenToChuc);
        setLecturers((prev) => prev.map((lecturer) => lecturer.id === gvId ? { ...lecturer, coQuyenToChuc: !gv.coQuyenToChuc } : lecturer));
      showToast(
        `✓ Đã ${!gv.coQuyenToChuc ? 'CẤP' : 'THU HỒI'} quyền tổ chức đợt cho ${gv.hoTen}!`
      );
      } catch (error) { showToast(error instanceof Error ? error.message : 'Không thể cập nhật quyền tổ chức.'); }
    }
  };

  const handleAddEnterprise = async () => {
    const name = prompt('Tên doanh nghiệp mới:');
    if (!name?.trim()) return;
    const taxCode = prompt('Mã số thuế doanh nghiệp:');
    if (!taxCode?.trim()) return;
    const address = prompt('Địa chỉ doanh nghiệp:', 'TP. Hồ Chí Minh');
    if (!address?.trim()) return;
    try {
      const response = await fetch('/api/enterprises', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ TenDoanhNghiep: name.trim(), MaSoThue: taxCode.trim(), DiaChi: address.trim(), TrangThaiChuan: true }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Không thể lưu doanh nghiệp.');
      setAdminEnterprises((prev) => [result.data, ...prev.filter((item) => item.Id !== result.data.Id)]);
      showToast('Đã lưu doanh nghiệp vào danh mục.');
    } catch (error) { showToast(error instanceof Error ? error.message : 'Không thể lưu doanh nghiệp.'); }
  };

  const handleEditEnterprise = async (enterpriseId: number) => {
    const enterprise = adminEnterprises.find((item) => item.Id === enterpriseId);
    if (!enterprise) return;
    const name = prompt('Cập nhật tên doanh nghiệp:', enterprise.TenDoanhNghiep);
    if (!name?.trim()) return;
    const address = prompt('Cập nhật địa chỉ doanh nghiệp:', enterprise.DiaChi);
    if (!address?.trim()) return;
    try {
      const response = await fetch('/api/enterprises', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ TenDoanhNghiep: name.trim(), MaSoThue: enterprise.MaSoThue, DiaChi: address.trim(), TrangThaiChuan: enterprise.TrangThaiChuan }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Không thể cập nhật doanh nghiệp.');
      setAdminEnterprises((prev) => prev.map((item) => item.Id === enterpriseId ? result.data : item));
      showToast('Đã cập nhật thông tin doanh nghiệp.');
    } catch (error) { showToast(error instanceof Error ? error.message : 'Không thể cập nhật doanh nghiệp.'); }
  };

  const handleDeleteEnterprise = async (enterpriseId: number) => {
    const enterprise = adminEnterprises.find((item) => item.Id === enterpriseId);
    if (!enterprise || !confirm(`Ngừng kích hoạt doanh nghiệp "${enterprise.TenDoanhNghiep}"?`)) return;
    try {
      const response = await fetch(`/api/enterprises/${enterpriseId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ TrangThaiChuan: false }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Không thể cập nhật trạng thái doanh nghiệp.');
      setAdminEnterprises((prev) => prev.map((item) => item.Id === enterpriseId ? result.data : item));
      showToast('Đã ngừng kích hoạt doanh nghiệp.');
    } catch (error) { showToast(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái doanh nghiệp.'); }
  };  // Danh sách sinh viên sau khi lọc cho tab duyệt hồ sơ
  const filteredApproveStudents = students.filter((s) => {
    const matchMajor =
      approveFilterMajor === 'Tất cả chuyên ngành' || s.chuyenNganh === approveFilterMajor;
    const matchStatus =
      approveFilterStatus === 'Tất cả trạng thái' ||
      (approveFilterStatus === 'Chờ phê duyệt' && s.trangThai === 'ChoPheDuyet') ||
      (approveFilterStatus === 'Đã duyệt' && s.trangThai === 'DaDuyet') ||
      (approveFilterStatus === 'Từ chối' && s.trangThai === 'TuChoi');
    return matchMajor && matchStatus;
  });

  // Danh sách sinh viên đã duyệt sau khi lọc cho tab phân công GVHD
  const approvedStudentsForAssign = students.filter((s) => {
    if (s.trangThai !== 'DaDuyet') return false;
    if (selectedMajorFilter === 'Tất cả chuyên ngành') return true;
    return s.chuyenNganh === selectedMajorFilter;
  });

  return (
    <div className="space-y-5 fade-in w-full max-w-6xl mx-auto">
      {/* TAB: admin-jobs (Kiểm duyệt tin tuyển dụng Doanh nghiệp đối tác) */}
      {activeTab === 'admin-jobs' && (
        <div className="space-y-4 text-xs">
          {/* Header & Thống kê nhanh */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-base text-gray-900">
                  Kiểm duyệt Vị trí tuyển dụng từ Doanh nghiệp đối tác
                </h3>
                <p className="text-gray-500 mt-0.5 text-xs">
                  Thẩm định nội dung và tính phù hợp chuyên môn. Chỉ các bài đăng được Khoa phê duyệt (DaDuyet) mới hiển thị công khai trên Sàn việc làm nội bộ để sinh viên nộp hồ sơ.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-amber-50 text-amber-800 font-bold rounded-full border border-amber-200 text-xs flex items-center gap-1">
                  <Clock size={14} weight="bold" />
                  Chờ duyệt: {adminJobs.filter((j) => j.TrangThaiDuyetJob === 'ChoKhoaDuyet').length}
                </span>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 font-bold rounded-full border border-emerald-200 text-xs flex items-center gap-1">
                  <CheckCircle size={14} weight="bold" />
                  Đã duyệt công khai: {adminJobs.filter((j) => j.TrangThaiDuyetJob === 'DaDuyet').length}
                </span>
                <span className="px-3 py-1 bg-rose-50 text-rose-800 font-bold rounded-full border border-rose-200 text-xs flex items-center gap-1">
                  <XCircle size={14} weight="bold" />
                  Từ chối: {adminJobs.filter((j) => j.TrangThaiDuyetJob === 'TuChoi').length}
                </span>
              </div>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
                {(
                  [
                    { key: 'TatCa', label: 'Tất cả vị trí' },
                    { key: 'ChoKhoaDuyet', label: 'Chờ Khoa duyệt' },
                    { key: 'DaDuyet', label: 'Đã duyệt (Công khai)' },
                    { key: 'TuChoi', label: 'Bị từ chối' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setJobStatusFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer text-xs ${
                      jobStatusFilter === tab.key
                        ? 'bg-white text-huit-blue shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <span className="text-gray-400 text-xs">
                Tổng cộng: <strong>{adminJobs.length}</strong> bài đăng tuyển dụng
              </span>
            </div>
          </div>

          {/* Danh sách Job cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adminJobs
              .filter((j) => jobStatusFilter === 'TatCa' || j.TrangThaiDuyetJob === jobStatusFilter)
              .map((job) => (
                <div
                  key={job.Id}
                  className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-gray-900">{job.TieuDe}</h4>
                        <p className="text-xs font-semibold text-huit-blue mt-0.5">{job.TenDoanhNghiep}</p>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                          job.TrangThaiDuyetJob === 'DaDuyet'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : job.TrangThaiDuyetJob === 'ChoKhoaDuyet'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {job.TrangThaiDuyetJob === 'DaDuyet'
                          ? '✓ Đã duyệt hiển thị'
                          : job.TrangThaiDuyetJob === 'ChoKhoaDuyet'
                          ? '⏳ Chờ Khoa duyệt'
                          : '✕ Đã từ chối'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500 font-mono">
                      <span>MST: <strong>{job.MaSoThue}</strong></span>
                      <span>•</span>
                      <span>Chỉ tiêu: <strong>{job.SoLuongTuyen} SV</strong></span>
                      <span>•</span>
                      <span>Hạn nộp: <strong>{job.HanNopHoSo}</strong></span>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-xl space-y-1 text-[11px]">
                      <p className="font-bold text-gray-700">Mô tả công việc:</p>
                      <p className="text-gray-600 line-clamp-2 leading-relaxed">{job.MoTaCongViec}</p>
                      {job.YeuCauUngVien && (
                        <p className="text-gray-500 italic mt-1 line-clamp-1">
                          Yêu cầu: {job.YeuCauUngVien}
                        </p>
                      )}
                    </div>

                    {job.NguoiHuongDan && (
                      <div className="p-2.5 bg-blue-50/50 rounded-xl border border-blue-100 text-[11px] text-gray-700 space-y-0.5">
                        <p className="font-bold text-huit-blue">Mentor doanh nghiệp gắn kèm bài đăng:</p>
                        <p>
                          <strong>{job.NguoiHuongDan.HoTen}</strong> • SĐT: {job.NguoiHuongDan.SoDienThoai} • Email: {job.NguoiHuongDan.Email}
                        </p>
                      </div>
                    )}

                    {job.LyDoTuChoi && (
                      <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200 text-[11px] text-rose-800">
                        <strong>Lý do từ chối:</strong> {job.LyDoTuChoi}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                    {job.TrangThaiDuyetJob === 'ChoKhoaDuyet' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleRejectJob(job.Id)}
                          className="px-3.5 py-1.5 border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold rounded-lg transition cursor-pointer text-xs"
                        >
                          Từ chối
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApproveJob(job.Id)}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition shadow-xs cursor-pointer text-xs flex items-center gap-1.5"
                        >
                          <CheckCircle size={14} weight="bold" />
                          <span>Duyệt hiển thị sàn</span>
                        </button>
                      </>
                    )}

                    {job.TrangThaiDuyetJob === 'DaDuyet' && (
                      <button
                        type="button"
                        onClick={() => void handleRevokeJobApproval(job.Id)}
                        className="px-3.5 py-1.5 border border-gray-300 hover:border-rose-400 text-gray-600 hover:text-rose-600 font-semibold rounded-lg transition cursor-pointer text-xs"
                      >
                        Thu hồi phê duyệt
                      </button>
                    )}

                    {job.TrangThaiDuyetJob === 'TuChoi' && (
                      <button
                        type="button"
                        onClick={() => handleApproveJob(job.Id)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition cursor-pointer text-xs"
                      >
                        Xem xét & Duyệt lại
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB: admin-approve (Duyệt hồ sơ sinh viên) */}
      {activeTab === 'admin-approve' && (
        <div className="space-y-4">
          {/* Header & Thống kê nhanh */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs text-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-base text-gray-900">
                  Duyệt hồ sơ đăng ký thực tập tốt nghiệp
                </h3>
                <p className="text-gray-500 mt-0.5 text-xs">
                  Thẩm định hồ sơ 2 bước (Học vụ cá nhân, GPA, CV PDF và Đơn vị tiếp nhận doanh nghiệp)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-amber-50 text-amber-800 font-bold rounded-full border border-amber-200 text-xs flex items-center gap-1">
                  <Clock size={14} weight="bold" />
                  Chờ duyệt: {students.filter((s) => s.trangThai === 'ChoPheDuyet').length}
                </span>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 font-bold rounded-full border border-emerald-200 text-xs flex items-center gap-1">
                  <CheckCircle size={14} weight="bold" />
                  Đã duyệt: {students.filter((s) => s.trangThai === 'DaDuyet').length}
                </span>
                <span className="px-3 py-1 bg-rose-50 text-rose-800 font-bold rounded-full border border-rose-200 text-xs flex items-center gap-1">
                  <XCircle size={14} weight="bold" />
                  Từ chối: {students.filter((s) => s.trangThai === 'TuChoi').length}
                </span>
              </div>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-600">Lọc chuyên ngành:</span>
                <select
                  value={approveFilterMajor}
                  onChange={(e) => setApproveFilterMajor(e.target.value)}
                  className="p-2 border border-gray-200 rounded-xl font-semibold bg-gray-50 outline-none text-xs cursor-pointer focus:border-huit-blue"
                >
                  <option value="Tất cả chuyên ngành">Tất cả 5 chuyên ngành</option>
                  <option value="Kỹ thuật phần mềm">Kỹ thuật phần mềm</option>
                  <option value="Hệ thống thông tin">Hệ thống thông tin</option>
                  <option value="Khoa học dữ liệu">Khoa học dữ liệu</option>
                  <option value="Mạng máy tính và An toàn thông tin">Mạng máy tính & ATTT</option>
                  <option value="Công nghệ số">Công nghệ số</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-600">Trạng thái:</span>
                <select
                  value={approveFilterStatus}
                  onChange={(e) => setApproveFilterStatus(e.target.value)}
                  className="p-2 border border-gray-200 rounded-xl font-semibold bg-gray-50 outline-none text-xs cursor-pointer focus:border-huit-blue"
                >
                  <option value="Tất cả trạng thái">Tất cả trạng thái</option>
                  <option value="Chờ phê duyệt">Chờ phê duyệt</option>
                  <option value="Đã duyệt">Đã duyệt</option>
                  <option value="Từ chối">Từ chối</option>
                </select>
              </div>

              <span className="text-gray-400 text-xs ml-auto">
                Hiển thị: <strong>{filteredApproveStudents.length}</strong> / {students.length} hồ sơ
              </span>
            </div>
          </div>

          {/* Table danh sách hồ sơ */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs text-xs">
            <table className="w-full text-left">
              <thead className="bg-gray-50 uppercase text-gray-500 border-b text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Sinh viên</th>
                  <th className="py-3 px-4">Học vụ cá nhân (Bước 1)</th>
                  <th className="py-3 px-4">Doanh nghiệp kê khai (Bước 2)</th>
                  <th className="py-3 px-4 text-center w-36 whitespace-nowrap">Trạng thái</th>
                  <th className="py-3 px-4 text-right w-44 whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredApproveStudents.map((sv) => (
                  <tr key={sv.id} className="hover:bg-gray-50/60 transition">
                    <td className="py-3 px-4">
                      <p className="font-bold text-gray-900 text-sm">{sv.hoTen}</p>
                      <p className="text-gray-500 font-mono text-[11px]">
                        {sv.mssv} • {sv.lop}
                      </p>
                      <span className="text-xs text-huit-blue font-semibold">{sv.chuyenNganh}</span>
                    </td>
                    <td className="py-3 px-4">
                      <p>
                        GPA: <strong className="text-emerald-700 font-mono text-sm">{sv.gpa}</strong> •{' '}
                        {sv.ngoaiNgu}
                      </p>
                      <div
                        onClick={() => showToast(`Xem trước tệp CV: ${sv.cv}`)}
                        className="flex items-center gap-1.5 text-huit-blue mt-1 underline cursor-pointer text-xs font-medium hover:text-[#002244]"
                      >
                        <FilePdf size={16} className="text-rose-600 shrink-0" weight="fill" />
                        <span className="line-clamp-1">{sv.cv}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-gray-900 line-clamp-1">{sv.cty}</p>
                      <p className="text-gray-500 font-mono text-[11px]">MST: {sv.mst}</p>
                      <p className="text-gray-500 text-xs mt-0.5">Mentor: {sv.mentor}</p>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center justify-center min-w-[110px] h-7 px-3 rounded-full font-bold text-xs whitespace-nowrap ${
                          sv.trangThai === 'DaDuyet'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : sv.trangThai === 'TuChoi'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {sv.trangThai === 'DaDuyet'
                          ? 'Đã duyệt'
                          : sv.trangThai === 'TuChoi'
                          ? 'Từ chối'
                          : 'Chờ phê duyệt'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setReviewingStudent(sv)}
                          className="h-7 px-3.5 bg-white border border-gray-300 hover:border-huit-blue text-gray-700 hover:text-huit-blue rounded-lg font-bold text-xs cursor-pointer transition inline-flex items-center justify-center"
                        >
                          Xem chi tiết
                        </button>
                        {sv.trangThai === 'ChoPheDuyet' ? (
                          <>
                            <button
                              onClick={() => handleApprove(sv.id)}
                              className="h-7 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs cursor-pointer transition shadow-2xs inline-flex items-center justify-center"
                            >
                              Duyệt
                            </button>
                            <button
                              onClick={() => handleReject(sv.id)}
                              className="h-7 px-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs cursor-pointer transition shadow-2xs inline-flex items-center justify-center"
                            >
                              Từ chối
                            </button>
                          </>
                        ) : sv.trangThai === 'TuChoi' ? (
                          <button
                            onClick={() => handleApprove(sv.id)}
                            className="h-7 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs cursor-pointer transition shadow-2xs inline-flex items-center justify-center"
                          >
                            Duyệt lại
                          </button>
                        ) : (
                          <span className="h-7 px-3.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-semibold text-xs inline-flex items-center justify-center">
                            Đã duyệt
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: admin-assign (Phân công GVHD có check 30 SV và lọc 5 chuyên ngành) */}
      {activeTab === 'admin-assign' && (
        <div className="space-y-4 text-xs">
          {/* Controls Bar */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 flex flex-wrap gap-4 items-end justify-between shadow-2xs">
            <div className="flex flex-wrap gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  1. Lọc Chuyên ngành sinh viên:
                </label>
                <select
                  value={selectedMajorFilter}
                  onChange={(e) => setSelectedMajorFilter(e.target.value)}
                  className="p-2.5 border border-gray-200 rounded-xl font-semibold bg-gray-50 outline-none focus:border-huit-blue cursor-pointer"
                >
                  <option value="Tất cả chuyên ngành">Tất cả 5 chuyên ngành</option>
                  <option value="Kỹ thuật phần mềm">1. Kỹ thuật phần mềm</option>
                  <option value="Hệ thống thông tin">2. Hệ thống thông tin</option>
                  <option value="Khoa học dữ liệu">3. Khoa học dữ liệu</option>
                  <option value="Mạng máy tính và An toàn thông tin">4. Mạng máy tính & ATTT</option>
                  <option value="Công nghệ số">5. Công nghệ số</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  2. Chọn GVHD tiếp nhận (Kiểm soát Max 30 SV):
                </label>
                <select
                  value={selectedGvId}
                  onChange={(e) => setSelectedGvId(Number(e.target.value))}
                  className="p-2.5 border border-gray-200 rounded-xl font-bold text-huit-blue bg-white outline-none focus:border-huit-blue cursor-pointer"
                >
                  {lecturers.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.hoTen} ({g.boMon}) — Sĩ số: {g.currentCount}/{g.maxCount} SV
                      {g.currentCount >= g.maxCount ? ' - [ĐÃ ĐẦY 30 SV]' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleAssignSave}
              className="px-5 py-2.5 bg-huit-blue hover:bg-[#002244] text-white rounded-xl font-bold transition shadow-sm cursor-pointer"
            >
              Lưu phân công ({selectedStudentIds.length} SV đã chọn)
            </button>
          </div>

          {/* Table danh sách sinh viên */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
            <div className="p-4 bg-gray-50/70 border-b border-gray-200 flex flex-wrap justify-between items-center gap-2">
              <div className="flex items-center gap-3">
                <span className="font-bold text-gray-800">
                  Sinh viên đã duyệt hồ sơ ({selectedMajorFilter})
                </span>
                <button
                  onClick={() => handleSelectAllUnassigned(approvedStudentsForAssign)}
                  className="px-2.5 py-1 bg-white border border-gray-300 hover:border-huit-blue rounded-lg font-semibold text-gray-700 hover:text-huit-blue cursor-pointer transition text-xs"
                >
                  Chọn tất cả SV chưa có GVHD
                </button>
              </div>
              <span className="text-gray-500">
                Đang chọn: <strong className="text-huit-blue">{selectedStudentIds.length}</strong> SV
              </span>
            </div>

            <table className="w-full text-left">
              <thead className="bg-gray-50 uppercase text-gray-500 border-b text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="p-3 w-12 text-center">Chọn</th>
                  <th className="p-3">Sinh viên</th>
                  <th className="p-3">Chuyên ngành</th>
                  <th className="p-3">Công ty thực tập</th>
                  <th className="p-3">GVHD Hiện tại</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {approvedStudentsForAssign.map((s) => {
                  const assignedGv = lecturers.find((g) => g.id === s.gvhdId);
                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-blue-50/30 transition ${
                        selectedStudentIds.includes(s.id) ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(s.id)}
                          onChange={() => handleToggleSelectStudent(s.id)}
                          className="w-4 h-4 text-huit-blue rounded cursor-pointer"
                        />
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-huit-blue">{s.hoTen}</p>
                        <p className="text-gray-400 font-mono text-[11px]">{s.mssv} • {s.lop}</p>
                      </td>
                      <td className="p-3 font-semibold text-gray-800">{s.chuyenNganh}</td>
                      <td className="p-3 text-gray-700 line-clamp-1">{s.cty}</td>
                      <td className="p-3">
                        {assignedGv ? (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 font-bold rounded-lg border border-emerald-200 inline-block">
                            {assignedGv.hoTen}
                          </span>
                        ) : (
                          <span className="text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            Chưa phân công
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: shared-create-batch (Tổ chức đợt) */}
      {activeTab === 'shared-create-batch' && (
        <div className="space-y-6 text-xs">
          {/* Form tạo đợt */}
          <div className="max-w-3xl bg-white p-6 rounded-2xl border border-gray-200 space-y-5 shadow-2xs">
            <div>
              <h3 className="font-bold text-base text-gray-800">Tổ chức đợt thực tập tốt nghiệp mới</h3>
              <p className="text-gray-500 mt-1">
                Khởi tạo đợt thực tập mới và mở cổng đăng ký trực tuyến cho sinh viên các chuyên ngành
              </p>
            </div>
            <form onSubmit={handleCreateBatch} className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    Năm học * (ví dụ: 2026-2027)
                  </label>
                  <input
                    id="batch-academic-year-admin"
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
                    className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:border-huit-blue text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isCreatingBatch}
                  className="px-5 py-2.5 bg-huit-blue hover:bg-[#002244] text-white font-bold rounded-xl cursor-pointer shadow-sm transition disabled:opacity-60 disabled:cursor-wait"
                >
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
                    <p className="text-gray-500">
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

      {/* TAB: admin-permissions (Cấp cờ CoQuyenToChuc cho Giảng viên) */}
      {activeTab === 'admin-permissions' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden max-w-4xl shadow-2xs text-xs">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-bold text-base text-gray-800">
              Phân quyền Tổ chức đợt cho Giảng viên (CoQuyenToChuc)
            </h3>
            <p className="text-gray-500 mt-1">
              Giảng viên được cấp cờ <code>CoQuyenToChuc</code> sẽ xuất hiện thêm menu{' '}
              <strong>&quot;Tổ chức đợt thực tập&quot;</strong> trên thanh điều hướng bên trái khi đăng nhập.
            </p>
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50 uppercase text-gray-500 border-b text-[10px] font-bold tracking-wider">
              <tr>
                <th className="p-4">Mã GV</th>
                <th className="p-4">Họ và tên</th>
                <th className="p-4">Bộ môn</th>
                <th className="p-4 text-center">Sĩ số hướng dẫn</th>
                <th className="p-4 text-right">Quyền tổ chức đợt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lecturers.map((g) => (
                <tr key={g.id} className="hover:bg-gray-50/50">
                  <td className="p-4 font-bold text-gray-700 font-mono">{g.maGV}</td>
                  <td className="p-4 font-bold text-huit-blue">{g.hoTen}</td>
                  <td className="p-4 text-gray-600">{g.boMon}</td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-mono font-bold text-xs ${
                        g.currentCount >= g.maxCount
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {g.currentCount}/{g.maxCount} SV
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleTogglePermission(g.id)}
                      className={`px-3.5 py-1.5 rounded-full font-bold transition cursor-pointer ${
                        g.coQuyenToChuc
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                      }`}
                    >
                      {g.coQuyenToChuc ? 'Đang BẬT' : 'Đang TẮT'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB: admin-catalog (Danh mục: Doanh nghiệp, 5 Chuyên ngành, Tiêu chí Rubric) */}
      {activeTab === 'admin-catalog' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs space-y-5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-base text-gray-800">Quản Lý Danh Mục Hệ Thống</h3>
              <p className="text-gray-500 mt-0.5">
                Danh mục chuẩn hóa dùng chung cho toàn Khoa Công nghệ Thông tin - HUIT
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setCatalogSubTab('enterprises')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  catalogSubTab === 'enterprises'
                    ? 'bg-white text-huit-blue shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                1. Doanh nghiệp đối tác
              </button>
              <button
                onClick={() => setCatalogSubTab('majors')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  catalogSubTab === 'majors'
                    ? 'bg-white text-huit-blue shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                2. 5 Chuyên ngành CNTT
              </button>
              <button
                onClick={() => setCatalogSubTab('rubric')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  catalogSubTab === 'rubric'
                    ? 'bg-white text-huit-blue shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                3. Tiêu chí Rubric hệ 10
              </button>
            </div>
          </div>

          {/* Subtab 1: Doanh nghiệp đối tác */}
          {catalogSubTab === 'enterprises' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                <div>
                  <h4 className="font-bold text-huit-blue text-sm">Quản lý cụm thông tin doanh nghiệp</h4>
                  <p className="text-gray-600 mt-0.5">
                    Khoa có thể thêm, sửa hoặc xóa mềm doanh nghiệp. Mentor được tự động phát sinh từ form tạo job của doanh nghiệp.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddEnterprise}
                  className="px-4 py-2 bg-huit-blue hover:bg-[#002244] text-white rounded-xl font-bold transition cursor-pointer"
                >
                  + Thêm doanh nghiệp
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adminEnterprises.map((dn) => (
                  <div
                    key={dn.Id}
                    className="p-4 rounded-xl border border-gray-200 bg-gray-50/40 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-gray-900 text-sm leading-tight">
                        {dn.TenDoanhNghiep}
                      </h4>
                      {dn.TrangThaiChuan ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px] shrink-0">
                          Đối tác chuẩn
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px] shrink-0">
                          SV tự tìm
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 font-mono text-[11px]">MST: {dn.MaSoThue}</p>
                    <p className="text-gray-600">{dn.DiaChi}</p>
                    <p className="text-gray-500 text-[11px]">
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 pt-3">
                      <span className="text-[11px] text-gray-500">
                        Mentor: phát sinh tự động khi DN tạo job
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditEnterprise(dn.Id)}
                          className="px-3 py-1.5 bg-white border border-gray-300 hover:border-huit-blue text-gray-700 hover:text-huit-blue rounded-lg font-bold transition cursor-pointer"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEnterprise(dn.Id)}
                          className="px-3 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-lg font-bold transition cursor-pointer"
                        >
                          Xóa mềm
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subtab 2: 5 Chuyên ngành đào tạo */}
          {catalogSubTab === 'majors' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MAJORS.map((cn, idx) => (
                <div
                  key={cn}
                  className="p-4 rounded-xl border border-gray-200 bg-gray-50/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-huit-blue uppercase">
                      Chuyên ngành #{idx + 1}
                    </span>
                    <span className="px-2.5 py-0.5 bg-blue-100 text-huit-blue rounded-full font-bold text-xs">
                      {students.filter((student) => student.chuyenNganh === cn).length} SV
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm">{cn}</h4>
                  <p className="text-gray-600 leading-relaxed">Số sinh viên đã đăng ký thuộc chuyên ngành này.</p>
                </div>
              ))}
            </div>
          )}

          {/* Subtab 3: Bộ Tiêu chí Rubric */}
          {catalogSubTab === 'rubric' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-bold text-huit-blue text-sm">
                    PHIẾU CHẤM ĐIỂM THỰC TẬP KỸ SƯ — CHUẨN KHOA CÔNG NGHỆ THÔNG TIN
                  </h4>
                  <span className="text-xs bg-huit-blue text-white font-bold px-2.5 py-0.5 rounded-full">
                    Tổng: 10.0 Điểm
                  </span>
                </div>
                <p className="text-xs text-gray-700">
                  Cơ cấu tỷ lệ: <strong>50% Giảng viên đánh giá Báo cáo & Vấn đáp (Tối đa 5.0đ)</strong> +{' '}
                  <strong>50% Đơn vị thực tập đánh giá từ Phiếu nhận xét (2 dòng cuối, Tối đa 5.0đ)</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Phần 1: Giảng viên */}
                <div className="border border-purple-200 rounded-xl p-4 bg-purple-50/30 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-purple-200">
                    <div>
                      <h4 className="font-bold text-purple-900 text-sm">
                        I. Giảng viên chấm Báo cáo & Vấn đáp
                      </h4>
                      <p className="text-[11px] text-purple-700">10 tiêu chí đánh giá (STT 1 — 10)</p>
                    </div>
                    <span className="text-xs font-mono font-bold bg-purple-100 text-purple-900 px-2 py-0.5 rounded">
                      Tối đa 5.0đ (50%)
                    </span>
                  </div>
                  <div className="space-y-2">
                    {rubrics.filter((t) => t.NguoiCham === 'GiangVien').map((tc) => (
                      <div
                        key={tc.Id}
                        className="flex justify-between items-start gap-2 text-xs p-2 rounded-lg bg-white border border-gray-100 hover:border-purple-200 transition"
                      >
                        <div className="space-y-0.5">
                          <p className="font-semibold text-gray-800">
                            <span className="font-mono text-purple-800 mr-1.5 font-bold">
                              #{tc.Stt}.
                            </span>
                            {tc.NoiDungDanhGia}
                          </p>
                          <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                            {tc.Clo}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-purple-900 shrink-0 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                          {tc.DiemToiDa === 0.75 || tc.DiemToiDa === 0.25
                            ? tc.DiemToiDa.toFixed(2)
                            : tc.DiemToiDa.toFixed(1)}
                          đ
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Phần 2: Doanh nghiệp */}
                <div className="border border-sky-200 rounded-xl p-4 bg-sky-50/30 space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-sky-200">
                      <div>
                        <h4 className="font-bold text-sky-900 text-sm">
                          II. Đơn vị thực tập đánh giá
                        </h4>
                        <p className="text-[11px] text-sky-700">
                          2 dòng cuối lấy từ Phiếu nhận xét doanh nghiệp (STT 11 & 12)
                        </p>
                      </div>
                      <span className="text-xs font-mono font-bold bg-sky-100 text-sky-900 px-2 py-0.5 rounded">
                        Tối đa 5.0đ (50%)
                      </span>
                    </div>
                    <div className="space-y-2">
                      {rubrics.filter((t) => t.NguoiCham === 'DoanhNghiep').map(
                        (tc) => (
                          <div
                            key={tc.Id}
                            className="flex justify-between items-start gap-2 text-xs p-3 rounded-lg bg-white border border-gray-100 hover:border-sky-200 transition"
                          >
                            <div className="space-y-0.5">
                              <p className="font-semibold text-gray-800">
                                <span className="font-mono text-sky-800 mr-1.5 font-bold">
                                  #{tc.Stt}.
                                </span>
                                {tc.NoiDungDanhGia}
                              </p>
                              <span className="text-[10px] font-mono bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded border border-sky-100">
                                {tc.Clo} • Phiếu nhận xét
                              </span>
                            </div>
                            <span className="font-mono font-bold text-sky-900 shrink-0 bg-sky-50 px-2.5 py-1 rounded border border-sky-100 text-sm">
                              {tc.DiemToiDa.toFixed(1)}đ
                            </span>
                          </div>
                        )
                      )}
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-gray-200 text-xs text-gray-600 space-y-1">
                      <p className="font-bold text-gray-800">Quy định tích hợp điểm doanh nghiệp:</p>
                      <p>
                        Điểm từ đơn vị thực tập được nhập căn cứ vào <em>Phiếu nhận xét sinh viên thực tập</em>{' '}
                        do đại diện đơn vị tiếp nhận (Mentor/HR) ký tên và đóng dấu pháp nhân.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-100 rounded-xl text-center font-bold text-gray-800 text-xs">
                    Điểm tổng kết học phần = Điểm Giảng viên (Max 5.0) + Điểm Doanh nghiệp (Max 5.0) = 10.0
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: admin-stats (Thống kê báo cáo) */}
      {activeTab === 'admin-stats' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-6 text-xs">
          <div>
            <h3 className="font-bold text-base text-gray-800">
              Báo Cáo Thống Kê Tiến Độ Toàn Đợt
            </h3>
            <p className="text-gray-500 mt-0.5">
              Số liệu trực tiếp từ Supabase • Toàn bộ các đợt thực tập
            </p>
          </div>

          {/* 4 Thẻ KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-gray-500 font-semibold">Tổng hồ sơ đăng ký</p>
              <p className="text-2xl font-black text-huit-blue mt-1">{reportOverviewLoading ? '…' : reportOverview?.total ?? 0}</p>
              <p className="text-[11px] text-blue-600 mt-1">Hồ sơ đăng ký trong cơ sở dữ liệu</p>
            </div>
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="text-gray-500 font-semibold">Đã duyệt & Đang thực tập</p>
              <p className="text-2xl font-black text-emerald-700 mt-1">{reportOverview?.approved ?? 0}</p>
              <p className="text-[11px] text-emerald-600 mt-1">{reportOverview?.total ? Math.round(reportOverview.approved / reportOverview.total * 100) : 0}% đã được duyệt</p>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-gray-500 font-semibold">Chờ thẩm định hồ sơ</p>
              <p className="text-2xl font-black text-amber-700 mt-1">{reportOverview?.pending ?? 0}</p>
              <p className="text-[11px] text-amber-600 mt-1">Đang chờ xử lý</p>
            </div>
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
              <p className="text-gray-500 font-semibold">Doanh nghiệp tiếp nhận</p>
              <p className="text-2xl font-black text-purple-700 mt-1">{reportOverview?.enterpriseCount ?? 0}</p>
              <p className="text-[11px] text-purple-600 mt-1">Doanh nghiệp tiếp nhận sinh viên</p>
            </div>
          </div>

          {/* Bảng phân bổ 5 chuyên ngành */}
          <div className="border border-gray-200 rounded-xl p-5 space-y-4">
            <h4 className="font-bold text-sm text-gray-800">
              Phân Bổ Sinh Viên & Tỷ Lệ Hoàn Thành Theo 5 Chuyên Ngành
            </h4>
            <div className="space-y-3">
              {(reportOverview?.byMajor || []).map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-800">{item.name}</span>
                    <span className="font-mono text-gray-600">
                      <strong>{item.count}</strong> sinh viên ({item.percent}%) • Tiến độ duyệt:{' '}
                      <strong className="text-emerald-700">{item.complete}%</strong>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-huit-blue h-2.5 rounded-full"
                      style={{ width: `${item.complete}%` }}
                    />
                  </div>
                </div>
              ))}
              {!reportOverviewLoading && reportOverview?.byMajor.length === 0 && (
                <p className="text-gray-500 text-center py-4">Chưa có dữ liệu đăng ký để thống kê.</p>
              )}
            </div>
          </div>

          {/* Nguồn tiếp nhận & Tiến độ thu hồi báo cáo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-xl space-y-2">
              <h5 className="font-bold text-gray-800">Cơ cấu nguồn tiếp nhận sinh viên</h5>
              <p className="text-gray-600">
                • Doanh nghiệp từ danh sách Khoa: <strong>{reportOverview?.sourceCounts.DanhSachKhoa ?? 0}</strong> SV
              </p>
              <p className="text-gray-600">
                • Sinh viên tự tìm doanh nghiệp: <strong>{reportOverview?.sourceCounts.TuTim ?? 0}</strong> SV
              </p>
              <p className="text-gray-600">
                • Giảng viên giới thiệu: <strong>{reportOverview?.sourceCounts.GvGioiThieu ?? 0}</strong> SV
              </p>
            </div>

            <div className="p-4 border border-gray-200 rounded-xl space-y-2">
              <h5 className="font-bold text-gray-800">Tình hình đánh giá & nộp báo cáo</h5>
              <p className="text-gray-600">
                • Đã hoàn tất chấm điểm Rubric hệ 10: <strong className="text-emerald-700">{reportOverview?.graded ?? 0} SV</strong>
              </p>
              <p className="text-gray-600">
                • Đã nộp báo cáo chờ GVHD chấm: <strong className="text-amber-700">{reportOverview?.reportsPending ?? 0} SV</strong>
              </p>
              <p className="text-gray-600">
                • Có nhật ký thực tập: <strong className="text-blue-700">{reportOverview?.diaryRegistrationCount ?? 0} SV</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Xem chi tiết toàn bộ hồ sơ ngoài trường trước khi xét duyệt */}
      <Modal
        isOpen={!!reviewingStudent}
        onClose={() => setReviewingStudent(null)}
        title="Chi tiết hồ sơ đăng ký ngoài trường"
        subtitle="Khoa kiểm tra hồ sơ bước 1, thông tin doanh nghiệp, MST và mentor trước khi phê duyệt."
        maxWidth="4xl"
        footer={
          reviewingStudent ? (
            <div className="flex w-full items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setReviewingStudent(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition cursor-pointer text-xs"
              >
                Đóng
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleReject(reviewingStudent.id)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition cursor-pointer text-xs"
                >
                  Từ chối hồ sơ
                </button>
                <button
                  type="button"
                  onClick={() => handleApprove(reviewingStudent.id)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition cursor-pointer text-xs"
                >
                  Phê duyệt hồ sơ
                </button>
              </div>
            </div>
          ) : null
        }
      >
        {reviewingStudent && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold uppercase text-huit-blue">Sinh viên</span>
                <h4 className="font-black text-gray-900 text-sm">{reviewingStudent.hoTen}</h4>
                <p className="font-mono text-gray-600">{reviewingStudent.mssv} • {reviewingStudent.lop}</p>
                <p className="font-bold text-huit-blue">{reviewingStudent.chuyenNganh}</p>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold uppercase text-gray-500">Hồ sơ năng lực bước 1</span>
                <p>GPA: <strong className="font-mono text-emerald-700">{reviewingStudent.gpa}</strong></p>
                <p>Ngoại ngữ: <strong>{reviewingStudent.ngoaiNgu}</strong></p>
                <button
                  type="button"
                  onClick={() => showToast(`Xem trước tệp CV: ${reviewingStudent.cv}`)}
                  className="inline-flex items-center gap-1.5 text-rose-700 font-bold underline cursor-pointer"
                >
                  <FilePdf size={16} weight="fill" />
                  {reviewingStudent.cv}
                </button>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold uppercase text-amber-700">Trạng thái xét duyệt</span>
                <p className="font-bold text-gray-900">
                  {reviewingStudent.trangThai === 'ChoPheDuyet'
                    ? 'Chờ Khoa thẩm định'
                    : reviewingStudent.trangThai === 'DaDuyet'
                    ? 'Đã duyệt chính thức'
                    : 'Đã từ chối'}
                </p>
                <p className="text-gray-600">Nhánh xử lý: Ngoài trường / GV giới thiệu</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-gray-900 text-sm">Thông tin doanh nghiệp ngoài trường</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-gray-400 block mb-1">Tên doanh nghiệp</span>
                    <p className="font-bold text-gray-900">{reviewingStudent.cty}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-1">Mã số thuế</span>
                    <p className="font-mono font-bold text-huit-blue">{reviewingStudent.mst}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-1">Vị trí thực tập</span>
                    <p className="font-semibold text-gray-800">Thực tập sinh CNTT</p>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-1">Nguồn tiếp nhận</span>
                    <p className="font-semibold text-gray-800">Tự liên hệ / Ngoài trường</p>
                  </div>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <p className="font-bold text-emerald-800">Gợi ý kiểm tra pháp lý</p>
                  <p className="text-emerald-700 mt-0.5">
                    Đối chiếu MST, địa chỉ pháp nhân và năng lực tiếp nhận trước khi bấm phê duyệt.
                  </p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-gray-900 text-sm">Mentor doanh nghiệp phụ trách</h4>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-gray-400 block mb-1">Thông tin mentor kê khai</span>
                  <p className="font-bold text-gray-900">{reviewingStudent.mentor}</p>
                  <p className="text-gray-500 mt-1">
                    Email/SĐT sẽ được dùng để đồng bộ vào hồ sơ thực tập sau khi Khoa duyệt.
                  </p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="font-bold text-huit-blue">Sau khi duyệt</p>
                  <p className="text-gray-700 mt-0.5">
                    Hồ sơ chuyển sang <strong>DaDuyet</strong> và đủ điều kiện đưa vào màn phân công GVHD theo chuyên ngành.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};


