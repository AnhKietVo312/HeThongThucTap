import React from 'react';
import {
  TrangThaiDangKy,
  TrangThaiBaoCao,
  NguonNhanSu,
} from '@/types/database.types';
import {
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Buildings,
  UserCheck,
  WarningCircle,
} from '@phosphor-icons/react';
import styles from './StatusBadge.module.css';

interface StatusBadgeProps {
  status: TrangThaiDangKy | TrangThaiBaoCao | NguonNhanSu | string;
  type?: 'registration' | 'report' | 'source';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'registration' }) => {
  if (type === 'registration') {
    switch (status as TrangThaiDangKy) {
      case 'DaDangKy':
        return (
          <span className={`${styles.badge} ${styles.warning}`}>
            <Clock size={13} weight="bold" />
            Bước 1: Đã kê khai hồ sơ
          </span>
        );
      case 'ChoPheDuyet':
        return (
          <span className={`${styles.badge} ${styles.info}`}>
            <Clock size={13} weight="bold" />
            Chờ Khoa phê duyệt
          </span>
        );
      case 'DaDuyet':
        return (
          <span className={`${styles.badge} ${styles.success}`}>
            <CheckCircle size={13} weight="bold" />
            Đã duyệt chính thức
          </span>
        );
      case 'TuChoi':
        return (
          <span className={`${styles.badge} ${styles.danger}`}>
            <XCircle size={13} weight="bold" />
            Từ chối hồ sơ
          </span>
        );
      case 'DaHuy':
        return (
          <span className={`${styles.badge} ${styles.muted}`}>
            <XCircle size={13} weight="bold" />
            Đã hủy
          </span>
        );
      default:
        return (
          <span className={styles.fallback}>
            {status}
          </span>
        );
    }
  }

  if (type === 'report') {
    switch (status as TrangThaiBaoCao) {
      case 'ChoDuyet':
        return (
          <span className={`${styles.badge} ${styles.warning}`}>
            <Clock size={13} weight="bold" />
            Chờ GVHD duyệt
          </span>
        );
      case 'DatChuan':
        return (
          <span className={`${styles.badge} ${styles.success}`}>
            <CheckCircle size={13} weight="bold" />
            Báo cáo Đạt chuẩn
          </span>
        );
      case 'YeuCauLamLai':
        return (
          <span className={`${styles.badge} ${styles.danger}`}>
            <WarningCircle size={13} weight="bold" />
            Yêu cầu chỉnh sửa lại
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  }

  if (type === 'source') {
    switch (status as NguonNhanSu) {
      case 'DanhSachKhoa':
        return (
          <span className={`${styles.compact} ${styles.sourcePartner}`}>
            <Buildings size={12} weight="bold" />
            Đối tác của Khoa
          </span>
        );
      case 'TuTim':
        return (
          <span className={`${styles.compact} ${styles.sourceSelf}`}>
            <FileText size={12} weight="bold" />
            Sinh viên tự liên hệ
          </span>
        );
      case 'GvGioiThieu':
        return (
          <span className={`${styles.compact} ${styles.sourceLecturer}`}>
            <UserCheck size={12} weight="bold" />
            Giảng viên giới thiệu
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  }

  return <span>{status}</span>;
};
