'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Modal } from '@/shared/ui/Modal';
import {
  EnvelopeSimple,
  LockKey,
  ArrowRight,
  Student,
  Buildings,
  ChalkboardTeacher,
  IdentificationBadge,
  Hash,
  CircleNotch,
} from '@phosphor-icons/react';

interface LoginFormProps {
  onLogin: (
    type: 'sinhvien' | 'doanhnghiep' | 'giangvien',
    identifier: string,
    password?: string
  ) => Promise<unknown>;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<'sinhvien' | 'doanhnghiep' | 'giangvien'>('sinhvien');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Input states per tab
  const [svEmail, setSvEmail] = useState('');
  const [svPassword, setSvPassword] = useState('');

  const [dnTaxCode, setDnTaxCode] = useState('');
  const [dnPassword, setDnPassword] = useState('');

  const [gvCode, setGvCode] = useState('');
  const [gvPassword, setGvPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      if (activeTab === 'sinhvien') {
        await onLogin('sinhvien', svEmail, svPassword);
      } else if (activeTab === 'doanhnghiep') {
        await onLogin('doanhnghiep', dnTaxCode, dnPassword);
      } else {
        await onLogin('giangvien', gvCode, gvPassword);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[460px] md:max-w-[480px] lg:max-w-[500px] fade-in">
      {/* Logo HUIT từ folder public */}
      <div className="flex items-center gap-3.5 mb-5">
        <div className="relative w-16 h-16 shrink-0 rounded-2xl bg-white p-1.5 border border-gray-200 shadow-sm flex items-center justify-center overflow-hidden">
          <Image
            src="/logo-circle.png"
            alt="HUIT Logo Emblem"
            width={48}
            height={48}
            className="object-contain"
            priority
          />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-huit-blue tracking-tight">
              HUIT<span className="text-huit-red">.INTERN</span>
            </span>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-blue-50 text-huit-blue border border-blue-200">
              v1.0
            </span>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mt-1">
            Khoa Công nghệ Thông tin
          </p>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Đăng nhập hệ thống</h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-relaxed">
          Cổng thông tin tích hợp theo phân quyền 3 nhóm đối tượng độc lập.
        </p>
      </div>

      {/* 3 TABS ĐĂNG NHẬP ĐỘC LẬP */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-100 rounded-2xl mb-4 text-xs font-bold">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => { setErrorMessage(null); setActiveTab('sinhvien'); }}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl transition cursor-pointer ${
            activeTab === 'sinhvien'
              ? 'bg-white text-huit-blue shadow-xs font-extrabold'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Student size={17} weight={activeTab === 'sinhvien' ? 'fill' : 'bold'} />
          <span>Sinh viên</span>
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => { setErrorMessage(null); setActiveTab('doanhnghiep'); }}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl transition cursor-pointer ${
            activeTab === 'doanhnghiep'
              ? 'bg-white text-huit-blue shadow-xs font-extrabold'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Buildings size={17} weight={activeTab === 'doanhnghiep' ? 'fill' : 'bold'} />
          <span>Doanh nghiệp</span>
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => { setErrorMessage(null); setActiveTab('giangvien'); }}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl transition cursor-pointer ${
            activeTab === 'giangvien'
              ? 'bg-white text-huit-blue shadow-xs font-extrabold'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <ChalkboardTeacher size={17} weight={activeTab === 'giangvien' ? 'fill' : 'bold'} />
          <span>Giảng viên / Khoa</span>
        </button>
      </div>

      {/* TAB 1: SINH VIÊN */}
      {activeTab === 'sinhvien' && (
        <div className="space-y-4">
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-huit-blue">
            <p className="font-semibold">
              Sinh viên đăng nhập bằng mã số sinh viên (MSSV) được cấp.
            </p>
          </div>

          <form onSubmit={handleSubmit} aria-busy={isSubmitting} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Tên đăng nhập (mã số sinh viên)
              </label>
              <div className="relative">
                <EnvelopeSimple className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} weight="bold" />
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  disabled={isSubmitting}
                  placeholder="Ví dụ: 2001230348"
                  value={svEmail}
                  onChange={(e) => setSvEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-huit-blue/20 focus:border-huit-blue outline-none text-xs sm:text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">Mật khẩu</label>
                <span
                  onClick={() => alert('Vui lòng liên hệ Phòng Đào tạo / Giáo vụ Khoa để đặt lại mật khẩu email.')}
                  className="text-[11px] font-semibold text-huit-blue hover:underline cursor-pointer"
                >
                  Quên mật khẩu?
                </span>
              </div>
              <div className="relative">
                <LockKey className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} weight="bold" />
                <input
                  type="password"
                  required
                  disabled={isSubmitting}
                  placeholder="••••••••"
                  value={svPassword}
                  onChange={(e) => setSvPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-huit-blue/20 focus:border-huit-blue outline-none text-xs sm:text-sm font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-5 bg-huit-blue hover:bg-[#002244] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isSubmitting ? <CircleNotch className="animate-spin" size={18} /> : <ArrowRight weight="bold" size={16} />}
              <span>{isSubmitting ? 'ĐANG ĐĂNG NHẬP...' : 'VÀO CỔNG THÔNG TIN SINH VIÊN'}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: DOANH NGHIỆP ĐỐI TÁC */}
      {activeTab === 'doanhnghiep' && (
        <div className="space-y-4">
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-huit-blue">
            <p className="font-semibold">
              Doanh nghiệp đăng nhập bằng mã số thuế và mật khẩu do Khoa cấp.
            </p>
          </div>

          <form onSubmit={handleSubmit} aria-busy={isSubmitting} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Tên đăng nhập (mã số thuế doanh nghiệp)
              </label>
              <div className="relative">
                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} weight="bold" />
                <input
                  type="text"
                  required
                  disabled={isSubmitting}
                  placeholder="0101248141"
                  value={dnTaxCode}
                  onChange={(e) => setDnTaxCode(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-huit-blue/20 focus:border-huit-blue outline-none text-xs sm:text-sm font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                  Mật khẩu (Mặc định: Mã số thuế)
                </label>
                <span
                  onClick={() => alert('Vui lòng liên hệ Trung tâm Hợp tác Doanh nghiệp - Khoa CNTT HUIT.')}
                  className="text-[11px] font-semibold text-huit-blue hover:underline cursor-pointer"
                >
                  Trợ giúp?
                </span>
              </div>
              <div className="relative">
                <LockKey className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} weight="bold" />
                <input
                  type="password"
                  required
                  disabled={isSubmitting}
                  placeholder="••••••••"
                  value={dnPassword}
                  onChange={(e) => setDnPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-huit-blue/20 focus:border-huit-blue outline-none text-xs sm:text-sm font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-5 bg-huit-blue hover:bg-[#002244] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isSubmitting ? <CircleNotch className="animate-spin" size={18} /> : <ArrowRight weight="bold" size={16} />}
              <span>{isSubmitting ? 'ĐANG ĐĂNG NHẬP...' : 'VÀO CỔNG DOANH NGHIỆP ĐỐI TÁC'}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: GIẢNG VIÊN & QUẢN TRỊ KHOA */}
      {activeTab === 'giangvien' && (
        <div className="space-y-4">
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-huit-blue leading-relaxed">
            <p className="font-semibold">
              Giảng viên và Quản trị Khoa sử dụng chung mã giảng viên. Hệ thống tự động kiểm tra cờ{' '}
              <strong>TruongKhoa</strong>: nếu là <strong className="text-huit-blue">TRUE</strong> sẽ vào Quản trị Khoa,{' '}
              <strong className="text-huit-blue">FALSE</strong> sẽ vào Cổng Giảng viên hướng dẫn.
            </p>
          </div>

          <form onSubmit={handleSubmit} aria-busy={isSubmitting} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Tên đăng nhập (mã giảng viên)
              </label>
              <div className="relative">
                <IdentificationBadge className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} weight="bold" />
                <input
                  type="text"
                  required
                  disabled={isSubmitting}
                  placeholder="GV001 hoặc 00123456"
                  value={gvCode}
                  onChange={(e) => setGvCode(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-huit-blue/20 focus:border-huit-blue outline-none text-xs sm:text-sm font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">Mật khẩu</label>
                <span
                  onClick={() => alert('Vui lòng liên hệ Văn phòng Khoa CNTT HUIT để được cấp lại mật khẩu giảng viên.')}
                  className="text-[11px] font-semibold text-huit-blue hover:underline cursor-pointer"
                >
                  Quên mật khẩu?
                </span>
              </div>
              <div className="relative">
                <LockKey className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} weight="bold" />
                <input
                  type="password"
                  required
                  disabled={isSubmitting}
                  placeholder="••••••••"
                  value={gvPassword}
                  onChange={(e) => setGvPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-huit-blue/20 focus:border-huit-blue outline-none text-xs sm:text-sm font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-5 bg-huit-blue hover:bg-[#002244] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isSubmitting ? <CircleNotch className="animate-spin" size={18} /> : <ArrowRight weight="bold" size={16} />}
              <span>{isSubmitting ? 'ĐANG ĐĂNG NHẬP...' : 'XÁC THỰC & ĐIỀU HƯỚNG TỰ ĐỘNG'}</span>
            </button>
          </form>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center gap-2 text-center text-xs text-gray-400">
        <Image src="/logo-circle.png" alt="Logo" width={20} height={20} className="opacity-80" />
        <span className="text-[11px]">&copy; 2026 Khoa CNTT - Trường Đại học Công Thương TP.HCM</span>
      </div>

      <Modal
        isOpen={Boolean(errorMessage)}
        onClose={() => setErrorMessage(null)}
        title="Đăng nhập không thành công"
        maxWidth="md"
        footer={(
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="rounded-lg bg-huit-blue px-4 py-2 text-sm font-semibold text-white hover:bg-[#002244]"
          >
            Đóng
          </button>
        )}
      >
        <p role="alert" className="whitespace-pre-wrap text-sm leading-6 text-gray-700">{errorMessage}</p>
      </Modal>
    </div>
  );
};

