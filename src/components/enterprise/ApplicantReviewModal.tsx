'use client';

import React, { useState } from 'react';
import { Modal } from '@/shared/ui/Modal';
import { DangKyThucTap } from '@/types/database.types';
import { FilePdf, CheckCircle, XCircle, ArrowSquareOut, Clock } from '@phosphor-icons/react';

interface ApplicantReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  registration: DangKyThucTap | null;
  onReview: (registrationId: number, action: 'Duyet' | 'TuChoi', reason?: string) => Promise<void> | void;
  currentApprovedCount: number;
  maxQuota: number;
}

export const ApplicantReviewModal: React.FC<ApplicantReviewModalProps> = ({
  isOpen,
  onClose,
  registration,
  onReview,
  currentApprovedCount,
  maxQuota,
}) => {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!registration) return null;

  const isFull = currentApprovedCount >= maxQuota;
  const isAlreadyApproved = registration.TrangThaiDangKy === 'DaDuyet';

  const handleApprove = async () => {
    if (isFull) {
      alert(`Vị trí này đã tuyển đủ ${currentApprovedCount}/${maxQuota} sinh viên. Không thể duyệt thêm!`);
      return;
    }
    try {
      setIsProcessing(true);
      await onReview(registration.Id, 'Duyet');
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsProcessing(true);
      await onReview(registration.Id, 'TuChoi', rejectReason);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const cvFileName = registration.hoSoThucTap?.DuongDanCV || `CV_${registration.sinhVien?.Mssv}.pdf`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="XÉT DUYỆT HỒ SƠ ỨNG VIÊN THỰC TẬP"
      subtitle={`Ứng tuyển vị trí: ${registration.ViTriPhanCong || 'Thực tập sinh'} • Trạng thái: ${registration.TrangThaiDangKy}`}
      maxWidth="3xl"
    >
      <div className="space-y-4 text-xs">
        {/* Quota Alert */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
          <div>
            <span className="font-bold text-gray-700">Chỉ tiêu vị trí: </span>
            <span className="font-mono font-bold text-sky-800">
              {currentApprovedCount} / {maxQuota} sinh viên đã duyệt
            </span>
          </div>
          {isFull && (
            <span className="px-2.5 py-1 bg-rose-50 text-rose-700 font-bold rounded-lg border border-rose-200">
              ĐÃ ĐỦ CHỈ TIÊU TUYỂN
            </span>
          )}
        </div>

        {/* Thông tin ứng viên */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 bg-sky-50/50 rounded-xl border border-sky-100">
          <div>
            <span className="text-gray-500 block">Họ và tên sinh viên:</span>
            <span className="font-bold text-gray-900 text-sm">{registration.sinhVien?.HoTen}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Mã số sinh viên:</span>
            <span className="font-bold text-gray-900 font-mono">{registration.sinhVien?.Mssv}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Lớp / Chuyên ngành:</span>
            <span className="font-semibold text-gray-800">
              {registration.sinhVien?.Lop} • {registration.sinhVien?.ChuyenNganh}
            </span>
          </div>
          <div>
            <span className="text-gray-500 block">Điểm GPA tích lũy:</span>
            <span className="font-bold text-emerald-700 font-mono">
              {registration.hoSoThucTap?.DiemGPA ?? '2.84'} / 4.0
            </span>
          </div>
        </div>

        {/* CV Link & Chuyên môn */}
        <div className="space-y-2">
          <div>
            <span className="font-bold text-gray-700 block mb-1">Năng lực chuyên môn:</span>
            <p className="p-2.5 bg-gray-50 rounded-lg text-gray-800 leading-relaxed border border-gray-100">
              {registration.hoSoThucTap?.NangLucChuyenMon || 'Thành thạo ReactJS, TypeScript, Node.js, Git.'}
            </p>
          </div>

          <div>
            <span className="font-bold text-gray-700 block mb-1">Trình độ ngoại ngữ:</span>
            <p className="p-2.5 bg-gray-50 rounded-lg text-gray-800 border border-gray-100">
              {registration.hoSoThucTap?.TrinhDoNgoaiNgu || 'TOEIC 650 (Đọc hiểu tài liệu kỹ thuật tốt)'}
            </p>
          </div>

          <div>
            <span className="font-bold text-gray-700 block mb-1">Tệp CV ứng tuyển đính kèm:</span>
            <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl shadow-xs">
              <div className="flex items-center gap-2">
                <FilePdf size={22} weight="fill" className="text-rose-600" />
                <div>
                  <span className="font-bold text-gray-800 block truncate max-w-xs">{cvFileName}</span>
                  <span className="text-[10px] text-gray-400">Định dạng Adobe PDF • Lưu trữ private-uploads</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  window.open(`/api/storage/signed-url?path=${encodeURIComponent(cvFileName)}`, '_blank');
                }}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-huit-blue font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer border border-blue-200"
              >
                <span>Xem tệp CV</span>
                <ArrowSquareOut size={14} weight="bold" />
              </button>
            </div>
          </div>
        </div>

        {/* Khung lý do từ chối nếu bấm từ chối */}
        {showRejectInput && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
            <label className="block font-bold text-rose-800">
              Lý do từ chối hồ sơ ứng viên:
            </label>
            <textarea
              rows={2}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Chưa phù hợp với yêu cầu công nghệ của dự án hiện tại..."
              className="w-full px-3 py-1.5 bg-white border border-rose-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-rose-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRejectInput(false)}
                className="px-3 py-1 bg-white text-gray-600 rounded-lg border border-gray-200 text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleReject}
                className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition cursor-pointer"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
          >
            Đóng
          </button>

          {!isAlreadyApproved && !showRejectInput && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowRejectInput(true)}
                className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition cursor-pointer flex items-center gap-1.5"
              >
                <XCircle size={16} weight="bold" />
                <span>Từ chối CV</span>
              </button>

              <button
                type="button"
                disabled={isFull || isProcessing}
                onClick={handleApprove}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:pointer-events-none rounded-lg transition cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle size={16} weight="bold" />
                <span>{isProcessing ? 'Đang xử lý...' : 'Duyệt trúng tuyển (DaDuyet)'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
