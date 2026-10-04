'use client';

import React from 'react';
import { UserSession } from '@/types/database.types';
import { UserFocus, UploadSimple, FilePdf } from '@phosphor-icons/react';

interface Step1ProfileFormProps {
  currentUser: UserSession;
  coVanHocTap: string;
  setCoVanHocTap: (val: string) => void;
  diemGPA: string;
  setDiemGPA: (val: string) => void;
  viTriDuKien: string;
  setViTriDuKien: (val: string) => void;
  nangLucChuyenMon: string;
  setNangLucChuyenMon: (val: string) => void;
  trinhDoNgoaiNgu: string;
  setTrinhDoNgoaiNgu: (val: string) => void;
  diaChiHoKhau: string;
  setDiaChiHoKhau: (val: string) => void;
  diaChiHienTai: string;
  setDiaChiHienTai: (val: string) => void;
  fileCV: string;
  onFileCVChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  commit1: boolean;
  setCommit1: (val: boolean) => void;
  commit2: boolean;
  setCommit2: (val: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  disabled?: boolean;
}

export const Step1ProfileForm: React.FC<Step1ProfileFormProps> = ({
  currentUser,
  coVanHocTap,
  setCoVanHocTap,
  diemGPA,
  setDiemGPA,
  viTriDuKien,
  setViTriDuKien,
  nangLucChuyenMon,
  setNangLucChuyenMon,
  trinhDoNgoaiNgu,
  setTrinhDoNgoaiNgu,
  diaChiHoKhau,
  setDiaChiHoKhau,
  diaChiHienTai,
  setDiaChiHienTai,
  fileCV,
  onFileCVChange,
  commit1,
  setCommit1,
  commit2,
  setCommit2,
  onSubmit,
  disabled = false,
}) => {
  return (
    <form onSubmit={onSubmit} className="bg-white p-5 rounded-xl shadow-xs border border-gray-200 space-y-5">
      <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-huit-blue flex items-center justify-center font-bold text-sm">
          1
        </div>
        <div>
          <h3 className="font-bold text-sm text-gray-800">
            Bước 1: Kê khai hồ sơ năng lực cá nhân (HoSoThucTap)
          </h3>
          <p className="text-xs text-gray-500">
            Bắt buộc cho mọi sinh viên. Thông tin được dùng để xét điều kiện thực tập tốt nghiệp.
          </p>
        </div>
      </div>

      {/* Thông tin cố định sinh viên */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 p-3.5 bg-gray-50 rounded-xl text-xs">
        <div>
          <span className="text-gray-500 block font-medium">Họ và tên:</span>
          <span className="font-bold text-gray-800">{currentUser.hoTen}</span>
        </div>
        <div>
          <span className="text-gray-500 block font-medium">Mã số sinh viên:</span>
          <span className="font-bold text-gray-800 font-mono">{currentUser.mssv || '31201024426'}</span>
        </div>
        <div>
          <span className="text-gray-500 block font-medium">Chuyên ngành đào tạo:</span>
          <span className="font-bold text-huit-blue">{currentUser.chuyenNganh || 'Kỹ thuật phần mềm'}</span>
        </div>
      </div>

      {/* Trường kê khai */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Cố vấn học tập (CVHT) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={coVanHocTap}
            onChange={(e) => setCoVanHocTap(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-1 focus:ring-huit-blue outline-none"
            placeholder="Họ tên CVHT..."
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Điểm GPA tích lũy <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={diemGPA}
            onChange={(e) => setDiemGPA(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold font-mono focus:bg-white focus:ring-1 focus:ring-huit-blue outline-none"
            placeholder="Ví dụ: 2.84"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Vị trí thực tập dự kiến <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={viTriDuKien}
            onChange={(e) => setViTriDuKien(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-1 focus:ring-huit-blue outline-none"
            placeholder="Backend / Frontend / Data..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Năng lực chuyên môn nổi bật <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            required
            value={nangLucChuyenMon}
            onChange={(e) => setNangLucChuyenMon(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-1 focus:ring-huit-blue outline-none"
            placeholder="Công nghệ, kỹ năng lập trình, kinh nghiệm dự án..."
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Trình độ ngoại ngữ <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            required
            value={trinhDoNgoaiNgu}
            onChange={(e) => setTrinhDoNgoaiNgu(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-1 focus:ring-huit-blue outline-none"
            placeholder="Chứng chỉ TOEIC / IELTS / Khả năng đọc hiểu tài liệu..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Địa chỉ thường trú (Hộ khẩu) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={diaChiHoKhau}
            onChange={(e) => setDiaChiHoKhau(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-1 focus:ring-huit-blue outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Địa chỉ hiện tại (Tạm trú / Nhà trọ) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={diaChiHienTai}
            onChange={(e) => setDiaChiHienTai(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-1 focus:ring-huit-blue outline-none"
          />
        </div>
      </div>

      {/* Upload CV PDF */}
      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1">
          Hồ sơ CV cá nhân (.PDF) <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <label className={`px-4 py-2 bg-blue-50 hover:bg-blue-100 text-huit-blue font-bold text-xs rounded-lg border border-blue-200 transition flex items-center gap-2 cursor-pointer ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <UploadSimple size={16} weight="bold" />
            <span>Tải lên tệp CV PDF</span>
            <input
              type="file"
              accept=".pdf"
              onChange={onFileCVChange}
              disabled={disabled}
              className="hidden"
            />
          </label>
          {fileCV && (
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
              <FilePdf size={16} weight="fill" className="text-rose-600" />
              <span className="truncate max-w-xs">{fileCV}</span>
            </div>
          )}
        </div>
        <p className="text-[11px] text-gray-400 mt-1">
          Lưu trữ bảo mật trong hệ thống lưu trữ private-uploads của Supabase.
        </p>
      </div>

      {/* Cam kết */}
      <div className="space-y-2 p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-amber-900">
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={commit1}
            onChange={(e) => setCommit1(e.target.checked)}
            disabled={disabled}
            className="mt-0.5 rounded text-huit-blue focus:ring-huit-blue"
          />
          <span>
            Tôi cam kết các thông tin kê khai hồ sơ năng lực cá nhân ở trên là hoàn toàn chính xác và chịu trách nhiệm trước Khoa.
          </span>
        </label>
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={commit2}
            onChange={(e) => setCommit2(e.target.checked)}
            disabled={disabled}
            className="mt-0.5 rounded text-huit-blue focus:ring-huit-blue"
          />
          <span>
            Tôi cam kết chấp hành nghiêm túc quy chế thực tập tốt nghiệp của Trường Đại học Công Thương TP.HCM (HUIT).
          </span>
        </label>
      </div>

      {!disabled && (
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 bg-huit-blue hover:bg-[#002244] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2"
          >
            <UserFocus size={16} weight="bold" />
            <span>LƯU HỒ SƠ BƯỚC 1 & MỞ KHÓA BƯỚC 2</span>
          </button>
        </div>
      )}
    </form>
  );
};
