'use client';

import React, { useState } from 'react';
import { Modal } from '@/shared/ui/Modal';
import { DangKyThucTap } from '@/types/database.types';
import { Star, CheckCircle } from '@phosphor-icons/react';

interface InternEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  registration: DangKyThucTap | null;
  onSaveEvaluation: (
    regId: number,
    scores: Array<{ tieuChiId: number; diemDanhGia: number; nhanXetTieuChi?: string }>,
    nhanXetChung: string
  ) => Promise<void> | void;
}

export const InternEvaluationModal: React.FC<InternEvaluationModalProps> = ({
  isOpen,
  onClose,
  registration,
  onSaveEvaluation,
}) => {
  const [scoreClo41, setScoreClo41] = useState(1.9); // max 2.0
  const [scoreClo42, setScoreClo42] = useState(2.9); // max 3.0
  const [reviewNote, setReviewNote] = useState(
    'Sinh viên chấp hành rất nghiêm túc nội quy công ty, hòa nhập nhanh với văn hóa doanh nghiệp và hoàn thành tốt công việc được giao.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!registration) return null;

  const totalScore = parseFloat((scoreClo41 + scoreClo42).toFixed(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalScore > 5.0) {
      alert(`Tổng điểm đánh giá của doanh nghiệp không được vượt quá 5.0 (Hiện tại: ${totalScore})!`);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSaveEvaluation(
        registration.Id,
        [
          { tieuChiId: 1, diemDanhGia: scoreClo41, nhanXetTieuChi: 'Ý thức tổ chức kỷ luật và thái độ làm việc' },
          { tieuChiId: 2, diemDanhGia: scoreClo42, nhanXetTieuChi: 'Năng lực chuyên môn và mức độ hoàn thành công việc' },
        ],
        reviewNote
      );
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="PHIẾU NHẬN XÉT & ĐÁNH GIÁ THỰC TẬP SINH"
      subtitle={`Sinh viên: ${registration.sinhVien?.HoTen} (${registration.sinhVien?.Mssv}) • Đơn vị: Khoa CNTT - HUIT`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-sky-900 leading-relaxed">
          <p className="font-semibold">
            Doanh nghiệp tiếp nhận đánh giá tối đa <strong>5.0 điểm</strong> (Thang 10 tổng hợp: Doanh nghiệp 5.0đ + Giảng viên hướng dẫn 5.0đ).
          </p>
        </div>

        {/* Tiêu chí 1: CLO 4.1 */}
        <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-900 text-xs">
              1. Tiêu chí CLO4.1: Ý thức kỷ luật, tác phong & thái độ
            </span>
            <span className="text-[11px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded font-mono">
              Tối đa: 2.0 điểm
            </span>
          </div>
          <p className="text-[11px] text-gray-500">
            Chấp hành nội quy, giờ giấc làm việc, tinh thần trách nhiệm và tương tác với đồng nghiệp.
          </p>
          <div className="flex items-center gap-3 pt-1">
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={scoreClo41}
              onChange={(e) => setScoreClo41(parseFloat(e.target.value))}
              className="flex-1 accent-sky-700 cursor-pointer"
            />
            <span className="font-mono font-bold text-base text-sky-900 w-12 text-right">
              {scoreClo41.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Tiêu chí 2: CLO 4.2 */}
        <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-900 text-xs">
              2. Tiêu chí CLO4.2: Năng lực chuyên môn & Kỹ năng làm việc
            </span>
            <span className="text-[11px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded font-mono">
              Tối đa: 3.0 điểm
            </span>
          </div>
          <p className="text-[11px] text-gray-500">
            Khả năng nắm bắt công nghệ, giải quyết công việc và chất lượng sản phẩm được giao.
          </p>
          <div className="flex items-center gap-3 pt-1">
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={scoreClo42}
              onChange={(e) => setScoreClo42(parseFloat(e.target.value))}
              className="flex-1 accent-sky-700 cursor-pointer"
            />
            <span className="font-mono font-bold text-base text-sky-900 w-12 text-right">
              {scoreClo42.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Tổng điểm Doanh nghiệp */}
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
          <span className="font-bold text-emerald-900">
            TỔNG ĐIỂM DOANH NGHIỆP ĐÁNH GIÁ (MAX 5.0):
          </span>
          <span className="font-mono font-black text-xl text-emerald-800">
            {totalScore.toFixed(2)} / 5.00
          </span>
        </div>

        {/* Nhận xét chung */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Nhận xét chung của Cán bộ hướng dẫn / Doanh nghiệp <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            required
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:bg-white focus:ring-1 focus:ring-sky-600"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-sky-700 hover:bg-sky-800 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <CheckCircle size={16} weight="bold" />
            <span>{isSubmitting ? 'Đang lưu...' : 'Lưu & Gửi đánh giá cho Khoa'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
