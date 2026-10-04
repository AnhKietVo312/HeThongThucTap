'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { StudentUnifiedView } from '@/views/student/StudentUnifiedView';
import { AdminUnifiedView } from '@/views/admin/AdminUnifiedView';
import { LecturerUnifiedView } from '@/views/lecturer/LecturerUnifiedView';
import { EnterpriseView } from '@/views/enterprise/EnterpriseView';
import { CheckCircle } from '@phosphor-icons/react';
import { Modal } from '@/shared/ui/Modal';
import { NewsActivityView } from '@/shared/ui/NewsActivityView';

export default function Home() {
  const { currentUser, login, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('sv-register');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dialogMessage, setDialogMessage] = useState<string | null>(null);

  // Set default active tab whenever user changes role
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === 'SinhVien') {
      setActiveTab('sv-register');
    } else if (currentUser.role === 'QuanTriVien') {
      setActiveTab('admin-approve');
    } else if (currentUser.role === 'DoanhNghiep') {
      setActiveTab('dn-jobs');
    } else {
      setActiveTab('gv-my-students');
    }
  }, [currentUser]);

  const showToast = useCallback((msg: string) => {
    const isSuccess = msg.startsWith('✓') || msg.startsWith('Đã ') || msg.includes('thành công');
    if (isSuccess || msg.startsWith('Đã ') || msg.startsWith('✓') || msg.includes('thành công')) {
      setDialogMessage(null);
      setToastMessage(msg);
    } else {
      setToastMessage(null);
      setDialogMessage(msg);
    }
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // VIEW 1: TRANG ĐĂNG NHẬP DUY NHẤT (AUTO DETECT)
  if (!currentUser) {
    return (
      <main className="flex h-screen w-full overflow-hidden bg-white antialiased">
        {/* Nửa trái: Background tòa nhà HUIT & Brand info */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-huit-blue overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
            alt="HUIT Building"
            className="absolute inset-0 w-full h-full object-cover opacity-70 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-huit-blue/95 via-huit-blue/65 to-transparent" />

          <div className="relative z-10 flex flex-col justify-end p-8 lg:p-12 text-white pb-14 fade-in">
            {/* Logo trường HUIT trên banner */}
            <div className="mb-6 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white p-2 shadow-xl flex items-center justify-center">
                <Image
                  src="/logo-circle.png"
                  alt="Logo HUIT"
                  width={52}
                  height={52}
                  className="object-contain"
                  priority
                />
              </div>
              <div className="w-1 h-14 bg-huit-red rounded-full" />
            </div>

            <h1 className="text-3xl lg:text-4xl font-black mb-3 tracking-tight leading-tight">
              Hệ thống Quản lý<br />
              <span className="text-white">Thực tập Doanh nghiệp</span>
            </h1>
            <p className="text-sm lg:text-base text-blue-100 max-w-lg leading-relaxed">
              Cổng dịch vụ trực tuyến kết nối Khoa Công nghệ Thông tin, Giảng viên hướng dẫn và Sinh viên — Trường Đại học Công Thương TP.HCM (HUIT).
            </p>
            <div className="mt-6 flex items-center gap-2.5 text-xs text-blue-200">
              <span className="px-3 py-1 bg-white/10 rounded-lg font-semibold border border-white/15">
                Tự động
              </span>
              <span>•</span>
              <span className="px-3 py-1 bg-white/10 rounded-lg font-semibold border border-white/15">
                Đồng bộ dữ liệu
              </span>
            </div>
          </div>
        </div>

        {/* Nửa phải: Form đăng nhập kích thước vừa vặn, gọn gàng */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 lg:p-10 xl:p-12 bg-white overflow-y-auto">
          <LoginForm onLogin={login} />
        </div>
      </main>
    );
  }

  // VIEW 2: DASHBOARD CHUNG THEO BỐ CỤC CHUẨN (SIDEBAR + HEADER + VIEWPORT)
  return (
    <div className="h-screen w-full overflow-hidden flex bg-gray-50 antialiased">
      {/* SIDEBAR BÊN TRÁI */}
      <AppSidebar
        currentUser={currentUser}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={logout}
      />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* HEADER TOP BAR (KHÔNG CÓ NÚT ĐỔI NHANH ROLE) */}
        <AppHeader currentUser={currentUser} />

        {/* DYNAMIC VIEWPORT BODY */}
        <div id="app-viewport-body" className="flex-1 overflow-y-auto p-4 lg:p-6 relative">
          {(activeTab === 'shared-news' || activeTab === 'shared-activity') ? (
            <NewsActivityView activeTab={activeTab} currentUser={currentUser} showToast={showToast} />
          ) : null}

          {activeTab !== 'shared-news' && activeTab !== 'shared-activity' && currentUser.role === 'SinhVien' && (
            <StudentUnifiedView
              currentUser={currentUser}
              activeTab={activeTab}
              onNavigateTab={setActiveTab}
              showToast={showToast}
            />
          )}

          {activeTab !== 'shared-news' && activeTab !== 'shared-activity' && currentUser.role === 'QuanTriVien' && (
            <AdminUnifiedView
              currentUser={currentUser}
              activeTab={activeTab}
              onNavigateTab={setActiveTab}
              showToast={showToast}
            />
          )}

          {activeTab !== 'shared-news' && activeTab !== 'shared-activity' && currentUser.role === 'DoanhNghiep' && (
            <EnterpriseView
              currentUser={currentUser}
              activeTab={activeTab}
              onNavigateTab={setActiveTab}
              showToast={showToast}
            />
          )}

          {activeTab !== 'shared-news' && activeTab !== 'shared-activity' && currentUser.role === 'GiangVien' && (
            <LecturerUnifiedView
              currentUser={currentUser}
              activeTab={activeTab}
              onNavigateTab={setActiveTab}
              showToast={showToast}
            />
          )}
        </div>
      </main>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2.5 animate-bounce">
          <CheckCircle size={20} className="text-emerald-400" weight="fill" />
          <span>{toastMessage}</span>
        </div>
      )}

      <Modal
        isOpen={Boolean(dialogMessage)}
        onClose={() => setDialogMessage(null)}
        title="Thông báo"
        maxWidth="md"
        footer={(
          <button
            type="button"
            onClick={() => setDialogMessage(null)}
            className="rounded-lg bg-huit-blue px-4 py-2 text-sm font-semibold text-white hover:bg-[#002244]"
          >
            Đóng
          </button>
        )}
      >
        <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">{dialogMessage}</p>
      </Modal>
    </div>
  );
}
