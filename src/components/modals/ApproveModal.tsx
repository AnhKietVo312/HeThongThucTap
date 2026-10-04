import React, { useState } from 'react';
import { DangKyThucTap } from '@/types/database.types';
import { Modal } from '@/shared/ui/Modal';
import { StatusBadge } from '@/shared/ui/StatusBadge';
import {
  User,
  Buildings,
  FilePdf,
  CheckCircle,
  XCircle,
  WarningOctagon,
  EnvelopeSimple,
  Phone,
  Briefcase,
  MapPin,
  Certificate,
} from '@phosphor-icons/react';

interface ApproveModalProps {
  isOpen: boolean;
  onClose: () => void;
  registration: DangKyThucTap | null;
  onApprove: (id: number) => void;
  onReject: (id: number, reason: string) => void;
}

export const ApproveModal: React.FC<ApproveModalProps> = ({
  isOpen,
  onClose,
  registration,
  onApprove,
  onReject,
}) => {
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  if (!registration) return null;

  const sv = registration.sinhVien;
  const hs = registration.hoSoThucTap;
  const dn = registration.doanhNghiep;
  const mentor = registration.mentorDn;

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối hồ sơ');
      return;
    }
    onReject(registration.Id, rejectReason);
    setIsRejecting(false);
    setRejectReason('');
    onClose();
  };

  const handleConfirmApprove = () => {
    onApprove(registration.Id);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Xét duyệt Hồ sơ Đăng ký Thực tập (Gộp Form 1 & Form 2)"
      subtitle={`Sinh viên: ${sv?.HoTen || 'N/A'} - MSSV: ${sv?.Mssv || 'N/A'}`}
      maxWidth="4xl"
      footer={
        isRejecting ? (
          <div className="w-full flex items-center justify-between">
            <span className="text-xs text-rose-600 font-semibold flex items-center gap-1">
              <WarningOctagon size={16} weight="bold" />
              Lý do từ chối sẽ được gửi qua email/thông báo đến sinh viên
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsRejecting(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-sm cursor-pointer"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Trạng thái hiện tại:</span>
              <StatusBadge status={registration.TrangThaiDangKy} />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => setIsRejecting(true)}
                className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <XCircle size={16} weight="bold" />
                Từ chối hồ sơ
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <CheckCircle size={16} weight="bold" />
                Duyệt chính thức
              </button>
            </div>
          </div>
        )
      }
    >
      <div className="space-y-6">
        {/* Reject reason input view */}
        {isRejecting && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
            <label className="block text-xs font-bold uppercase text-rose-800">
              Nhập lý do từ chối hồ sơ:
            </label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ví dụ: Mã số thuế doanh nghiệp không tồn tại, hoặc sinh viên chưa bổ sung chứng chỉ ngoại ngữ..."
              className="w-full p-3 text-xs bg-white border border-rose-300 rounded-xl outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
        )}

        {/* 2-Column Side-by-side or stacked Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Card Form 1: Kê khai cá nhân */}
          <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2 text-huit-blue">
                <User size={18} weight="bold" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  BƯỚC 1: KÊ KHAI HỒ SƠ CÁ NHÂN
                </h4>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                Đã hoàn tất
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start justify-between py-1 border-b border-slate-100">
                <span className="text-gray-500">Họ và tên SV:</span>
                <span className="font-bold text-gray-800">{sv?.HoTen}</span>
              </div>
              <div className="flex items-start justify-between py-1 border-b border-slate-100">
                <span className="text-gray-500">Mã số sinh viên:</span>
                <span className="font-mono font-semibold text-gray-800">{sv?.Mssv}</span>
              </div>
              <div className="flex items-start justify-between py-1 border-b border-slate-100">
                <span className="text-gray-500">Lớp sinh hoạt:</span>
                <span className="font-semibold text-gray-800">{sv?.Lop}</span>
              </div>
              <div className="flex items-start justify-between py-1 border-b border-slate-100">
                <span className="text-gray-500">Chuyên ngành đào tạo:</span>
                <span className="font-bold text-huit-blue">{sv?.ChuyenNganh}</span>
              </div>
              <div className="flex items-start justify-between py-1 border-b border-slate-100">
                <span className="text-gray-500">Điểm GPA tích lũy:</span>
                <span className="font-mono font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {hs?.DiemGPA?.toFixed(2) || 'Chưa cập nhật'} / 4.0
                </span>
              </div>
              <div className="flex items-start justify-between py-1 border-b border-slate-100">
                <span className="text-gray-500">Trình độ Ngoại ngữ:</span>
                <span className="font-semibold text-gray-800 flex items-center gap-1">
                  <Certificate size={14} className="text-amber-600" weight="bold" />
                  {hs?.TrinhDoNgoaiNgu || 'Chưa có'}
                </span>
              </div>
              <div className="flex items-start justify-between py-1 border-b border-slate-100">
                <span className="text-gray-500">Cố vấn học tập (CVHT):</span>
                <span className="font-medium text-gray-800">{hs?.CoVanHocTap || 'Chưa cập nhật'}</span>
              </div>
              <div className="py-1 border-b border-slate-100">
                <span className="text-gray-500 block mb-0.5">Địa chỉ hiện tại:</span>
                <span className="font-medium text-gray-800">{hs?.DiaChiHienTai || 'Chưa cập nhật'}</span>
              </div>
              <div className="py-1 border-b border-slate-100">
                <span className="text-gray-500 block mb-0.5">Năng lực chuyên môn:</span>
                <p className="font-normal text-gray-700 bg-white p-2 rounded-lg border border-slate-200">
                  {hs?.NangLucChuyenMon || 'Chưa kê khai'}
                </p>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-gray-500">File CV đính kèm:</span>
                {hs?.DuongDanCV ? (
                  <a
                    href={hs.DuongDanCV}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-huit-blue hover:text-huit-red font-bold underline transition"
                  >
                    <FilePdf size={16} weight="fill" className="text-rose-600" />
                    Xem file CV (PDF)
                  </a>
                ) : (
                  <span className="text-gray-400">Không có file</span>
                )}
              </div>
            </div>
          </div>

          {/* Card Form 2: Khai báo Doanh nghiệp thực tập */}
          <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2 text-huit-red">
                <Buildings size={18} weight="bold" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  BƯỚC 2: THÔNG TIN DOANH NGHIỆP
                </h4>
              </div>
              {registration.NguonNhanSu ? (
                <StatusBadge status={registration.NguonNhanSu} type="source" />
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
                  Chưa khai báo
                </span>
              )}
            </div>

            {registration.NguonNhanSu ? (
              <div className="space-y-3 text-xs">
                <div className="py-1 border-b border-slate-100">
                  <span className="text-gray-500 block mb-0.5">Tên doanh nghiệp:</span>
                  <span className="font-bold text-gray-900 leading-snug block">
                    {dn?.TenDoanhNghiep || 'Doanh nghiệp liên hệ bên ngoài'}
                  </span>
                  {dn?.TrangThaiChuan && (
                    <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      ✓ Doanh nghiệp đối tác chuẩn của Khoa
                    </span>
                  )}
                </div>

                <div className="flex items-start justify-between py-1 border-b border-slate-100">
                  <span className="text-gray-500">Mã số thuế (MST):</span>
                  <span className="font-mono font-bold text-gray-800 bg-white px-2 py-0.5 rounded border border-gray-200">
                    {dn?.MaSoThue || '0315892341'}
                  </span>
                </div>

                <div className="py-1 border-b border-slate-100">
                  <span className="text-gray-500 block mb-0.5">Địa chỉ doanh nghiệp:</span>
                  <span className="text-gray-700 flex items-start gap-1">
                    <MapPin size={14} className="shrink-0 text-gray-400 mt-0.5" />
                    {dn?.DiaChi || 'Chưa cập nhật địa chỉ'}
                  </span>
                </div>

                <div className="py-1 border-b border-slate-100">
                  <span className="text-gray-500 block mb-0.5">Vị trí thực tập / công việc:</span>
                  <span className="font-semibold text-huit-blue flex items-center gap-1">
                    <Briefcase size={14} />
                    {registration.ViTriPhanCong || hs?.ViTriUngTuyenDuKien || 'Thực tập sinh'}
                  </span>
                </div>

                {registration.GiaoVienGioiThieu && (
                  <div className="py-1 border-b border-slate-100">
                    <span className="text-gray-500 block mb-0.5">Giảng viên HUIT giới thiệu:</span>
                    <span className="font-bold text-purple-700">
                      {registration.GiaoVienGioiThieu}
                    </span>
                  </div>
                )}

                {/* Mentor Doanh nghiệp */}
                <div className="pt-2">
                  <p className="text-[11px] font-bold uppercase text-gray-500 mb-2">
                    Người hướng dẫn tại doanh nghiệp (Mentor DN)
                  </p>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-800">{mentor?.HoTen || 'Chưa cập nhật'}</span>
                    </div>
                    {mentor?.SoDienThoai && (
                      <p className="text-gray-600 flex items-center gap-1.5 text-[11px]">
                        <Phone size={13} className="text-gray-400" />
                        {mentor.SoDienThoai}
                      </p>
                    )}
                    {mentor?.Email && (
                      <p className="text-gray-600 flex items-center gap-1.5 text-[11px]">
                        <EnvelopeSimple size={13} className="text-gray-400" />
                        {mentor.Email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400">
                <p className="text-xs">Sinh viên chưa khai báo thông tin công ty thực tập (Bước 2).</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
