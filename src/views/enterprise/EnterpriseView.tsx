'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  UserSession,
  CongViecThucTap,
  DangKyThucTap,
} from '@/types/database.types';
import { Modal } from '@/shared/ui/Modal';
import { AddJobModal } from '@/components/enterprise/AddJobModal';
import { ApplicantReviewModal } from '@/components/enterprise/ApplicantReviewModal';
import { InternEvaluationModal } from '@/components/enterprise/InternEvaluationModal';
import { jobService } from '@/features/jobs/services/jobService';
import { registrationService } from '@/features/registration/services/registrationService';
import { evaluationService } from '@/features/evaluation/services/evaluationService';
import { batchService } from '@/features/batches/services/batchService';
import {
  Briefcase,
  Users,
  CheckCircle,
  XCircle,
  Plus,
  FilePdf,
  CalendarCheck,
  UserGear,
  Clock,
  Building,
  Star,
  Eye,
} from '@phosphor-icons/react';

interface EnterpriseViewProps {
  currentUser: UserSession;
  activeTab: string;
  onNavigateTab: (tab: string) => void;
  showToast: (msg: string) => void;
}

export const EnterpriseView: React.FC<EnterpriseViewProps> = ({
  currentUser,
  activeTab,
  onNavigateTab,
  showToast,
}) => {
  const [jobs, setJobs] = useState<CongViecThucTap[]>([]);
  const [registrations, setRegistrations] = useState<DangKyThucTap[]>([]);
  const [loading, setLoading] = useState(false);
  const [openBatchId, setOpenBatchId] = useState<number | null>(null);

  // Modals state
  const [isAddJobModalOpen, setIsAddJobModalOpen] = useState(false);
  const [selectedJobForApplicants, setSelectedJobForApplicants] = useState<CongViecThucTap | null>(null);
  const [reviewingApplicant, setReviewingApplicant] = useState<DangKyThucTap | null>(null);
  const [evaluatingIntern, setEvaluatingIntern] = useState<DangKyThucTap | null>(null);

  // Fetch jobs and registrations from API
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [fetchedJobs, fetchedRegs, batches] = await Promise.all([
        jobService.getJobs({ doanhNghiepId: currentUser.doanhNghiepId }),
        registrationService.getRegistrations({ doanhNghiepId: currentUser.doanhNghiepId }),
        batchService.getBatches(),
      ]);
      setJobs(fetchedJobs);
      setRegistrations(fetchedRegs);
      const now = Date.now();
      const currentBatch = batches.find((batch) => Date.parse(batch.NgayBatDauDangKy) <= now && Date.parse(batch.NgayKetThucDangKy) >= now);
      setOpenBatchId(currentBatch?.Id || null);
    } catch (err) {
      console.error('Failed to load enterprise data:', err);
      showToast(err instanceof Error ? err.message : 'Không thể tải dữ liệu doanh nghiệp.');
    } finally {
      setLoading(false);
    }
  }, [currentUser.doanhNghiepId, showToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchData(); }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchData]);

  // Handle create new job posting (ChoKhoaDuyet)
  const handleCreateJob = async (jobData: {
    tieuDe: string;
    soLuong: number;
    moTa: string;
    yeuCau: string;
    hanNop: string;
    mentorTen: string;
    mentorSdt: string;
    mentorEmail: string;
  }) => {
    try {
      if (!currentUser.doanhNghiepId || !openBatchId) throw new Error('Không có tài khoản doanh nghiệp hoặc đợt đang nhận tin tuyển dụng.');
      await jobService.createJob({
        DoanhNghiepId: currentUser.doanhNghiepId || 0,
        DotThucTapId: openBatchId || 0,
        TieuDe: jobData.tieuDe,
        MoTaCongViec: jobData.moTa,
        YeuCauUngVien: jobData.yeuCau,
        SoLuongTuyen: jobData.soLuong,
        HanNopHoSo: jobData.hanNop,
        mentorTen: jobData.mentorTen,
        mentorSdt: jobData.mentorSdt,
        mentorEmail: jobData.mentorEmail,
      });
      showToast('✓ Đăng tin tuyển dụng thành công! Tin đang chờ Khoa CNTT kiểm duyệt.');
      fetchData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Không thể tạo tin tuyển dụng.');
    }
  };

  // Doanh nghiệp trực tiếp duyệt đơn ứng tuyển -> Chuyển THẲNG sang DaDuyet
  const getApplicantsForJob = (jobId: number) =>
    registrations.filter(
      (r) =>
        r.LoaiDangKy === 'UngTuyenJob' &&
        r.CongViecId === jobId &&
        ['ChoDoanhNghiepDuyet', 'DaDuyet', 'TuChoi'].includes(r.TrangThaiDangKy)
    );

  const getApprovedCountForJob = (jobId: number) =>
    registrations.filter((r) => r.CongViecId === jobId && r.TrangThaiDangKy === 'DaDuyet').length;

  const handleReviewApplicant = async (
    regId: number,
    action: 'Duyet' | 'TuChoi',
    reason?: string
  ) => {
    try {
      await registrationService.reviewEnterprise(regId, action, reason);
      showToast(
        action === 'Duyet'
          ? '✓ Đã duyệt tiếp nhận sinh viên! Hồ sơ chuyển thẳng sang DaDuyet.'
          : '✓ Đã từ chối hồ sơ ứng viên.'
      );
      fetchData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Không thể cập nhật hồ sơ.');
    }
  };

  // Lưu Phiếu nhận xét doanh nghiệp
  const handleSaveEvaluation = async (
    regId: number,
    scores: Array<{ tieuChiId: number; diemDanhGia: number; nhanXetTieuChi?: string }>,
    nhanXetChung: string
  ) => {
    try {
      await evaluationService.submitGrade({
        dangKyThucTapId: regId,
        nguoiCham: 'DoanhNghiep',
        scores,
        nhanXetChung,
        nguoiHuongDanDnId: currentUser.doanhNghiepId,
      });
      showToast('✓ Đã lưu Phiếu nhận xét & đồng bộ điểm sang Bảng điểm Rubric của Khoa!');
      fetchData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Không thể lưu phiếu nhận xét doanh nghiệp.');
    }
  };

  // Filter registrations for this company
  const applicantList = registrations.filter(
    (r) => r.LoaiDangKy === 'UngTuyenJob' && r.TrangThaiDangKy === 'ChoDoanhNghiepDuyet'
  );

  const internList = registrations.filter(
    (r) => r.TrangThaiDangKy === 'DaDuyet'
  );

  return (
    <div className="space-y-5 fade-in w-full max-w-6xl mx-auto">
      {loading && (
        <div role="status" aria-live="polite" className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-sm text-huit-blue">
          Đang tải dữ liệu doanh nghiệp...
        </div>
      )}
      {/* TAB 1: dn-jobs (Đăng tuyển & Quản lý Job) */}
      {activeTab === 'dn-jobs' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-wrap justify-between items-center gap-3">
            <div>
              <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                <Briefcase size={22} className="text-sky-700" weight="fill" />
                <span>Quản Lý Tin Tuyển Dụng Thực Tập</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Đăng tin tuyển dụng thực tập sinh. Tin mới sẽ gửi Khoa CNTT duyệt trước khi lên Sàn nội bộ.
              </p>
            </div>
            <button
              onClick={() => setIsAddJobModalOpen(true)}
              className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Plus size={16} weight="bold" />
              <span>Đăng Tin Mới (ChoKhoaDuyet)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => {
              const approvedCount = getApprovedCountForJob(job.Id);
              const applicants = getApplicantsForJob(job.Id);
              return (
                <div
                  key={job.Id}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs flex flex-col justify-between hover:border-sky-300 transition"
                >
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-start gap-2">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                          job.TrangThaiDuyetJob === 'DaDuyet'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : job.TrangThaiDuyetJob === 'TuChoi'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {job.TrangThaiDuyetJob === 'DaDuyet'
                          ? '✓ Khoa Đã Duyệt'
                          : job.TrangThaiDuyetJob === 'TuChoi'
                          ? '✕ Bị Từ Chối'
                          : '⏳ Chờ Khoa Duyệt'}
                      </span>
                      <span className="text-xs font-mono font-bold text-gray-500">
                        {approvedCount}/{job.SoLuongTuyen} SV
                      </span>
                    </div>

                    <h3 className="font-bold text-gray-900 text-sm">{job.TieuDe}</h3>
                    <p className="text-xs text-gray-600 line-clamp-2">{job.MoTaCongViec}</p>

                    {job.mentorDn && (
                      <div className="p-2 bg-sky-50/50 rounded-lg border border-sky-100 text-[11px] text-gray-700 flex items-center gap-2">
                        <UserGear size={15} className="text-sky-700 shrink-0" weight="bold" />
                        <span className="truncate">
                          Mentor: <strong>{job.mentorDn.HoTen}</strong> ({job.mentorDn.Email})
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-gray-400">
                      Hạn: {new Date(job.HanNopHoSo).toLocaleDateString('vi-VN')}
                    </span>
                    <button
                      onClick={() => setSelectedJobForApplicants(job)}
                      className="px-3 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      <Users size={14} weight="bold" />
                      <span>Ứng viên ({applicants.length})</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: dn-applicants (Duyệt ứng viên nộp CV) */}
      {activeTab === 'dn-applicants' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs text-xs">
          <div className="p-4 px-5 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Users size={20} className="text-sky-700" weight="fill" />
                <span>Danh Sách Ứng Viên Nộp CV ({applicantList.length})</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Doanh nghiệp trực tiếp xét duyệt CV. Khi duyệt, hồ sơ chuyển thẳng sang DaDuyet mà không cần Khoa phê duyệt lại.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4 font-bold">Sinh viên</th>
                  <th className="py-3 px-4 font-bold">MSSV & Chuyên ngành</th>
                  <th className="py-3 px-4 font-bold">Vị trí ứng tuyển</th>
                  <th className="py-3 px-4 font-bold">GPA & Ngoại ngữ</th>
                  <th className="py-3 px-4 font-bold">Hồ sơ CV</th>
                  <th className="py-3 px-4 font-bold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applicantList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">
                      Chưa có ứng viên nào đang chờ xét duyệt.
                    </td>
                  </tr>
                ) : (
                  applicantList.map((app) => (
                    <tr key={app.Id} className="hover:bg-gray-50/60 transition">
                      <td className="py-3 px-4 font-bold text-gray-900">
                        {app.sinhVien?.HoTen || 'Nguyễn Văn An'}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        <span className="font-mono font-semibold block">{app.sinhVien?.Mssv}</span>
                        <span className="text-[11px] text-gray-400">{app.sinhVien?.ChuyenNganh}</span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-sky-800">
                        {app.ViTriPhanCong || 'Backend Intern'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-emerald-700 font-mono">
                          GPA: {app.hoSoThucTap?.DiemGPA ?? '2.84'}
                        </span>
                        <span className="block text-[11px] text-gray-500">
                          {app.hoSoThucTap?.TrinhDoNgoaiNgu || 'TOEIC 650'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-rose-600 font-medium bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                          <FilePdf size={14} weight="fill" />
                          <span>PDF CV</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setReviewingApplicant(app)}
                          className="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-lg transition cursor-pointer shadow-2xs"
                        >
                          Xem & Xét Duyệt
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: dn-interns (Đánh giá TTS 5.0đ - Phiếu nhận xét) */}
      {activeTab === 'dn-interns' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs text-xs">
          <div className="p-4 px-5 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Star size={20} className="text-amber-500" weight="fill" />
                <span>Đánh Giá Thực Tập Sinh Tiếp Nhận ({internList.length})</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Chấm điểm phiếu nhận xét doanh nghiệp (tối đa 5.0đ) đồng bộ sang bảng điểm Rubric của Khoa CNTT.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4 font-bold">Sinh viên</th>
                  <th className="py-3 px-4 font-bold">MSSV & Lớp</th>
                  <th className="py-3 px-4 font-bold">Vị trí thực tập</th>
                  <th className="py-3 px-4 font-bold">Điểm DN (Max 5.0)</th>
                  <th className="py-3 px-4 font-bold text-right">Phiếu nhận xét</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {internList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400">
                      Chưa có thực tập sinh chính thức.
                    </td>
                  </tr>
                ) : (
                  internList.map((intern) => (
                    <tr key={intern.Id} className="hover:bg-gray-50/60 transition">
                      <td className="py-3 px-4 font-bold text-gray-900">
                        {intern.sinhVien?.HoTen || 'Nguyễn Văn An'}
                      </td>
                      <td className="py-3 px-4 text-gray-600 font-mono">
                        {intern.sinhVien?.Mssv} ({intern.sinhVien?.Lop})
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-800">
                        {intern.ViTriPhanCong || 'Backend Intern'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-sky-800">
                        4.80 / 5.00
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setEvaluatingIntern(intern)}
                          className="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-lg transition cursor-pointer shadow-2xs flex items-center gap-1.5 ml-auto"
                        >
                          <Star size={14} weight="fill" className="text-amber-300" />
                          <span>Chấm điểm (5.0đ)</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: dn-mentors (Danh sách Mentor) */}
      {activeTab === 'dn-mentors' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs text-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <UserGear size={20} className="text-sky-700" weight="fill" />
                <span>Danh Mục Cán Bộ Hướng Dẫn Doanh Nghiệp (Mentor)</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Các Mentor được tự động lưu vào bảng NguoiHuongDanDoanhNghiep khi Doanh nghiệp tạo tin tuyển dụng.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {[
              { hoTen: 'Lê Hoàng Nam', sdt: '0908112233', email: 'namlh@fsoft.com.vn', chucVu: 'Senior Technical Lead' },
              { hoTen: 'Nguyễn Văn Đạt', sdt: '0918334455', email: 'datnv@vng.com.vn', chucVu: 'Data Engineering Lead' },
              { hoTen: 'Trần Quốc Bảo', sdt: '0988667788', email: 'baotq@tmasolutions.com', chucVu: 'QA Manager' },
            ].map((m, idx) => (
              <div key={idx} className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5">
                <span className="font-bold text-gray-900 block text-sm">{m.hoTen}</span>
                <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 inline-block">
                  {m.chucVu}
                </span>
                <div className="text-gray-600 space-y-0.5 pt-1 text-[11px]">
                  <p>SĐT: <span className="font-mono font-medium">{m.sdt}</span></p>
                  <p>Email: <span className="font-medium text-gray-800">{m.email}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* POPUP: Xem danh sách ứng viên theo từng Job */}
      <Modal
        isOpen={!!selectedJobForApplicants}
        onClose={() => setSelectedJobForApplicants(null)}
        title={`ỨNG VIÊN NỘP CV: ${selectedJobForApplicants?.TieuDe || ''}`}
        subtitle={`Chỉ tiêu tuyển dụng: ${selectedJobForApplicants?.SoLuongTuyen || 1} sinh viên`}
        maxWidth="3xl"
      >
        <div className="space-y-3 text-xs">
          {selectedJobForApplicants && (
            <div className="divide-y divide-gray-100">
              {getApplicantsForJob(selectedJobForApplicants.Id).length === 0 ? (
                <p className="text-center py-6 text-gray-400">Chưa có sinh viên nào nộp CV vào vị trí này.</p>
              ) : (
                getApplicantsForJob(selectedJobForApplicants.Id).map((app) => (
                  <div key={app.Id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <span className="font-bold text-gray-900 block text-xs">{app.sinhVien?.HoTen}</span>
                      <span className="text-gray-500 font-mono text-[11px]">
                        MSSV: {app.sinhVien?.Mssv} • GPA: {app.hoSoThucTap?.DiemGPA ?? '2.84'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          app.TrangThaiDangKy === 'DaDuyet'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : app.TrangThaiDangKy === 'TuChoi'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {app.TrangThaiDangKy}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedJobForApplicants(null);
                          setReviewingApplicant(app);
                        }}
                        className="px-2.5 py-1 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-lg text-xs"
                      >
                        Xem CV
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* EXTRACTED MODAL 1: Đăng tin tuyển dụng mới */}
      <AddJobModal
        isOpen={isAddJobModalOpen}
        onClose={() => setIsAddJobModalOpen(false)}
        onSubmit={handleCreateJob}
      />

      {/* EXTRACTED MODAL 2: Xét duyệt ứng viên nộp CV */}
      <ApplicantReviewModal
        isOpen={!!reviewingApplicant}
        onClose={() => setReviewingApplicant(null)}
        registration={reviewingApplicant}
        onReview={handleReviewApplicant}
        currentApprovedCount={
          reviewingApplicant?.CongViecId
            ? getApprovedCountForJob(reviewingApplicant.CongViecId)
            : 0
        }
        maxQuota={
          jobs.find((j) => j.Id === reviewingApplicant?.CongViecId)?.SoLuongTuyen || 3
        }
      />

      {/* EXTRACTED MODAL 3: Phiếu nhận xét & đánh giá TTS (5.0đ) */}
      <InternEvaluationModal
        isOpen={!!evaluatingIntern}
        onClose={() => setEvaluatingIntern(null)}
        registration={evaluatingIntern}
        onSaveEvaluation={handleSaveEvaluation}
      />
    </div>
  );
};
