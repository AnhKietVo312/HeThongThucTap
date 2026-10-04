'use client';

import React, { useEffect, useState } from 'react';
import { UserSession, DotThucTap, ThongBao } from '@/types/database.types';
import { batchService } from '@/features/batches/services/batchService';
import { Modal } from '@/shared/ui/Modal';
import { CaretDown, Bell, CheckCircle } from '@phosphor-icons/react';

interface AppHeaderProps {
  currentUser: UserSession;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ currentUser }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [batches, setBatches] = useState<DotThucTap[]>([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [notifications, setNotifications] = useState<ThongBao[]>([]);

  useEffect(() => {
    let active = true;
    void batchService.getBatches().then((rows) => {
      if (!active) return;
      setBatches(rows);
      if (rows[0]) setSelectedBatch(String(rows[0].Id));
    }).catch((error) => console.error('Could not load internship batches:', error));
    if (currentUser.nguoiDungId) {
      void fetch(`/api/notifications?nguoiDungId=${currentUser.nguoiDungId}`).then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not load notifications');
        if (active) setNotifications(result.data || []);
      }).catch((error) => console.error('Could not load notifications:', error));
    }
    return () => { active = false; };
  }, [currentUser.nguoiDungId]);

  const markNotificationsRead = async () => {
    if (!currentUser.nguoiDungId) return;
    const response = await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nguoiDungId: currentUser.nguoiDungId }) });
    if (!response.ok) return;
    setNotifications((items) => items.map((item) => ({ ...item, DaDoc: true })));
  };

  return (
    <>
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-5 lg:px-6 shrink-0 z-10 shadow-2xs">
        {/* Left: Đợt thực tập Selector */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="appearance-none bg-gray-50 border border-gray-200 text-gray-800 text-xs font-semibold py-1.5 pl-3 pr-8 rounded-lg focus:outline-none focus:border-huit-blue cursor-pointer shadow-2xs"
            >
              {batches.map((batch) => <option key={batch.Id} value={String(batch.Id)}>{batch.TenDot} ({batch.NamHoc})</option>)}
            </select>
            <CaretDown
              size={12}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
              weight="bold"
            />
          </div>
        </div>

        {/* Right: Notifications & Profile (NO quick role switch buttons) */}
        <div className="flex items-center gap-3.5">
          {/* Notification Button */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-full transition cursor-pointer relative"
              title="Thông báo hệ thống"
            >
              <Bell size={18} weight="bold" />
              {notifications.some((item) => !item.DaDoc) && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-huit-red ring-2 ring-white" />}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 py-2.5 z-50 fade-in">
                <div className="px-3.5 pb-2 border-b border-gray-100 flex items-center justify-between">
                  <h4 className="text-[11px] font-bold text-gray-800 uppercase tracking-wider">
                    Thông báo mới
                  </h4>
                  <span onClick={() => void markNotificationsRead()} className="text-[11px] text-huit-blue font-semibold cursor-pointer hover:underline">
                    Đánh dấu đã đọc
                  </span>
                </div>
                <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
                  {notifications.map((item) => (
                    <div
                      key={item.Id}
                      className="p-2.5 hover:bg-gray-50 transition cursor-pointer text-xs"
                    >
                      <p className="font-semibold text-gray-800 text-xs">{item.TieuDe}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
                        {item.NoiDung}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">{item.CreatedAt}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile Capsule */}
          <div
            onClick={() => setShowAccountModal(true)}
            className="flex items-center gap-2.5 pl-3 border-l border-gray-200 cursor-pointer group"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-gray-900 group-hover:text-huit-blue transition leading-tight">
                {currentUser.hoTen}
              </p>
              <p className="text-[10px] text-gray-400 font-medium leading-tight mt-0.5">
                {currentUser.subInfo || currentUser.role}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-100 text-huit-blue flex items-center justify-center font-bold text-xs shadow-xs group-hover:ring-2 group-hover:ring-huit-blue/30 transition">
              {currentUser.avatarChar || currentUser.hoTen.charAt(0)}
            </div>
          </div>
        </div>
      </header>

      {/* Account Info Modal */}
      <Modal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        title="Thông tin tài khoản HUIT"
        subtitle="Chi tiết hồ sơ xác thực và phân quyền RBAC trên hệ thống"
        maxWidth="md"
        footer={
          <button
            onClick={() => setShowAccountModal(false)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl cursor-pointer"
          >
            Đóng
          </button>
        }
      >
        <div className="space-y-3.5 text-xs">
          <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500 font-medium">Họ và tên:</span>
            <span className="font-bold text-gray-800">{currentUser.hoTen}</span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500 font-medium">Email trường cấp:</span>
            <span className="font-mono font-semibold text-gray-800">{currentUser.email}</span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500 font-medium">Vai trò hệ thống (Role):</span>
            <span className="font-bold text-huit-blue bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              {currentUser.role}
            </span>
          </div>
          {currentUser.role === 'GiangVien' && (
            <>
              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500 font-medium">Quyền tổ chức đợt:</span>
                <span
                  className={`font-bold ${
                    currentUser.coQuyenToChuc ? 'text-emerald-600' : 'text-gray-400'
                  }`}
                >
                  {currentUser.coQuyenToChuc ? '✓ ĐƯỢC PHÂN QUYỀN' : '✗ KHÔNG CÓ'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500 font-medium">Quyền xuất bảng điểm:</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle size={14} weight="bold" />
                  LUÔN BẬT (Mọi GVHD)
                </span>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
};
