'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserSession, TrangThaiDangKy, LoaiDangKy, CongViecThucTap } from '@/types/database.types';
import { Step1ProfileForm } from '@/features/registration/components/Step1ProfileForm';
import { Step2CompanyBranch } from '@/features/registration/components/Step2CompanyBranch';
import { WeeklyDiarySection, DiaryEntry } from '@/features/evaluation/components/WeeklyDiarySection';
import { StudentReportSection } from '@/features/evaluation/components/StudentReportSection';
import { WeeklyDiaryModal } from '@/components/modals/WeeklyDiaryModal';
import { registrationService } from '@/features/registration/services/registrationService';
import { jobService } from '@/features/jobs/services/jobService';
import { evaluationService } from '@/features/evaluation/services/evaluationService';
import { batchService } from '@/features/batches/services/batchService';
import {
  UserFocus,
  Buildings,
  CheckCircle,
  PaperPlaneTilt,
  FilePdf,
  CaretDown,
  Briefcase,
  ArrowCounterClockwise,
  XCircle,
  Storefront,
} from '@phosphor-icons/react';

interface StudentUnifiedViewProps {
  currentUser: UserSession;
  activeTab: string;
  onNavigateTab: (tab: string) => void;
  showToast: (msg: string) => void;
}

export const StudentUnifiedView: React.FC<StudentUnifiedViewProps> = ({
  currentUser,
  activeTab,
  onNavigateTab,
  showToast,
}) => {
  // Current registration state
  const [activeRegId, setActiveRegId] = useState<number | null>(null);
  const [trangThaiDangKy, setTrangThaiDangKy] = useState<TrangThaiDangKy>('DaDangKy');
  const [loaiDangKy, setLoaiDangKy] = useState<LoaiDangKy>('UngTuyenJob');
  const [branchTab, setBranchTab] = useState<'UngTuyenJob' | 'NgoaiTruong'>('UngTuyenJob');
  const [appliedJobId, setAppliedJobId] = useState<number | null>(null);

  // Available jobs for Step 2 Branch 1
  const [availableJobs, setAvailableJobs] = useState<CongViecThucTap[]>([]);
  const [openBatchId, setOpenBatchId] = useState<number | null>(null);

  // Form 1 fields
  const [coVanHocTap, setCoVanHocTap] = useState('');
  const [diemGPA, setDiemGPA] = useState('');
  const [viTriDuKien, setViTriDuKien] = useState('');
  const [nangLucChuyenMon, setNangLucChuyenMon] = useState('');
  const [trinhDoNgoaiNgu, setTrinhDoNgoaiNgu] = useState('');
  const [diaChiHoKhau, setDiaChiHoKhau] = useState('');
  const [diaChiHienTai, setDiaChiHienTai] = useState('');
  const [fileCV, setFileCV] = useState('');
  const [commit1, setCommit1] = useState(false);
  const [commit2, setCommit2] = useState(false);

  // Form 2 fields
  const [nguonNhanSu, setNguonNhanSu] = useState<'TuTim' | 'DanhSachKhoa' | 'GvGioiThieu'>('TuTim');
  const [gvGioiThieu, setGvGioiThieu] = useState('');
  const [tenCongTy, setTenCongTy] = useState('');
  const [maSoThue, setMaSoThue] = useState('');
  const [diaChiCty, setDiaChiCty] = useState('');
  const [viTriCty, setViTriCty] = useState('');
  const [mentorTen, setMentorTen] = useState('');
  const [mentorSdt, setMentorSdt] = useState('');
  const [mentorEmail, setMentorEmail] = useState('');

  // Report & Diary
  const [fileBaoCao, setFileBaoCao] = useState('');
  const [reportStatus, setReportStatus] = useState<'ChoDuyet' | 'DatChuan' | 'YeuCauLamLai'>('ChoDuyet');
  const [reportComment, setReportComment] = useState('');
  const [diemDN, setDiemDN] = useState(0);
  const [diemGV, setDiemGV] = useState(0);
  const [nhanXetChung, setNhanXetChung] = useState('');

  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);

  const [isAddDiaryModalOpen, setIsAddDiaryModalOpen] = useState(false);

  // Fetch initial student registration and jobs from API
  const fetchStudentData = useCallback(async () => {
    try {
      // 1. Fetch available jobs
      const [jobs, batches, regs] = await Promise.all([
        jobService.getJobs({ status: 'DaDuyet' }),
        batchService.getBatches(),
        currentUser.sinhVienId
          ? registrationService.getRegistrations({ sinhVienId: currentUser.sinhVienId })
          : Promise.resolve([]),
      ]);
      setAvailableJobs(jobs);
      const now = Date.now();
      const openBatch = batches.find((batch) => Date.parse(batch.NgayBatDauDangKy) <= now && Date.parse(batch.NgayKetThucDangKy) >= now);
      if (openBatch) setOpenBatchId(openBatch.Id);

      // 2. Fetch student registration if ID available
      if (currentUser.sinhVienId) {
        const activeReg = regs.find((r) => !['DaHuy', 'TuChoi'].includes(r.TrangThaiDangKy));
        if (activeReg) {
          setOpenBatchId(activeReg.DotThucTapId);
          setActiveRegId(activeReg.Id);
          setTrangThaiDangKy(activeReg.TrangThaiDangKy);
          if (activeReg.LoaiDangKy) setLoaiDangKy(activeReg.LoaiDangKy);
          if (activeReg.CongViecId) setAppliedJobId(activeReg.CongViecId);

          if (activeReg.hoSoThucTap) {
            if (activeReg.hoSoThucTap.CoVanHocTap) setCoVanHocTap(activeReg.hoSoThucTap.CoVanHocTap);
            if (activeReg.hoSoThucTap.DiemGPA) setDiemGPA(String(activeReg.hoSoThucTap.DiemGPA));
            if (activeReg.hoSoThucTap.ViTriUngTuyenDuKien) setViTriDuKien(activeReg.hoSoThucTap.ViTriUngTuyenDuKien);
            if (activeReg.hoSoThucTap.NangLucChuyenMon) setNangLucChuyenMon(activeReg.hoSoThucTap.NangLucChuyenMon);
            if (activeReg.hoSoThucTap.TrinhDoNgoaiNgu) setTrinhDoNgoaiNgu(activeReg.hoSoThucTap.TrinhDoNgoaiNgu);
            if (activeReg.hoSoThucTap.DiaChiHoKhau) setDiaChiHoKhau(activeReg.hoSoThucTap.DiaChiHoKhau);
            if (activeReg.hoSoThucTap.DiaChiHienTai) setDiaChiHienTai(activeReg.hoSoThucTap.DiaChiHienTai);
            if (activeReg.hoSoThucTap.DuongDanCV) setFileCV(activeReg.hoSoThucTap.DuongDanCV);
            setCommit1(activeReg.hoSoThucTap.CamKetChinhXac);
            setCommit2(activeReg.hoSoThucTap.CamKetQuyChe);
          }

          if (activeReg.doanhNghiep) {
            setTenCongTy(activeReg.doanhNghiep.TenDoanhNghiep);
            setMaSoThue(activeReg.doanhNghiep.MaSoThue);
            setDiaChiCty(activeReg.doanhNghiep.DiaChi);
          }
          if (activeReg.ViTriPhanCong) setViTriCty(activeReg.ViTriPhanCong);
          if (activeReg.mentorDn) {
            setMentorTen(activeReg.mentorDn.HoTen);
            if (activeReg.mentorDn.SoDienThoai) setMentorSdt(activeReg.mentorDn.SoDienThoai);
            if (activeReg.mentorDn.Email) setMentorEmail(activeReg.mentorDn.Email);
          }

        }
      }
    } catch (err) {
      console.error('Failed to load student data:', err);
    }
  }, [currentUser.sinhVienId]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchStudentData(); }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchStudentData]);

  // Diary, grade and report data are fetched only on the tabs that display them.
  useEffect(() => {
    if (!activeRegId || !['sv-diary', 'sv-report'].includes(activeTab)) return;
    let alive = true;
    const loadAssessmentData = async () => {
      try {
        if (activeTab === 'sv-diary') {
          const rows = await evaluationService.getDiaries(activeRegId);
          if (alive) setDiaries(rows.map((d) => ({
            id: d.Id, tuan: d.TuanThu, ngay: d.NgayTao, noiDung: d.NoiDungCongViec,
            ketQua: d.KetQuaDatDuoc, NhanXetCuaGiangVien: d.NhanXetCuaGiangVien,
          })));
        } else {
          const [grade, reports] = await Promise.all([
            evaluationService.getGrades(activeRegId), evaluationService.getReports(activeRegId),
          ]);
          if (!alive) return;
          setDiemDN(grade?.TongDiemDoanhNghiep || 0);
          setDiemGV(grade?.TongDiemGiangVien || 0);
          setNhanXetChung(grade?.NhanXetChung || '');
          if (reports[0]) {
            setFileBaoCao(reports[0].DuongDanFile);
            setReportStatus(reports[0].TrangThaiBaoCao);
            setReportComment(reports[0].NhanXetCuaGiangVien || '');
          }
        }
      } catch (error) {
        if (alive) showToast(error instanceof Error ? error.message : 'Không thể tải nhật ký và kết quả thực tập.');
      }
    };
    void loadAssessmentData();
    return () => { alive = false; };
  }, [activeRegId, activeTab, showToast]);

  // Handle Form 1 submit (Bước 1)
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commit1 || !commit2) {
      alert('Vui lòng đồng ý với các điều khoản cam kết bắt buộc!');
      return;
    }

    try {
      if (!currentUser.sinhVienId || !openBatchId) throw new Error('Không có đợt thực tập đang nhận hồ sơ.');
      const res = await registrationService.submitStep1({
        sinhVienId: currentUser.sinhVienId,
        dotThucTapId: openBatchId,
        coVanHocTap,
        diemGPA,
        viTriUngTuyenDuKien: viTriDuKien,
        nangLucChuyenMon,
        trinhDoNgoaiNgu,
        diaChiHoKhau,
        diaChiHienTai,
        duongDanCV: fileCV,
        camKetChinhXac: commit1,
        camKetQuyChe: commit2,
      });

      if (res.registrationId) setActiveRegId(res.registrationId);
      setTrangThaiDangKy('DaDangKy');
      showToast('✓ Kê khai Bước 1 thành công! Đã lưu trạng thái DaDangKy và mở khóa Bước 2.');
      fetchStudentData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Không thể lưu hồ sơ cá nhân.');
    }
  };

  // Handle Apply Job from internal partner board (Nhánh 1)
  const handleApplyJob = async (job: CongViecThucTap) => {
    setLoaiDangKy('UngTuyenJob');
    setAppliedJobId(job.Id);
    setTenCongTy(job.TenDoanhNghiep || '');
    setMaSoThue(job.MaSoThue || '');
    setViTriCty(job.TieuDe);
    if (job.NguoiHuongDan) {
      setMentorTen(job.NguoiHuongDan.HoTen);
      setMentorSdt(job.NguoiHuongDan.SoDienThoai || '');
      setMentorEmail(job.NguoiHuongDan.Email || '');
    }

    try {
      if (!activeRegId) throw new Error('Hãy lưu hồ sơ cá nhân trước khi ứng tuyển.');
      const regId = activeRegId;
      await registrationService.applyJob(regId, job.Id);
      setTrangThaiDangKy('ChoDoanhNghiepDuyet');
      showToast(`✓ Đã nộp CV ứng tuyển vị trí "${job.TieuDe}". Hồ sơ đã chuyển đến Doanh nghiệp để xét duyệt trực tiếp!`);
      fetchStudentData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Không thể nộp hồ sơ ứng tuyển.');
    }
  };

  // Handle Form 2 submit (Nhánh 2 - Ngoại trường / GV giới thiệu)
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nguonNhanSu === 'GvGioiThieu' && !gvGioiThieu.trim()) {
      alert('Vui lòng nhập họ tên Giảng viên giới thiệu!');
      return;
    }

    setLoaiDangKy('NgoaiTruong');
    setAppliedJobId(null);

    try {
      if (!activeRegId) throw new Error('Hãy lưu hồ sơ cá nhân trước khi khai báo doanh nghiệp.');
      const regId = activeRegId;
      await registrationService.submitExternal({
        registrationId: regId,
        nguonNhanSu,
        giaoVienGioiThieu: gvGioiThieu,
        tenDoanhNghiep: tenCongTy,
        maSoThue,
        diaChi: diaChiCty,
        viTriPhanCong: viTriCty,
        mentorTen,
        mentorSdt,
        mentorEmail,
      });

      setTrangThaiDangKy('ChoPheDuyet');
      showToast('✓ Khai báo công ty ngoài trường thành công! Hồ sơ đã gửi Khoa chờ thẩm định pháp lý (ChoPheDuyet).');
      fetchStudentData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Không thể gửi hồ sơ ngoài trường.');
    }
  };

  // Handle Cancel Registration (DaHuy) -> allows reapply without collision
  const handleCancelRegistration = async () => {
    if (
      typeof window !== 'undefined' &&
      window.confirm(
        'Bạn có chắc chắn muốn hủy đơn đăng ký thực tập này không? Sau khi hủy, bạn có thể nộp lại đơn mới cho đợt này.'
      )
    ) {
      try {
        if (activeRegId) {
          await registrationService.cancelRegistration(activeRegId);
        }
        setTrangThaiDangKy('DaHuy');
        showToast('✓ Đã hủy đơn đăng ký. Bạn có thể nộp lại đơn mới bất kỳ lúc nào mà không bị lỗi trùng lặp dữ liệu.');
        fetchStudentData();
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : 'Không thể hủy hồ sơ.');
      }
    }
  };

  // Handle Reapply (Từ chối hoặc Đã hủy -> nộp lại đơn mới không bị khóa trùng)
  const handleReapply = async () => {
    if (!currentUser.sinhVienId || !openBatchId) {
      showToast('Hiện không có đợt thực tập đang nhận hồ sơ.');
      return;
    }
    try {
      const result = await registrationService.submitStep1({ sinhVienId: currentUser.sinhVienId, dotThucTapId: openBatchId, coVanHocTap, diemGPA, viTriUngTuyenDuKien: viTriDuKien, nangLucChuyenMon, trinhDoNgoaiNgu, diaChiHoKhau, diaChiHienTai, duongDanCV: fileCV, camKetChinhXac: commit1, camKetQuyChe: commit2 });
      setActiveRegId(result.registrationId);
      setTrangThaiDangKy('DaDangKy');
      showToast('Đã tạo hồ sơ mới cho đợt thực tập.');
    } catch (error) { showToast(error instanceof Error ? error.message : 'Không thể tạo hồ sơ mới.'); }
  };

  // Handle file CV change
  const handleFileCVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        alert('Cảnh báo: Vui lòng chỉ chọn tệp CV có định dạng .pdf!');
        e.target.value = '';
        return;
      }
      void (async () => {
        const form = new FormData();
        form.append('file', file);
        form.append('bucketType', 'private');
        form.append('path', `cv/${currentUser.sinhVienId}/${Date.now()}_${file.name}`);
        const response = await fetch('/api/storage/upload', { method: 'POST', body: form });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Không tải được CV lên.');
        setFileCV(result.path);
        showToast('Đã tải CV PDF lên.');
      })().catch((error: unknown) => showToast(error instanceof Error ? error.message : 'Không tải được CV lên.'));
    }
  };

  // Handle Add Diary
  const handleSaveDiaryFromModal = async (tuanThu: number, noiDung: string, ketQua: string) => {
    try {
      if (!activeRegId) throw new Error('Chưa có hồ sơ thực tập để ghi nhật ký.');
      const regId = activeRegId;
      await evaluationService.addDiary({
        DangKyThucTapId: regId,
        TuanThu: tuanThu,
        NoiDungCongViec: noiDung,
        KetQuaDatDuoc: ketQua,
      });
      showToast(`✓ Đã thêm nhật ký Tuần ${tuanThu} thành công!`);
      fetchStudentData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Không thể thêm nhật ký.');
    }
  };

  // Handle file report change & submit
  const handleFileReportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        alert('Vui lòng chỉ chọn tệp báo cáo có định dạng .pdf!');
        e.target.value = '';
        return;
      }
      void (async () => {
        const form = new FormData();
        form.append('file', file);
        form.append('bucketType', 'private');
        form.append('path', `reports/${currentUser.sinhVienId}/${Date.now()}_${file.name}`);
        const response = await fetch('/api/storage/upload', { method: 'POST', body: form });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Không tải được báo cáo lên.');
        setFileBaoCao(result.path);
        showToast('Đã tải báo cáo PDF lên.');
      })().catch((error: unknown) => showToast(error instanceof Error ? error.message : 'Không tải được báo cáo lên.'));
    }
  };

  const handleSubmitReport = async () => {
    try {
      if (!activeRegId || !fileBaoCao) throw new Error('Hãy tải báo cáo PDF lên trước khi nộp.');
      const regId = activeRegId;
      await evaluationService.submitReport({
        DangKyThucTapId: regId,
        DuongDanFile: fileBaoCao,
      });
      setReportStatus('ChoDuyet');
      showToast('✓ Đã nộp báo cáo thực tập tốt nghiệp! Đang chờ Giảng viên hướng dẫn duyệt.');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Không thể nộp báo cáo.');
    }
  };

  const getStatusText = (status: TrangThaiDangKy) => {
    switch (status) {
      case 'DaDangKy':
        return 'Bước 1 hoàn tất (Đang chọn Bước 2)';
      case 'ChoDoanhNghiepDuyet':
        return 'Chờ Doanh nghiệp xét duyệt CV';
      case 'ChoPheDuyet':
        return 'Chờ Khoa thẩm định & phê duyệt';
      case 'DaDuyet':
        return 'Đã duyệt chính thức (Hồ sơ đạt chuẩn)';
      case 'TuChoi':
        return 'Hồ sơ bị từ chối';
      case 'DaHuy':
        return 'Đã hủy đăng ký';
      default:
        return status;
    }
  };

  const getStatusPillClass = (status: TrangThaiDangKy) => {
    switch (status) {
      case 'DaDangKy':
        return 'bg-blue-50 text-huit-blue border border-blue-200';
      case 'ChoDoanhNghiepDuyet':
        return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
      case 'ChoPheDuyet':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'DaDuyet':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'TuChoi':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'DaHuy':
        return 'bg-slate-100 text-slate-700 border border-slate-300';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-5 fade-in w-full max-w-5xl mx-auto">
      {/* TAB: sv-register (Form đăng ký 2 bước chuẩn) */}
      {activeTab === 'sv-register' && (
        <div className="space-y-5">
          {/* Header Stepper & Status Banner */}
          <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Đăng ký & Kê khai Thực tập Doanh nghiệp
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Quy trình 2 bước: 1. Kê khai năng lực cá nhân (HoSoThucTap) &rarr; 2. Phân nhánh thực tập.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Trạng thái hồ sơ:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusPillClass(trangThaiDangKy)}`}>
                  {getStatusText(trangThaiDangKy)}
                </span>
              </div>
            </div>

            {/* Stepper Progress bar */}
            <div className="grid grid-cols-2 gap-3 pt-4 text-xs">
              <div className={`p-3 rounded-xl border flex items-center gap-3 ${
                trangThaiDangKy !== 'DaHuy'
                  ? 'bg-blue-50/50 border-blue-200 text-huit-blue font-bold'
                  : 'bg-gray-50 border-gray-200 text-gray-400'
              }`}>
                <div className="w-7 h-7 rounded-lg bg-huit-blue text-white flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <div>
                  <p className="font-bold">Bước 1: Hồ sơ năng lực cá nhân</p>
                  <p className="text-[11px] font-normal text-gray-500">GPA, CV PDF, Ngoại ngữ, CVHT</p>
                </div>
              </div>

              <div className={`p-3 rounded-xl border flex items-center gap-3 ${
                ['ChoDoanhNghiepDuyet', 'ChoPheDuyet', 'DaDuyet'].includes(trangThaiDangKy)
                  ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800 font-bold'
                  : 'bg-gray-50 border-gray-200 text-gray-500 font-medium'
              }`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                  ['ChoDoanhNghiepDuyet', 'ChoPheDuyet', 'DaDuyet'].includes(trangThaiDangKy)
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  2
                </div>
                <div>
                  <p className="font-bold">Bước 2: Phân nhánh đơn vị thực tập</p>
                  <p className="text-[11px] font-normal text-gray-500">Sàn đối tác (Job) hoặc Ngoài trường</p>
                </div>
              </div>
            </div>
          </div>

          {/* COMPONENT 1: Form Bước 1 */}
          <Step1ProfileForm
            currentUser={currentUser}
            coVanHocTap={coVanHocTap}
            setCoVanHocTap={setCoVanHocTap}
            diemGPA={diemGPA}
            setDiemGPA={setDiemGPA}
            viTriDuKien={viTriDuKien}
            setViTriDuKien={setViTriDuKien}
            nangLucChuyenMon={nangLucChuyenMon}
            setNangLucChuyenMon={setNangLucChuyenMon}
            trinhDoNgoaiNgu={trinhDoNgoaiNgu}
            setTrinhDoNgoaiNgu={setTrinhDoNgoaiNgu}
            diaChiHoKhau={diaChiHoKhau}
            setDiaChiHoKhau={setDiaChiHoKhau}
            diaChiHienTai={diaChiHienTai}
            setDiaChiHienTai={setDiaChiHienTai}
            fileCV={fileCV}
            onFileCVChange={handleFileCVChange}
            commit1={commit1}
            setCommit1={setCommit1}
            commit2={commit2}
            setCommit2={setCommit2}
            onSubmit={handleStep1Submit}
            disabled={['ChoDoanhNghiepDuyet', 'ChoPheDuyet', 'DaDuyet'].includes(trangThaiDangKy)}
          />

          {/* COMPONENT 2: Form Bước 2 */}
          <Step2CompanyBranch
            trangThaiDangKy={trangThaiDangKy}
            branchTab={branchTab}
            setBranchTab={setBranchTab}
            availableJobs={availableJobs}
            appliedJobId={appliedJobId}
            onApplyJob={handleApplyJob}
            nguonNhanSu={nguonNhanSu}
            setNguonNhanSu={setNguonNhanSu}
            gvGioiThieu={gvGioiThieu}
            setGvGioiThieu={setGvGioiThieu}
            tenCongTy={tenCongTy}
            setTenCongTy={setTenCongTy}
            maSoThue={maSoThue}
            setMaSoThue={setMaSoThue}
            diaChiCty={diaChiCty}
            setDiaChiCty={setDiaChiCty}
            viTriCty={viTriCty}
            setViTriCty={setViTriCty}
            mentorTen={mentorTen}
            setMentorTen={setMentorTen}
            mentorSdt={mentorSdt}
            setMentorSdt={setMentorSdt}
            mentorEmail={mentorEmail}
            setMentorEmail={setMentorEmail}
            onStep2Submit={handleStep2Submit}
            onCancelRegistration={handleCancelRegistration}
            onReapply={handleReapply}
            isStep1Done={trangThaiDangKy !== 'DaHuy'}
          />
        </div>
      )}

      {/* TAB: sv-overview / sv-info (Tổng quan thông tin) */}
      {(activeTab === 'sv-overview' || activeTab === 'sv-info') && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4 text-xs">
          <div className="pb-3 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-sm text-gray-900">Thông tin thực tập chi tiết</h3>
            <span className={`px-3 py-1 font-bold rounded-lg border ${getStatusPillClass(trangThaiDangKy)}`}>
              {getStatusText(trangThaiDangKy)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-gray-50 rounded-xl space-y-2">
              <span className="font-bold text-gray-900 block text-xs">Đơn vị tiếp nhận:</span>
              <p className="text-gray-700"><strong>Doanh nghiệp: </strong>{tenCongTy}</p>
              <p className="text-gray-700 font-mono"><strong>MST: </strong>{maSoThue}</p>
              <p className="text-gray-700"><strong>Địa chỉ: </strong>{diaChiCty}</p>
              <p className="text-gray-700"><strong>Vị trí phân công: </strong>{viTriCty}</p>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-xl space-y-2">
              <span className="font-bold text-gray-900 block text-xs">Cán bộ hướng dẫn (Mentor & GVHD):</span>
              <p className="text-gray-700"><strong>Mentor DN: </strong>{mentorTen} ({mentorEmail} - {mentorSdt})</p>
              <p className="text-gray-700"><strong>GVHD: </strong>ThS. Nguyễn Thế Hữu (Khoa CNTT)</p>
              <p className="text-gray-700"><strong>Cố vấn học tập: </strong>{coVanHocTap}</p>
              <p className="text-gray-700 font-mono"><strong>Học phần: </strong>Thực tập tốt nghiệp (HK2 2025-2026)</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB: sv-diary (Nhật ký công việc) */}
      {activeTab === 'sv-diary' && (
        <WeeklyDiarySection
          diaries={diaries}
          onOpenAddModal={() => setIsAddDiaryModalOpen(true)}
        />
      )}

      {/* TAB: sv-report (Báo cáo & Kết quả Rubric) */}
      {activeTab === 'sv-report' && (
        <StudentReportSection
          fileBaoCao={fileBaoCao}
          reportStatus={reportStatus}
          reportComment={reportComment}
          onFileReportChange={handleFileReportChange}
          onSubmitReport={handleSubmitReport}
          diemDN={diemDN}
          diemGV={diemGV}
          nhanXetChung={nhanXetChung}
        />
      )}

      {/* TAB: sv-profile (Hồ sơ cá nhân) */}
      {activeTab === 'sv-profile' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-3 text-xs">
          <h3 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-100">
            Hồ sơ sinh viên HUIT
          </h3>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div><span className="text-gray-500">Họ tên:</span> <strong className="text-gray-800">{currentUser.hoTen}</strong></div>
            <div><span className="text-gray-500">MSSV:</span> <strong className="text-gray-800 font-mono">{currentUser.mssv}</strong></div>
            <div><span className="text-gray-500">Email trường:</span> <strong className="text-gray-800 font-mono">{currentUser.email}</strong></div>
            <div><span className="text-gray-500">Chuyên ngành:</span> <strong className="text-huit-blue">{currentUser.chuyenNganh}</strong></div>
            <div><span className="text-gray-500">GPA tích lũy:</span> <strong className="text-emerald-700 font-mono">{diemGPA} / 4.0</strong></div>
            <div><span className="text-gray-500">Tệp CV:</span> <strong className="text-gray-800 font-mono">{fileCV}</strong></div>
          </div>
        </div>
      )}

      {/* MODAL: Thêm nhật ký tuần mới */}
      <WeeklyDiaryModal
        isOpen={isAddDiaryModalOpen}
        onClose={() => setIsAddDiaryModalOpen(false)}
        mode="student-add"
        onSaveStudent={handleSaveDiaryFromModal}
      />
    </div>
  );
};
