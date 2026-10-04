'use client';

import React from 'react';
import { Plus, Notebook, CheckCircle, Clock } from '@phosphor-icons/react';

export interface DiaryEntry {
  id: number;
  tuan: number;
  ngay: string;
  noiDung: string;
  ketQua: string;
  NhanXetCuaGiangVien?: string;
}

interface WeeklyDiarySectionProps {
  diaries: DiaryEntry[];
  onOpenAddModal: () => void;
}

export const WeeklyDiarySection: React.FC<WeeklyDiarySectionProps> = ({
  diaries,
  onOpenAddModal,
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs text-xs">
      <div className="p-4 px-5 border-b border-gray-100 flex flex-wrap justify-between items-center gap-3">
        <div>
          <h3 className="font-bold text-sm text-gray-900">Nhật ký thực tập hằng tuần (NhatKyThucTap)</h3>
          <p className="text-gray-500 mt-0.5 text-xs">
            Cập nhật tiến độ định kỳ để Giảng viên hướng dẫn theo dõi và đánh giá quá trình.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAddModal}
          className="px-3.5 py-1.5 bg-huit-blue hover:bg-[#002244] text-white font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Plus size={15} weight="bold" />
          <span>Viết nhật ký tuần mới</span>
        </button>
      </div>

      <div className="divide-y divide-gray-100">
        {diaries.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Notebook size={32} className="mx-auto mb-2 opacity-50" />
            <p>Chưa có mục nhật ký nào. Bấm nút trên để bắt đầu ghi nhật ký tuần 1.</p>
          </div>
        ) : (
          diaries.map((d) => (
            <div key={d.id} className="p-4 px-5 hover:bg-gray-50/70 transition">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="font-bold text-huit-blue text-xs flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-huit-blue flex items-center justify-center font-bold text-[10px]">
                    {d.tuan}
                  </span>
                  <span>Tuần {d.tuan}</span>
                </span>
                <span className="text-[11px] text-gray-400 font-mono">
                  Ngày ghi: {new Date(d.ngay).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <div className="space-y-1.5 text-gray-700">
                <p>
                  <strong className="text-gray-900">Nội dung công việc: </strong>
                  {d.noiDung}
                </p>
                <p>
                  <strong className="text-gray-900">Kết quả đạt được: </strong>
                  {d.ketQua}
                </p>
                {d.NhanXetCuaGiangVien && (
                  <div className="mt-2 p-2 bg-emerald-50/70 border border-emerald-200 rounded-lg text-emerald-900 text-[11px]">
                    <strong>Nhận xét của GVHD: </strong>
                    {d.NhanXetCuaGiangVien}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
