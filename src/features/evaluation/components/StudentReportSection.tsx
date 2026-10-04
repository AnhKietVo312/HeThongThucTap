'use client';

import React from 'react';
import { FilePdf, UploadSimple, CheckCircle, Clock, XCircle, Star } from '@phosphor-icons/react';

interface StudentReportSectionProps {
  fileBaoCao: string;
  reportStatus?: 'ChoDuyet' | 'DatChuan' | 'YeuCauLamLai';
  reportComment?: string;
  onFileReportChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmitReport: () => void;
  diemDN: number;
  diemGV: number;
  nhanXetChung?: string;
}

export const StudentReportSection: React.FC<StudentReportSectionProps> = ({
  fileBaoCao,
  reportStatus = 'DatChuan',
  reportComment,
  onFileReportChange,
  onSubmitReport,
  diemDN,
  diemGV,
  nhanXetChung,
}) => {
  const tongKet = parseFloat((diemDN + diemGV).toFixed(2));

  const getRank = (score: number) => {
    if (score >= 9.0) return { label: 'Xuất sắc', color: 'text-purple-700 bg-purple-50 border-purple-200' };
    if (score >= 8.0) return { label: 'Giỏi', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (score >= 7.0) return { label: 'Khá', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (score >= 5.0) return { label: 'Trung bình', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { label: 'Không đạt', color: 'text-rose-700 bg-rose-50 border-rose-200' };
  };

  const rank = getRank(tongKet);

  return (
    <div className="space-y-5 text-xs">
      {/* KHỐI 1: BÁO CÁO THỰC TẬP TỐT NGHIỆP */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-sm text-gray-900">Báo cáo thực tập cuối kỳ (BaoCaoThucTap)</h3>
            <p className="text-gray-500 mt-0.5">
              Định dạng chuẩn PDF nộp cho Giảng viên hướng dẫn thẩm định chất lượng học phần.
            </p>
          </div>
          <div>
            {reportStatus === 'DatChuan' && (
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-full border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle size={15} weight="fill" />
                <span>Báo cáo Đạt Chuẩn</span>
              </span>
            )}
            {reportStatus === 'ChoDuyet' && (
              <span className="px-3 py-1 bg-amber-50 text-amber-700 font-bold rounded-full border border-amber-200 flex items-center gap-1.5">
                <Clock size={15} weight="bold" />
                <span>Chờ Giảng viên duyệt</span>
              </span>
            )}
            {reportStatus === 'YeuCauLamLai' && (
              <span className="px-3 py-1 bg-rose-50 text-rose-700 font-bold rounded-full border border-rose-200 flex items-center gap-1.5">
                <XCircle size={15} weight="fill" />
                <span>Yêu cầu làm lại</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-huit-blue font-bold rounded-lg border border-blue-200 transition flex items-center gap-2 cursor-pointer">
            <UploadSimple size={16} weight="bold" />
            <span>Chọn tệp Báo cáo PDF mới</span>
            <input type="file" accept=".pdf" onChange={onFileReportChange} className="hidden" />
          </label>

          {fileBaoCao && (
            <div className="flex items-center gap-2 font-semibold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
              <FilePdf size={16} weight="fill" className="text-rose-600" />
              <span className="truncate max-w-sm">{fileBaoCao}</span>
            </div>
          )}

          <button
            type="button"
            onClick={onSubmitReport}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs transition cursor-pointer"
          >
            Nộp báo cáo
          </button>
        </div>

        {reportComment && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700">
            <strong className="text-gray-900 block mb-0.5">Nhận xét của Giảng viên hướng dẫn:</strong>
            <p className="leading-relaxed">{reportComment}</p>
          </div>
        )}
      </div>

      {/* KHỐI 2: BẢNG TỔNG HỢP ĐIỂM RUBRIC ĐỘC LẬP */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
        <div className="pb-3 border-b border-gray-100 flex flex-wrap justify-between items-center gap-3">
          <div>
            <h3 className="font-bold text-sm text-gray-900">
              Kết quả đánh giá Rubric học phần (Hệ 10)
            </h3>
            <p className="text-gray-500 mt-0.5">
              Cơ cấu 2 phần độc lập: Doanh nghiệp tối đa 5.0đ + Giảng viên tối đa 5.0đ.
            </p>
          </div>
          <span className={`px-3 py-1 font-bold rounded-lg border ${rank.color}`}>
            Xếp loại: {rank.label}
          </span>
        </div>

        {/* 3 Thẻ điểm */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="p-4 bg-sky-50/60 border border-sky-200 rounded-xl">
            <span className="text-[11px] font-bold text-sky-800 uppercase block mb-1">
              Doanh nghiệp chấm (Max 5.0)
            </span>
            <div className="text-2xl font-black text-sky-900 font-mono">
              {diemDN.toFixed(2)}
              <span className="text-xs font-normal text-sky-600 ml-1">/ 5.0</span>
            </div>
            <p className="text-[10px] text-sky-700 mt-1">Ý thức kỷ luật & năng lực hoàn thành công việc</p>
          </div>

          <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-xl">
            <span className="text-[11px] font-bold text-purple-800 uppercase block mb-1">
              Giảng viên chấm (Max 5.0)
            </span>
            <div className="text-2xl font-black text-purple-900 font-mono">
              {diemGV.toFixed(2)}
              <span className="text-xs font-normal text-purple-600 ml-1">/ 5.0</span>
            </div>
            <p className="text-[10px] text-purple-700 mt-1">Hình thức, hàm lượng kỹ thuật & quá trình</p>
          </div>

          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl">
            <span className="text-[11px] font-bold text-emerald-800 uppercase block mb-1">
              Điểm tổng kết (Hệ 10)
            </span>
            <div className="text-2xl font-black text-emerald-900 font-mono">
              {tongKet.toFixed(2)}
              <span className="text-xs font-normal text-emerald-600 ml-1">/ 10.0</span>
            </div>
            <p className="text-[10px] text-emerald-700 mt-1">Điểm tổng kết = Điểm DN + Điểm GV</p>
          </div>
        </div>

        {nhanXetChung && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700">
            <strong className="text-gray-900 block mb-0.5">Nhận xét tổng hợp:</strong>
            <p className="leading-relaxed">{nhanXetChung}</p>
          </div>
        )}
      </div>
    </div>
  );
};
