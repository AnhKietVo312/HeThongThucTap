'use client';

import React from 'react';
import Image from 'next/image';
import { UserSession } from '@/types/database.types';
import {
  SquaresFour,
  CalendarPlus,
  Info,
  Notebook,
  FileText,
  User,
  FileMagnifyingGlass,
  UsersThree,
  Key,
  Database,
  ChartBar,
  Users,
  CheckSquareOffset,
  FileXls,
  SignOut,
  Briefcase,
  Star,
  UserGear,
  Newspaper,
  ClockCounterClockwise,
} from '@phosphor-icons/react';

interface AppSidebarProps {
  currentUser: UserSession;
  activeTab: string;
  onTabChange: (tabKey: string) => void;
  onLogout: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentUser,
  activeTab,
  onTabChange,
  onLogout,
}) => {
  const getRoleTag = () => {
    switch (currentUser.role) {
      case 'SinhVien':
        return {
          text: 'Sinh viên',
          className: 'text-huit-blue',
        };
      case 'QuanTriVien':
        return {
          text: 'Quản trị Khoa',
          className: 'text-huit-red',
        };
      case 'DoanhNghiep':
        return {
          text: 'Doanh nghiệp đối tác',
          className: 'text-sky-700',
        };
      case 'GiangVien':
        if (currentUser.coQuyenToChuc) {
          return {
            text: 'GV Tổ chức đợt',
            className: 'text-emerald-700',
          };
        }
        return {
          text: 'Giảng viên (GVHD)',
          className: 'text-gray-500',
        };
      default:
        return {
          text: currentUser.role,
          className: 'text-gray-500',
        };
    }
  };

  const roleTag = getRoleTag();

  const renderNavItem = (
    key: string,
    icon: React.ReactNode,
    label: string,
    badge?: string
  ) => {
    const isActive = activeTab === key;
    return (
      <button
        key={key}
        type="button"
        onClick={() => onTabChange(key)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition font-medium text-left cursor-pointer ${
          isActive
            ? 'bg-blue-50 text-huit-blue font-bold shadow-2xs'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <span className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="text-base shrink-0">{icon}</span>
          <span className="text-xs font-semibold whitespace-nowrap">{label}</span>
        </span>
        {badge && (
          <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold whitespace-nowrap shrink-0 ml-2">
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside className="w-64 flex flex-col h-full shrink-0 z-20 border-r border-gray-200 bg-white">
      {/* Sidebar Header Brand with Logo trường HUIT từ public */}
      <div className="h-16 flex items-center px-4 border-b border-gray-100 gap-3">
        <div className="w-10 h-10 rounded-xl bg-white p-1 border border-gray-200 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
          <Image
            src="/logo-circle.png"
            alt="Logo HUIT"
            width={32}
            height={32}
            className="object-contain"
            priority
          />
        </div>
        <div className="overflow-hidden">
          <span className="text-base font-black text-huit-blue tracking-tight leading-none block">
            HUIT<span className="text-huit-red">.INTERN</span>
          </span>
          <p
            className={`text-[9.5px] font-bold uppercase tracking-wider leading-none mt-1.5 ${roleTag.className}`}
          >
            {roleTag.text}
          </p>
        </div>
      </div>

      {/* Dynamic Navigation Menu */}
      <nav className="flex-1 py-3 px-2.5 space-y-0.5 overflow-y-auto">
        {currentUser.role === 'SinhVien' && (
          <>
            <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Học phần TTTN
            </p>
            {renderNavItem('sv-overview', <SquaresFour size={18} weight="bold" />, 'Tổng quan')}
            {renderNavItem(
              'sv-register',
              <CalendarPlus size={18} weight="bold" />,
              'Đăng ký đợt thực tập',
              '2 bước'
            )}
            {renderNavItem('sv-info', <Info size={18} weight="bold" />, 'Thông tin thực tập')}
            {renderNavItem('sv-diary', <Notebook size={18} weight="bold" />, 'Nhật ký công việc')}
            {renderNavItem('sv-report', <FileText size={18} weight="bold" />, 'Báo cáo & Kết quả')}
            {renderNavItem('sv-profile', <User size={18} weight="bold" />, 'Hồ sơ cá nhân')}
          </>
        )}

        {currentUser.role === 'QuanTriVien' && (
          <>
            <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Xét duyệt & Phân bổ
            </p>
            {renderNavItem('admin-approve', <FileMagnifyingGlass size={18} weight="bold" />, 'Duyệt hồ sơ ngoài')}
            {renderNavItem('admin-jobs', <Briefcase size={18} weight="bold" />, 'Kiểm duyệt tuyển dụng DN', 'Sàn')}
            {renderNavItem('admin-assign', <UsersThree size={18} weight="bold" />, 'Phân công GVHD (Max 30)')}

            <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 mt-3.5">
              Quản lý Đợt & Hệ thống
            </p>
            {renderNavItem('shared-create-batch', <CalendarPlus size={18} weight="bold" />, 'Tổ chức đợt thực tập')}
            {renderNavItem('admin-permissions', <Key size={18} weight="bold" />, 'Cấp quyền tổ chức đợt')}
            {renderNavItem('admin-catalog', <Database size={18} weight="bold" />, 'Quản lý danh mục')}
            {renderNavItem('admin-stats', <ChartBar size={18} weight="bold" />, 'Thống kê báo cáo')}
          </>
        )}

        {currentUser.role === 'DoanhNghiep' && (
          <>
            <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Tuyển dụng & Đánh giá
            </p>
            {renderNavItem('dn-jobs', <Briefcase size={18} weight="bold" />, 'Đăng tuyển dụng (Job)', 'Sàn')}
            {renderNavItem('dn-applicants', <Users size={18} weight="bold" />, 'Duyệt ứng viên nộp CV', 'Tiếp nhận')}
            {renderNavItem('dn-interns', <Star size={18} weight="bold" />, 'Đánh giá TTS (5.0đ)', 'Phiếu NX')}
            {renderNavItem('dn-mentors', <UserGear size={18} weight="bold" />, 'Danh sách Mentor')}
          </>
        )}

        {currentUser.role === 'GiangVien' && (
          <>
            <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Hướng dẫn & Đánh giá
            </p>
            {renderNavItem('gv-my-students', <Users size={18} weight="bold" />, 'Quản lý SV hướng dẫn')}
            {renderNavItem('gv-grading', <CheckSquareOffset size={18} weight="bold" />, 'Duyệt báo cáo & Chấm điểm')}
            {renderNavItem('gv-export', <FileXls size={18} weight="bold" />, 'Xuất bảng điểm (Excel/PDF)')}

            {currentUser.coQuyenToChuc && (
              <>
                <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1.5 mt-3.5">
                  Phân quyền đặc biệt
                </p>
                {renderNavItem(
                  'shared-create-batch',
                  <CalendarPlus size={18} weight="bold" />,
                  'Tổ chức đợt thực tập',
                  'Được cấp'
                )}
              </>
            )}
          </>
        )}

        <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 mt-3.5">
          Thông tin hệ thống
        </p>
        {renderNavItem('shared-news', <Newspaper size={18} weight="bold" />, 'Tin tức & thông báo')}
        {renderNavItem('shared-activity', <ClockCounterClockwise size={18} weight="bold" />, 'Lịch sử hoạt động')}
      </nav>

      {/* Bottom Sidebar Logout Button */}
      <div className="p-2.5 border-t border-gray-100">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-2.5 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition text-xs font-bold cursor-pointer"
        >
          <SignOut size={18} weight="bold" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};
