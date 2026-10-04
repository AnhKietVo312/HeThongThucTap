'use client';

import React, { useEffect, useState } from 'react';
import { DangKyThucTap, KetQuaThucTap } from '@/types/database.types';
import { evaluationService } from '@/features/evaluation/services/evaluationService';
import { Modal } from '@/shared/ui/Modal';
import {
  Buildings,
  ChalkboardTeacher,
  CheckCircle,
  Medal,
} from '@phosphor-icons/react';

interface GradingRubricModalProps {
  isOpen: boolean;
  onClose: () => void;
  registration: DangKyThucTap | null;
  onSaveGrade: (registrationId: number, result: KetQuaThucTap) => void;
}

export const GradingRubricModal: React.FC<GradingRubricModalProps> = ({
  isOpen,
  onClose,
  registration,
  onSaveGrade,
}) => {
  const [scores, setScores] = useState<Record<number, number>>({});
  const [nhanXetChung, setNhanXetChung] = useState('');
  const [rubrics, setRubrics] = useState<import('@/types/database.types').TieuChiChamDiem[]>([]);
  const [existingGrade, setExistingGrade] = useState<KetQuaThucTap | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !registration) return;
    let alive = true;
    setIsLoading(true);
    void Promise.all([
      evaluationService.getRubrics(registration.DotThucTapId),
      evaluationService.getGrades(registration.Id),
    ]).then(([criteria, grade]) => {
      if (!alive) return;
      setRubrics(criteria);
      setExistingGrade(grade);
      setNhanXetChung(grade?.NhanXetChung || '');
      setScores(Object.fromEntries((grade?.ChiTietDiem || []).map((item) => [item.TieuChiId, item.DiemDanhGia])));
      setErrorMessage(null);
    }).catch((error: unknown) => setErrorMessage(error instanceof Error ? error.message : 'Không thể tải rubric.'))
      .finally(() => { if (alive) setIsLoading(false); });
    return () => { alive = false; };
  }, [isOpen, registration?.Id, registration?.DotThucTapId]);

  if (!registration) return null;

  const sv = registration.sinhVien;
  const dn = registration.doanhNghiep;

  // Tiêu chí Giảng viên chấm (STT 1..10, Max 5.0)
  const tieuChiGV = rubrics.filter((tc) => tc.NguoiCham === 'GiangVien');
  // Tiêu chí Doanh nghiệp chấm từ Phiếu nhận xét (STT 11..12, Max 5.0)
  const tieuChiDN = rubrics.filter((tc) => tc.NguoiCham === 'DoanhNghiep');

  const tongDiemGV = tieuChiGV.reduce((acc, tc) => acc + (scores[tc.Id] || 0), 0);
  const tongDiemDN = existingGrade?.TongDiemDoanhNghiep || 0;
  const tongKet = Math.min(10, Math.round((tongDiemGV + tongDiemDN) * 100) / 100);

  const handleScoreChange = (tieuChiId: number, max: number, valueStr: string) => {
    const val = parseFloat(valueStr);
    if (isNaN(val)) {
      setScores((prev) => ({ ...prev, [tieuChiId]: 0 }));
      return;
    }
    const clamped = Math.min(max, Math.max(0, val));
    setScores((prev) => ({ ...prev, [tieuChiId]: clamped }));
  };

  const getRankBadge = (score: number) => {
    if (score >= 9.0) return { label: 'Xuất sắc', color: 'bg-emerald-100 text-emerald-800' };
    if (score >= 8.0) return { label: 'Giỏi', color: 'bg-blue-100 text-blue-800' };
    if (score >= 7.0) return { label: 'Khá', color: 'bg-sky-100 text-sky-800' };
    if (score >= 5.0) return { label: 'Trung bình', color: 'bg-amber-100 text-amber-800' };
    return { label: 'Không đạt', color: 'bg-rose-100 text-rose-800' };
  };

  const rank = getRankBadge(tongKet);

  const handleSave = async () => {
    try {
      const result = await evaluationService.submitGrade({
        dangKyThucTapId: registration.Id,
        nguoiCham: 'GiangVien',
        nhanXetChung,
        scores: tieuChiGV.map((criterion) => ({ tieuChiId: criterion.Id, diemDanhGia: scores[criterion.Id] || 0 })),
      });
      const grade = result.data as KetQuaThucTap;
      onSaveGrade(registration.Id, grade);
      onClose();
    } catch (error) { setErrorMessage(error instanceof Error ? error.message : 'Không thể lưu điểm.'); }
  };

  const deTaiName = `BÁO CÁO THỰC TẬP ${registration.ViTriPhanCong || "TỐT NGHIỆP"}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="PHIẾU CHẤM ĐIỂM THỰC TẬP DOANH NGHIỆP"
      subtitle="Biểu mẫu chuẩn Khoa Công nghệ Thông tin — Trường Đại học Công Thương TP.HCM"
      maxWidth="5xl"
      footer={
        <div className="flex flex-wrap items-center justify-between w-full gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 font-medium">ĐIỂM TỔNG:</span>
            <span className="text-2xl font-black text-huit-red font-mono">
              {tongKet.toFixed(2)} <span className="text-sm text-gray-400 font-normal">/ 10.0</span>
            </span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${rank.color}`}>
              {rank.label}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-white bg-huit-blue hover:bg-[#002244] rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle size={16} weight="bold" />
              Lưu & Xác nhận Phiếu Chấm Điểm
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Header thông tin sinh viên & đề tài chuẩn HUIT */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5">
          <div className="flex flex-wrap justify-between items-center border-b border-gray-200 pb-2">
            <div>
              <span className="font-bold text-gray-500 uppercase text-[10px]">Đơn vị đào tạo</span>
              <p className="font-extrabold text-huit-blue text-xs">KHOA CÔNG NGHỆ THÔNG TIN — HUIT</p>
            </div>
            <div className="text-right">
              <span className="font-bold text-gray-500 uppercase text-[10px]">Cơ cấu điểm</span>
              <p className="font-bold text-gray-700 text-xs">50% Giảng viên (5.0đ) + 50% Doanh nghiệp (5.0đ)</p>
            </div>
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm">
              Tên đề tài: <span className="text-huit-blue">{deTaiName}</span>
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-semibold text-gray-700">
            <p>Mã Sinh viên: <strong className="font-mono text-gray-900">{sv?.Mssv}</strong></p>
            <p>Họ tên: <strong className="text-gray-900">{sv?.HoTen}</strong></p>
            <p>Lớp: <strong className="text-gray-900">{sv?.Lop}</strong></p>
          </div>
        </div>

        {/* 3 Thẻ Điểm Nhanh */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
            <p className="text-[11px] font-bold text-purple-800 uppercase flex items-center justify-center gap-1">
              <ChalkboardTeacher size={16} />
              1. Giảng viên chấm (10 tiêu chí)
            </p>
            <p className="text-xl font-extrabold text-purple-900 font-mono mt-0.5">
              {tongDiemGV.toFixed(2)} <span className="text-xs text-purple-600 font-normal">/ 5.0 (50%)</span>
            </p>
          </div>

          <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-center">
            <p className="text-[11px] font-bold text-sky-800 uppercase flex items-center justify-center gap-1">
              <Buildings size={16} />
              2. Doanh nghiệp chấm (Phiếu nhận xét)
            </p>
            <p className="text-xl font-extrabold text-sky-900 font-mono mt-0.5">
              {tongDiemDN.toFixed(2)} <span className="text-xs text-sky-600 font-normal">/ 5.0 (50%)</span>
            </p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
            <p className="text-[11px] font-bold text-emerald-800 uppercase flex items-center justify-center gap-1">
              <Medal size={16} />
              ĐIỂM TỔNG KẾT
            </p>
            <p className="text-xl font-extrabold text-emerald-900 font-mono mt-0.5">
              {tongKet.toFixed(2)} <span className="text-xs text-emerald-600 font-normal">/ 10.0 (100%)</span>
            </p>
          </div>
        </div>

        {/* Bảng 12 Tiêu chí chấm Rubric chuẩn hóa */}
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left">
            <thead className="bg-gray-100 uppercase text-gray-700 font-bold text-[10px] border-b border-gray-200">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center">STT</th>
                <th className="py-2.5 px-3">Nội dung đánh giá</th>
                <th className="py-2.5 px-3 w-20 text-center">CLO</th>
                <th className="py-2.5 px-3 w-24 text-center">Điểm tối đa</th>
                <th className="py-2.5 px-3 w-32 text-right">Điểm đánh giá</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* Header Phần 1 */}
              <tr className="bg-purple-50/70 font-bold text-purple-900">
                <td colSpan={5} className="py-2 px-3">
                  I. GIẢNG VIÊN ĐÁNH GIÁ BÁO CÁO & VẤN ĐÁP (TỐI ĐA 5.0 ĐIỂM)
                </td>
              </tr>
              {tieuChiGV.map((tc) => (
                <tr key={tc.Id} className="hover:bg-gray-50/60">
                  <td className="py-2 px-3 text-center font-bold text-gray-600">{tc.Stt}</td>
                  <td className="py-2 px-3 text-gray-800 font-medium">{tc.NoiDungDanhGia}</td>
                  <td className="py-2 px-3 text-center">
                    <span className="font-mono text-[10px] bg-purple-50 text-purple-800 font-bold px-1.5 py-0.5 rounded border border-purple-200">
                      {tc.Clo}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center font-mono font-bold text-gray-700">
                    {tc.DiemToiDa.toFixed(2)}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max={tc.DiemToiDa}
                      value={scores[tc.Id] ?? ''}
                      onChange={(e) => handleScoreChange(tc.Id, tc.DiemToiDa, e.target.value)}
                      className="w-20 text-right px-2 py-1 bg-white border border-gray-300 rounded-lg text-xs font-mono font-bold text-purple-900 focus:border-purple-600 outline-none"
                    />
                  </td>
                </tr>
              ))}
              <tr className="bg-purple-50/40 font-bold text-purple-900 border-t border-purple-100">
                <td colSpan={3} className="py-2 px-3 text-right">
                  CỘNG ĐIỂM GIẢNG VIÊN ĐÁNH GIÁ:
                </td>
                <td className="py-2 px-3 text-center font-mono">5.00</td>
                <td className="py-2 px-3 text-right font-mono text-purple-900 text-sm">
                  {tongDiemGV.toFixed(2)}
                </td>
              </tr>

              {/* Header Phần 2 */}
              <tr className="bg-sky-50/70 font-bold text-sky-900">
                <td colSpan={5} className="py-2 px-3">
                  II. ĐƠN VỊ THỰC TẬP ĐÁNH GIÁ (LẤY TỪ PHIẾU NHẬN XÉT CỦA DN - TỐI ĐA 5.0 ĐIỂM)
                </td>
              </tr>
              {tieuChiDN.map((tc) => (
                <tr key={tc.Id} className="hover:bg-gray-50/60">
                  <td className="py-2 px-3 text-center font-bold text-gray-600">{tc.Stt}</td>
                  <td className="py-2 px-3 text-gray-800 font-medium">{tc.NoiDungDanhGia}</td>
                  <td className="py-2 px-3 text-center">
                    <span className="font-mono text-[10px] bg-sky-50 text-sky-800 font-bold px-1.5 py-0.5 rounded border border-sky-200">
                      {tc.Clo}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center font-mono font-bold text-gray-700">
                    {tc.DiemToiDa.toFixed(2)}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max={tc.DiemToiDa}
                      value={existingGrade?.ChiTietDiem?.find((item) => item.TieuChiId === tc.Id)?.DiemDanhGia ?? ''}
                      readOnly
                      className="w-20 text-right px-2 py-1 bg-white border border-gray-300 rounded-lg text-xs font-mono font-bold text-sky-900 focus:border-sky-600 outline-none"
                    />
                  </td>
                </tr>
              ))}
              <tr className="bg-sky-50/40 font-bold text-sky-900 border-t border-sky-100">
                <td colSpan={3} className="py-2 px-3 text-right">
                  CỘNG ĐIỂM DOANH NGHIỆP ĐÁNH GIÁ:
                </td>
                <td className="py-2 px-3 text-center font-mono">5.00</td>
                <td className="py-2 px-3 text-right font-mono text-sky-900 text-sm">
                  {tongDiemDN.toFixed(2)}
                </td>
              </tr>

              {/* Hàng ĐIỂM TỔNG kết thúc */}
              <tr className="bg-gray-200/80 font-black text-gray-900 text-sm">
                <td colSpan={3} className="py-3 px-4 text-right uppercase tracking-wider">
                  ĐIỂM TỔNG:
                </td>
                <td className="py-3 px-3 text-center font-mono">10</td>
                <td className="py-3 px-3 text-right font-mono text-huit-red text-base">
                  {tongKet.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Nhận xét & chữ ký GV */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
              Nhận xét của Giảng viên hướng dẫn:
            </label>
            <textarea
              rows={3}
              value={nhanXetChung}
              onChange={(e) => setNhanXetChung(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:bg-white focus:border-huit-blue"
              placeholder="Nhận xét chi tiết về kết quả công việc, thái độ và báo cáo..."
            />
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex flex-col justify-between text-right">
            <div>
              <p className="font-bold text-gray-800 text-xs uppercase">Giảng viên chấm điểm</p>
              <p className="text-[11px] text-gray-500 italic mt-0.5">(Ký và ghi rõ họ tên)</p>
            </div>
            <div className="pt-4">
              <span className="font-serif italic text-base text-gray-400 block pr-4">HuuNguyen</span>
              <p className="font-bold text-huit-blue text-sm mt-1">Nguyễn Thế Hữu</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};


