import React, { useState } from 'react';
import { NhatKyThucTap } from '@/types/database.types';
import { Modal } from '@/shared/ui/Modal';
import { CalendarBlank, CheckCircle, ChatText } from '@phosphor-icons/react';

interface WeeklyDiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  diary?: NhatKyThucTap | null;
  mode: 'student-add' | 'lecturer-review';
  onSaveStudent?: (tuanThu: number, noiDung: string, ketQua: string) => void;
  onSaveLecturerReview?: (diaryId: number, nhanXet: string) => void;
}

export const WeeklyDiaryModal: React.FC<WeeklyDiaryModalProps> = ({
  isOpen,
  onClose,
  diary,
  mode,
  onSaveStudent,
  onSaveLecturerReview,
}) => {
  const [tuanThu, setTuanThu] = useState(diary?.TuanThu || 4);
  const [noiDung, setNoiDung] = useState(diary?.NoiDungCongViec || '');
  const [ketQua, setKetQua] = useState(diary?.KetQuaDatDuoc || '');
  const [nhanXet, setNhanXet] = useState(diary?.NhanXetCuaGiangVien || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'student-add') {
      if (!noiDung.trim() || !ketQua.trim()) {
        alert('Vui lòng nhập đầy đủ nội dung và kết quả công việc');
        return;
      }
      onSaveStudent?.(tuanThu, noiDung, ketQua);
    } else if (mode === 'lecturer-review' && diary) {
      onSaveLecturerReview?.(diary.Id, nhanXet);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        mode === 'student-add'
          ? 'Ghi nhật ký thực tập tuần'
          : `Nhật ký thực tập Tuần ${diary?.TuanThu || 1}`
      }
      subtitle={
        mode === 'student-add'
          ? 'Cập nhật tiến độ định kỳ hàng tuần gửi Giảng viên hướng dẫn'
          : 'Xem chi tiết báo cáo tuần và gửi nhận xét góp ý cho sinh viên'
      }
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 text-xs font-bold text-white bg-huit-blue hover:bg-[#002244] rounded-xl transition shadow-md shadow-huit-blue/20 flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle size={16} weight="bold" />
            {mode === 'student-add' ? 'Lưu nhật ký tuần' : 'Gửi nhận xét góp ý'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {mode === 'student-add' ? (
          <>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                Tuần thực tập thứ:
              </label>
              <select
                value={tuanThu}
                onChange={(e) => setTuanThu(Number(e.target.value))}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-huit-blue"
              >
                {Array.from({ length: 15 }, (_, i) => i + 1).map((week) => (
                  <option key={week} value={week}>
                    Tuần {week}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                Nội dung công việc thực hiện trong tuần:
              </label>
              <textarea
                rows={4}
                required
                value={noiDung}
                onChange={(e) => setNoiDung(e.target.value)}
                placeholder="Mô tả các nhiệm vụ được giao tại doanh nghiệp, công nghệ sử dụng, bài toán giải quyết..."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:bg-white focus:border-huit-blue"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                Kết quả đạt được & Khó khăn gặp phải:
              </label>
              <textarea
                rows={3}
                required
                value={ketQua}
                onChange={(e) => setKetQua(e.target.value)}
                placeholder="Kết quả cụ thể: Hoàn thành tính năng, viết tài liệu, link commit/PR, hoặc bài học rút ra..."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:bg-white focus:border-huit-blue"
              />
            </div>
          </>
        ) : (
          <>
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-2">
              <div className="flex items-center justify-between text-gray-500">
                <span className="font-semibold flex items-center gap-1">
                  <CalendarBlank size={14} />
                  Ngày ghi: {diary?.NgayTao}
                </span>
                <span className="font-bold text-huit-blue">Tuần {diary?.TuanThu}</span>
              </div>
              <div>
                <p className="font-bold text-gray-700 text-[11px] uppercase">Nội dung công việc:</p>
                <p className="text-gray-800 mt-0.5">{diary?.NoiDungCongViec}</p>
              </div>
              <div>
                <p className="font-bold text-gray-700 text-[11px] uppercase">Kết quả đạt được:</p>
                <p className="text-gray-800 mt-0.5">{diary?.KetQuaDatDuoc}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5 flex items-center gap-1.5">
                <ChatText size={16} className="text-huit-blue" weight="bold" />
                Nhận xét & Hướng dẫn của Giảng viên:
              </label>
              <textarea
                rows={3}
                value={nhanXet}
                onChange={(e) => setNhanXet(e.target.value)}
                placeholder="Ví dụ: Đã xem, kết quả đạt yêu cầu; Cần bổ sung tài liệu thiết kế hệ thống..."
                className="w-full p-3 bg-white border border-gray-300 rounded-xl text-xs outline-none focus:border-huit-blue"
              />
            </div>
          </>
        )}
      </form>
    </Modal>
  );
};
