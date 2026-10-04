'use client';

import React from 'react';
import { CongViecThucTap, TrangThaiDangKy } from '@/types/database.types';
import {
  Briefcase,
  Storefront,
  Building,
  PaperPlaneTilt,
  CheckCircle,
  XCircle,
  Clock,
  ArrowCounterClockwise,
} from '@phosphor-icons/react';

interface Step2CompanyBranchProps {
  trangThaiDangKy: TrangThaiDangKy;
  branchTab: 'UngTuyenJob' | 'NgoaiTruong';
  setBranchTab: (val: 'UngTuyenJob' | 'NgoaiTruong') => void;
  // Branch 1
  availableJobs: CongViecThucTap[];
  appliedJobId: number | null;
  onApplyJob: (job: CongViecThucTap) => void;
  // Branch 2
  nguonNhanSu: 'TuTim' | 'DanhSachKhoa' | 'GvGioiThieu';
  setNguonNhanSu: (val: 'TuTim' | 'DanhSachKhoa' | 'GvGioiThieu') => void;
  gvGioiThieu: string;
  setGvGioiThieu: (val: string) => void;
  tenCongTy: string;
  setTenCongTy: (val: string) => void;
  maSoThue: string;
  setMaSoThue: (val: string) => void;
  diaChiCty: string;
  setDiaChiCty: (val: string) => void;
  viTriCty: string;
  setViTriCty: (val: string) => void;
  mentorTen: string;
  setMentorTen: (val: string) => void;
  mentorSdt: string;
  setMentorSdt: (val: string) => void;
  mentorEmail: string;
  setMentorEmail: (val: string) => void;
  onStep2Submit: (e: React.FormEvent) => void;
  // Actions
  onCancelRegistration: () => void;
  onReapply: () => void;
  isStep1Done: boolean;
}

