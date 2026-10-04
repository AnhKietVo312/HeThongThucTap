'use client';

import React, { useState } from 'react';
import { Modal } from '@/shared/ui/Modal';
import { Briefcase, UserGear } from '@phosphor-icons/react';

interface AddJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (jobData: {
    tieuDe: string;
    soLuong: number;
    moTa: string;
    yeuCau: string;
    hanNop: string;
    mentorTen: string;
    mentorSdt: string;
    mentorEmail: string;
  }) => Promise<void> | void;
}

export const AddJobModal: React.FC<AddJobModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [newTieuDe, setNewTieuDe] = useState('');
  const [newSoLuong, setNewSoLuong] = useState(3);
  const [newMoTa, setNewMoTa] = useState('');
  const [newYeuCau, setNewYeuCau] = useState('');
  const [newHanNop, setNewHanNop] = useState('2026-06-30');
  const [newMentorTen, setNewMentorTen] = useState('Lê Hoàng Nam');
  const [newMentorSdt, setNewMentorSdt] = useState('0908112233');
  const [newMentorEmail, setNewMentorEmail] = useState('namlh@fsoft.com.vn');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTieuDe.trim() || !newMoTa.trim()) {
      alert('Vui lòng nhập đầy đủ tiêu đề và mô tả công việc tuyển dụng!');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        tieuDe: newTieuDe,
        soLuong: newSoLuong,
        moTa: newMoTa,
        yeuCau: newYeuCau,
        hanNop: newHanNop,
        mentorTen: newMentorTen,
        mentorSdt: newMentorSdt,
        mentorEmail: newMentorEmail,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ĐĂNG TIN TUYỂN DỤNG THỰC TẬP MỚI"
      subtitle="Thông tin sẽ được gửi đến Khoa CNTT phê duyệt trước khi công khai lên Sàn tuyển dụng nội bộ"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Tiêu đề vị trí tuyển dụng <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newTieuDe}
              onChange={(e) => setNewTieuDe(e.target.value)}
              placeholder="Ví dụ: Thực tập sinh Backend Node.js / Fullstack Web..."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-1 focus:ring-sky-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Số lượng tuyển (SV) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              max={50}
              required
              value={newSoLuong}
              onChange={(e) => setNewSoLuong(parseInt(e.target.value, 10) || 1)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold font-mono focus:bg-white focus:ring-1 focus:ring-sky-600 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Mô tả công việc & Trách nhiệm <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            required
            value={newMoTa}
            onChange={(e) => setNewMoTa(e.target.value)}
            placeholder="Nội dung công việc, công nghệ áp dụng, môi trường thực tập..."
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-1 focus:ring-sky-600 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Yêu cầu đối với ứng viên
            </label>
            <textarea
              rows={2}
              value={newYeuCau}
              onChange={(e) => setNewYeuCau(e.target.value)}
              placeholder="Kỹ năng, ngoại ngữ, thái độ..."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-1 focus:ring-sky-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Hạn nộp hồ sơ <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={newHanNop}
              onChange={(e) => setNewHanNop(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-1 focus:ring-sky-600 outline-none"
            />
          </div>
        </div>

        {/* Khối nhập Mentor phụ trách trực tiếp */}
        <div className="p-3.5 bg-sky-50/60 rounded-xl border border-sky-200 space-y-2.5">
          <div className="flex items-center gap-1.5 text-sky-900 font-bold text-xs">
            <UserGear size={16} weight="bold" />
            <span>Cán bộ Mentor phụ trách vị trí này (Tự động lưu vào hệ thống)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Họ tên Mentor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newMentorTen}
                onChange={(e) => setNewMentorTen(e.target.value)}
                placeholder="Lê Hoàng Nam..."
                className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium outline-none focus:ring-1 focus:ring-sky-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Số điện thoại Mentor <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={newMentorSdt}
                onChange={(e) => setNewMentorSdt(e.target.value)}
                placeholder="0908112233"
                className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium outline-none focus:ring-1 focus:ring-sky-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Email Mentor <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={newMentorEmail}
                onChange={(e) => setNewMentorEmail(e.target.value)}
                placeholder="namlh@company.com"
                className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium outline-none focus:ring-1 focus:ring-sky-600"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-sky-700 hover:bg-sky-800 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <Briefcase size={16} weight="bold" />
            <span>{isSubmitting ? 'Đang gửi...' : 'Gửi Khoa xét duyệt Job'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
