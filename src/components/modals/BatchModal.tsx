import React, { useState } from 'react';
import { DotThucTap, ThuTuDot } from '@/types/database.types';
import { Modal } from '@/shared/ui/Modal';
import { CalendarDots, CheckCircle } from '@phosphor-icons/react';
import styles from './BatchModal.module.css';

interface BatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBatch: (batch: Partial<DotThucTap>) => void;
}

export const BatchModal: React.FC<BatchModalProps> = ({
  isOpen,
  onClose,
  onSaveBatch,
}) => {
  const [namHoc, setNamHoc] = useState('2026-2027');
  const [thuTuDot, setThuTuDot] = useState<ThuTuDot>('Dot1');
  const [ngayBatDauDangKy, setNgayBatDauDangKy] = useState('');
  const [ngayKetThucDangKy, setNgayKetThucDangKy] = useState('');
  const [ngayBatDau, setNgayBatDau] = useState('');
  const [ngayKetThuc, setNgayKetThuc] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveBatch({
      TenDot: `${thuTuDot === 'DotDuPhong' ? 'Đợt dự phòng' : `Đợt ${Number(thuTuDot.slice(-1))}`} (${namHoc})`,
      NamHoc: namHoc,
      ThuTuDot: thuTuDot,
      NgayBatDauDangKy: ngayBatDauDangKy || '2026-09-01',
      NgayKetThucDangKy: ngayKetThucDangKy || '2026-09-30',
      NgayBatDau: ngayBatDau || '2026-10-01',
      NgayKetThuc: ngayKetThuc || '2027-01-15',
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Khởi tạo Đợt Thực tập Doanh nghiệp Mới"
      subtitle="Dành cho Quản trị Khoa và Giảng viên được phân quyền Tổ chức đợt"
      maxWidth="2xl"
      footer={
        <div className="ui-modal-footer-actions">
          <button
            type="button"
            onClick={onClose}
            className="ui-button ui-button-muted"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="ui-button ui-button-primary px-5 font-bold"
          >
            <CheckCircle size={16} weight="bold" />
            Lưu & Mở đăng ký đợt
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className="ui-panel-info text-sm font-semibold">
          Tên đợt sẽ được tạo tự động: {thuTuDot === 'DotDuPhong' ? 'Đợt dự phòng' : `Đợt ${Number(thuTuDot.slice(-1))}`} ({namHoc})
        </div>

        <div className={styles.twoColumnGrid}>
          <div>
            <label className="ui-form-label">Năm học:</label>
            <input
              type="text"
              value={namHoc}
              onChange={(e) => setNamHoc(e.target.value)}
              placeholder="vd: 2026-2027"
              className={`ui-form-field-sm ${styles.monoField}`}
            />
          </div>
          <div>
            <label className="ui-form-label">Thứ tự đợt:</label>
            <select
              value={thuTuDot}
              onChange={(e) => setThuTuDot(e.target.value as ThuTuDot)}
              className={`ui-form-field-sm ${styles.selectField}`}
            >
              <option value="Dot1">Đợt 1</option>
              <option value="Dot2">Đợt 2</option>
              <option value="Dot3">Đợt 3</option>
              <option value="DotDuPhong">Đợt dự phòng</option>
            </select>
          </div>
        </div>

        <div className="ui-panel-info space-y-3">
          <p className={styles.infoTitle}>
            <CalendarDots size={16} />
            Thời gian mở & kết thúc đăng ký trực tuyến
          </p>
          <div className={styles.twoColumnGrid}>
            <div>
              <label className={styles.dateLabel}>
                Ngày mở cổng đăng ký:
              </label>
              <input
                type="date"
                value={ngayBatDauDangKy}
                onChange={(e) => setNgayBatDauDangKy(e.target.value)}
                className="ui-form-field-date"
              />
            </div>
            <div>
              <label className={styles.dateLabel}>
                Ngày đóng cổng đăng ký:
              </label>
              <input
                type="date"
                value={ngayKetThucDangKy}
                onChange={(e) => setNgayKetThucDangKy(e.target.value)}
                className="ui-form-field-date"
              />
            </div>
          </div>
        </div>

        <div className="ui-panel space-y-3">
          <p className={styles.sectionTitle}>
            Thời gian diễn ra thực tập tại doanh nghiệp
          </p>
          <div className={styles.twoColumnGrid}>
            <div>
              <label className={styles.dateLabel}>
                Ngày bắt đầu thực tập:
              </label>
              <input
                type="date"
                value={ngayBatDau}
                onChange={(e) => setNgayBatDau(e.target.value)}
                className="ui-form-field-date"
              />
            </div>
            <div>
              <label className={styles.dateLabel}>
                Ngày kết thúc dự kiến:
              </label>
              <input
                type="date"
                value={ngayKetThuc}
                onChange={(e) => setNgayKetThuc(e.target.value)}
                className="ui-form-field-date"
              />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};