export const Step2CompanyBranch: React.FC<Step2CompanyBranchProps> = ({
  trangThaiDangKy,
  branchTab,
  setBranchTab,
  availableJobs,
  appliedJobId,
  onApplyJob,
  nguonNhanSu,
  setNguonNhanSu,
  gvGioiThieu,
  setGvGioiThieu,
  tenCongTy,
  setTenCongTy,
  maSoThue,
  setMaSoThue,
  diaChiCty,
  setDiaChiCty,
  viTriCty,
  setViTriCty,
  mentorTen,
  setMentorTen,
  mentorSdt,
  setMentorSdt,
  mentorEmail,
  setMentorEmail,
  onStep2Submit,
  onCancelRegistration,
  onReapply,
  isStep1Done,
}) => {
  const isLocked = !isStep1Done;
  const isSubmitted = ['ChoDoanhNghiepDuyet', 'ChoPheDuyet', 'DaDuyet'].includes(trangThaiDangKy);
  const isRejectedOrCancelled = ['TuChoi', 'DaHuy'].includes(trangThaiDangKy);

  return (
    <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-200 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
            2
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-800">
              Bước 2: Lựa chọn hình thức đăng ký thực tập
            </h3>
            <p className="text-xs text-gray-500">
              Chọn một trong hai nhánh: Ứng tuyển Job đối tác nội bộ HOẶC Khai báo doanh nghiệp ngoài trường.
            </p>
          </div>
        </div>

        {/* Action buttons if submitted or rejected */}
        {isSubmitted && (
          <button
            type="button"
            onClick={onCancelRegistration}
            className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition cursor-pointer"
          >
            Hủy đơn để nộp lại
          </button>
        )}

        {isRejectedOrCancelled && (
          <button
            type="button"
            onClick={onReapply}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-huit-blue hover:bg-[#002244] rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <ArrowCounterClockwise size={15} weight="bold" />
            <span>Nộp lại đơn mới</span>
          </button>
        )}
      </div>

      {isLocked ? (
        <div className="p-6 bg-gray-50 rounded-xl text-center text-xs text-gray-500">
          <p className="font-semibold text-gray-700 mb-1">Bước 2 đang tạm khóa</p>
          <p>Vui lòng hoàn thành và lưu hồ sơ năng lực cá nhân ở Bước 1 để mở khóa Bước 2.</p>
        </div>
      ) : (
        <>
          {/* 2 Tabs phân nhánh */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setBranchTab('UngTuyenJob')}
              className={`py-2 px-3 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer ${
                branchTab === 'UngTuyenJob'
                  ? 'bg-white text-huit-blue shadow-xs font-black'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Storefront size={16} weight={branchTab === 'UngTuyenJob' ? 'fill' : 'bold'} />
              <span>Nhánh 1: Sàn tuyển dụng nội bộ</span>
            </button>
            <button
              type="button"
              onClick={() => setBranchTab('NgoaiTruong')}
              className={`py-2 px-3 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer ${
                branchTab === 'NgoaiTruong'
                  ? 'bg-white text-sky-700 shadow-xs font-black'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Building size={16} weight={branchTab === 'NgoaiTruong' ? 'fill' : 'bold'} />
              <span>Nhánh 2: Ngoài trường / GV giới thiệu</span>
            </button>
          </div>

          {/* NHÁNH 1: SÀN VIỆC LÀM NỘI BỘ */}
          {branchTab === 'UngTuyenJob' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-huit-blue flex items-start gap-2">
                <Storefront size={18} weight="fill" className="shrink-0 mt-0.5" />
                <p>
                  Các việc làm dưới đây đã được <strong>Khoa CNTT thẩm định và phê duyệt (DaDuyet)</strong>. Khi doanh nghiệp đối tác xét duyệt CV và đồng ý tiếp nhận, hồ sơ của bạn sẽ được <strong>chuyển thẳng sang Đã duyệt (DaDuyet)</strong> mà không cần qua bước phê duyệt lại của Khoa.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {availableJobs.filter((j) => j.TrangThaiDuyetJob === 'DaDuyet').map((job) => {
                  const isApplied = appliedJobId === job.Id || (tenCongTy === job.TenDoanhNghiep && viTriCty === job.TieuDe);
                  return (
                    <div
                      key={job.Id}
                      className={`p-4 rounded-xl border transition flex flex-col justify-between ${
                        isApplied
                          ? 'border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500/20'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-huit-blue border border-blue-200">
                            {job.TenDoanhNghiep || 'Doanh nghiệp đối tác'}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400">
                            Chỉ tiêu: {job.SoLuongTuyen} SV
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-gray-900 mb-1">{job.TieuDe}</h4>
                        <p className="text-[11px] text-gray-500 line-clamp-2 mb-3 leading-relaxed">
                          {job.MoTaCongViec}
                        </p>
                        {job.NguoiHuongDan && (
                          <div className="text-[10px] text-gray-500 bg-gray-50 p-2 rounded-lg mb-3">
                            <span className="font-bold text-gray-700">Mentor: </span>
                            {job.NguoiHuongDan.HoTen} ({job.NguoiHuongDan.Email})
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-[10px] text-gray-400">
                          Hạn: {new Date(job.HanNopHoSo).toLocaleDateString('vi-VN')}
                        </span>
                        {isApplied ? (
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg flex items-center gap-1">
                            <CheckCircle size={14} weight="fill" />
                            <span>Đã nộp CV</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onApplyJob(job)}
                            className="px-3 py-1.5 bg-huit-blue hover:bg-[#002244] text-white font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5"
                          >
                            <PaperPlaneTilt size={14} weight="bold" />
                            <span>Nộp CV ngay</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* NHÁNH 2: NGOÀI TRƯỜNG / GV GIỚI THIỆU */}
          {branchTab === 'NgoaiTruong' && (
            <form onSubmit={onStep2Submit} className="space-y-4">
              <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl text-xs text-sky-900 flex items-start gap-2">
                <Building size={18} weight="fill" className="shrink-0 mt-0.5 text-sky-700" />
                <p>
                  Áp dụng cho sinh viên <strong>tự liên hệ doanh nghiệp ngoài</strong> hoặc do <strong>giảng viên Khoa giới thiệu</strong>. Hồ sơ sau khi gửi sẽ ở trạng thái <strong>Chờ phê duyệt (ChoPheDuyet)</strong> để Ban Chủ nhiệm Khoa thẩm định tính pháp lý và quy chuẩn của đơn vị tiếp nhận.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nguồn tiếp nhận <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={nguonNhanSu}
                    onChange={(e) => setNguonNhanSu(e.target.value as 'TuTim' | 'GvGioiThieu')}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-1 focus:ring-huit-blue outline-none"
                  >
                    <option value="TuTim">Sinh viên tự tìm doanh nghiệp</option>
                    <option value="GvGioiThieu">Do Giảng viên Khoa giới thiệu</option>
                  </select>
                </div>

                {nguonNhanSu === 'GvGioiThieu' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Họ tên Giảng viên giới thiệu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={gvGioiThieu}
                      onChange={(e) => setGvGioiThieu(e.target.value)}
                      placeholder="ThS. Nguyễn Thế Hữu..."
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-1 focus:ring-huit-blue outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Tên doanh nghiệp tiếp nhận <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={tenCongTy}
                    onChange={(e) => setTenCongTy(e.target.value)}
                    placeholder="Công ty Cổ phần / TNHH..."
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-1 focus:ring-huit-blue outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Mã số thuế (MST) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={maSoThue}
                    onChange={(e) => setMaSoThue(e.target.value)}
                    placeholder="0101248141"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold font-mono focus:bg-white focus:ring-1 focus:ring-huit-blue outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Địa chỉ trụ sở / Nơi thực tập <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={diaChiCty}
                    onChange={(e) => setDiaChiCty(e.target.value)}
                    placeholder="Số nhà, đường, phường, quận/huyện, tỉnh/thành..."
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-1 focus:ring-huit-blue outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Vị trí thực tập phân công <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={viTriCty}
                    onChange={(e) => setViTriCty(e.target.value)}
                    placeholder="Ví dụ: Backend Developer Intern"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-1 focus:ring-huit-blue outline-none"
                  />
                </div>
              </div>

              {/* Thông tin Mentor Doanh nghiệp */}
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                <span className="text-xs font-bold text-gray-700 block">
                  Cán bộ hướng dẫn tại Doanh nghiệp (Mentor):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Họ tên Mentor <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={mentorTen}
                      onChange={(e) => setMentorTen(e.target.value)}
                      placeholder="Lê Hoàng Nam..."
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-huit-blue outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Số điện thoại Mentor <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={mentorSdt}
                      onChange={(e) => setMentorSdt(e.target.value)}
                      placeholder="0908112233"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-huit-blue outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Email Mentor <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={mentorEmail}
                      onChange={(e) => setMentorEmail(e.target.value)}
                      placeholder="mentor@company.com"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-huit-blue outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2"
                >
                  <PaperPlaneTilt size={16} weight="bold" />
                  <span>GỬI HỒ SƠ CHỜ KHOA THẨM ĐỊNH (CHOPHEDUYET)</span>
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
};
