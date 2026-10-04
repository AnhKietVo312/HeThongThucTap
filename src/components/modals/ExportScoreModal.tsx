'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { DangKyThucTap, KetQuaThucTap, TieuChiChamDiem } from '@/types/database.types';
import { evaluationService } from '@/features/evaluation/services/evaluationService';
import { exportService } from '@/features/export-report/services/exportService';
import { Modal } from '@/shared/ui/Modal';
import {
  FileXls,
  FilePdf,
  CheckCircle,
  Printer,
  FileText,
  Table,
} from '@phosphor-icons/react';

interface ExportScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  registrations: DangKyThucTap[];
  lecturerName: string;
  giangVienId?: number;
}

export const ExportScoreModal: React.FC<ExportScoreModalProps> = ({
  isOpen,
  onClose,
  registrations,
  lecturerName,
  giangVienId,
}) => {
  const [activeView, setActiveView] = useState<'summary' | 'official_sheet'>('summary');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [grades, setGrades] = useState<Record<number, KetQuaThucTap>>({});
  const [rubrics, setRubrics] = useState<Record<number, TieuChiChamDiem[]>>({});

  useEffect(() => {
    if (!isOpen || registrations.length === 0) return;
    let alive = true;
    const registrationIds = new Set(registrations.map((registration) => registration.Id));
    const batchIds = [...new Set(registrations.map((registration) => registration.DotThucTapId))];
    void Promise.all([
      exportService.getExportData(undefined, giangVienId),
      Promise.all(batchIds.map(async (batchId) => [batchId, await evaluationService.getRubrics(batchId)] as const)),
    ]).then(([exportData, criteriaRows]) => {
      if (!alive) return;
      const gradeEntries = (exportData.raw || []).flatMap((row: Record<string, unknown>) => {
        const relation = row.KetQuaThucTap;
        const grade = Array.isArray(relation) ? relation[0] : relation;
        return registrationIds.has(Number(row.Id)) && grade && typeof grade === 'object'
          ? [[Number(row.Id), grade as KetQuaThucTap] as const]
          : [];
      });
      setGrades(Object.fromEntries(gradeEntries));
      const criteriaByBatch: Record<number, TieuChiChamDiem[]> = Object.fromEntries(criteriaRows);
      setRubrics(criteriaByBatch);
    }).catch((error) => setDownloadSuccess(error instanceof Error ? error.message : 'Không thể tải dữ liệu điểm.'));
    return () => { alive = false; };
  }, [isOpen, registrations, giangVienId]);

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      if (format === 'excel') {
        const batchId = currentReg?.DotThucTapId;
        await exportService.downloadExcel(batchId, giangVienId);
        setDownloadSuccess('Đã tải bảng điểm Excel từ dữ liệu hệ thống.');
      } else {
        window.print();
        setDownloadSuccess('Chọn “Save as PDF” trong hộp thoại in để lưu PDF.');
      }
    } catch (error) { setDownloadSuccess(error instanceof Error ? error.message : 'Không thể xuất báo cáo.'); }
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  const getRank = (score: number) => {
    if (score >= 9.0) return 'Xuất sắc';
    if (score >= 8.0) return 'Giỏi';
    if (score >= 7.0) return 'Khá';
    if (score >= 5.0) return 'Trung bình';
    return 'Không đạt';
  };

  const currentReg = registrations[0];
  const currentGrade = currentReg ? grades[currentReg.Id] : undefined;
  const currentRubrics = currentReg ? rubrics[currentReg.DotThucTapId] || [] : [];

  const deTaiName = `BÁO CÁO THỰC TẬP ${currentReg?.ViTriPhanCong || "TỐT NGHIỆP"}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="BÁO CÁO & PHIẾU CHẤM ĐIỂM THỰC TẬP" subtitle={`Giảng viên phụ trách: ${lecturerName}`} maxWidth="5xl">
      {downloadSuccess && <p role="status" className="mb-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">{downloadSuccess}</p>}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex gap-2">
          <button type="button" onClick={() => setActiveView('summary')} className={`rounded-lg px-3 py-2 text-sm ${activeView === 'summary' ? 'bg-huit-blue text-white' : 'bg-gray-100'}`}>Bảng tổng hợp</button>
          <button type="button" onClick={() => setActiveView('official_sheet')} disabled={!currentReg} className={`rounded-lg px-3 py-2 text-sm ${activeView === 'official_sheet' ? 'bg-huit-blue text-white' : 'bg-gray-100'}`}>Phiếu chấm điểm</button>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void handleExport('excel')} disabled={!registrations.length} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white"><FileXls size={18} className="inline" /> Excel</button>
          <button type="button" onClick={() => void handleExport('pdf')} disabled={!registrations.length} className="rounded-lg bg-huit-blue px-3 py-2 text-sm font-semibold text-white"><FilePdf size={18} className="inline" /> PDF</button>
        </div>
      </div>
      {activeView === 'summary' && (
        <div className="max-h-[60vh] overflow-auto rounded-xl border">
          <table className="w-full text-left text-sm"><thead className="sticky top-0 bg-gray-100"><tr><th className="p-3">MSSV</th><th className="p-3">Sinh viên</th><th className="p-3">Doanh nghiệp</th><th className="p-3 text-right">Điểm DN</th><th className="p-3 text-right">Điểm GV</th><th className="p-3 text-right">Tổng</th></tr></thead>
            <tbody>{registrations.map((registration) => { const grade = grades[registration.Id]; return <tr key={registration.Id} className="border-t"><td className="p-3 font-mono">{registration.sinhVien?.Mssv}</td><td className="p-3">{registration.sinhVien?.HoTen}</td><td className="p-3">{registration.doanhNghiep?.TenDoanhNghiep || 'Tự liên hệ'}</td><td className="p-3 text-right">{grade?.TongDiemDoanhNghiep?.toFixed(2) ?? '—'}</td><td className="p-3 text-right">{grade?.TongDiemGiangVien?.toFixed(2) ?? '—'}</td><td className="p-3 text-right font-bold">{grade?.DiemTongKet?.toFixed(2) ?? '—'}</td></tr>; })}</tbody>
          </table>
          {!registrations.length && <p className="p-8 text-center text-gray-500">Chưa có hồ sơ để xuất điểm.</p>}
        </div>
      )}
      {activeView === 'official_sheet' && currentReg && (
          <div className="bg-white p-6 sm:p-8 border border-gray-300 rounded-2xl shadow-sm text-gray-900 space-y-4 font-sans max-h-[60vh] overflow-y-auto">
            {/* Header Trường & Khoa */}
            <div className="flex items-start gap-4 pb-3 border-b border-gray-200">
              <div className="w-16 h-16 relative shrink-0">
                <Image
                  src="/logo-circle.png"
                  alt="Logo HUIT"
                  width={56}
                  height={56}
                  className="object-contain"
                />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold uppercase text-gray-600">TRƯỜNG ĐẠI HỌC</p>
                <h3 className="text-base font-black text-huit-blue uppercase tracking-tight">
                  CÔNG THƯƠNG TP. HCM
                </h3>
                <p className="text-[10px] text-gray-500 font-semibold tracking-wider">
                  HCMC UNIVERSITY OF INDUSTRY AND TRADE
                </p>
                <p className="text-xs font-bold text-gray-800 pt-0.5">KHOA CÔNG NGHỆ THÔNG TIN</p>
              </div>
            </div>

            {/* Tiêu đề Phiếu Chấm Điểm */}
            <div className="text-center py-2 space-y-1">
              <h2 className="text-lg font-black text-gray-900 tracking-tight">
                PHIẾU CHẤM ĐIỂM THỰC TẬP KỸ SƯ
              </h2>
              <p className="text-xs font-bold text-gray-800">
                Tên đề tài: <span className="uppercase text-huit-blue">{deTaiName}</span>
              </p>
              <div className="flex flex-wrap justify-center gap-6 text-xs text-gray-800 pt-1 font-semibold">
                <p>Mã Sinh viên: <strong className="font-mono">{currentReg?.sinhVien?.Mssv}</strong></p>
                <p>Họ tên: <strong>{currentReg?.sinhVien?.HoTen}</strong></p>
                <p>Lớp: <strong>{currentReg?.sinhVien?.Lop}</strong></p>
              </div>
            </div>

            {/* Bảng 12 Tiêu chí Rubric Y Hệt Mẫu */}
            <table className="w-full text-left border-collapse border border-gray-400 text-xs">
              <thead>
                <tr className="bg-gray-100 text-center font-bold">
                  <th className="border border-gray-400 p-2 w-12">STT</th>
                  <th className="border border-gray-400 p-2">Nội dung đánh giá</th>
                  <th className="border border-gray-400 p-2 w-20">CLO</th>
                  <th className="border border-gray-400 p-2 w-24">Điểm tối đa</th>
                  <th className="border border-gray-400 p-2 w-24">Điểm đánh giá</th>
                </tr>
              </thead>
              <tbody>
                {currentRubrics.map((tc) => {
                  const itemGrade = currentGrade?.ChiTietDiem?.find((d) => d.TieuChiId === tc.Id);
                  const scoreVal = itemGrade ? itemGrade.DiemDanhGia : 0;

                  return (
                    <tr key={tc.Id} className="hover:bg-gray-50/50">
                      <td className="border border-gray-400 p-2 text-center font-semibold">{tc.Stt}</td>
                      <td className="border border-gray-400 p-2 text-gray-800 font-medium">
                        {tc.NoiDungDanhGia}
                      </td>
                      <td className="border border-gray-400 p-2 text-center font-mono text-[11px] font-semibold">
                        {tc.Clo}
                      </td>
                      <td className="border border-gray-400 p-2 text-center font-mono font-semibold">
                        {tc.DiemToiDa === 0.75 || tc.DiemToiDa === 0.25
                          ? tc.DiemToiDa.toFixed(2)
                          : tc.DiemToiDa.toFixed(1)}
                      </td>
                      <td className="border border-gray-400 p-2 text-center font-mono font-bold text-gray-900">
                        {scoreVal.toFixed(scoreVal % 1 === 0 ? 1 : 2)}
                      </td>
                    </tr>
                  );
                })}
                <tr className="font-bold bg-gray-100">
                  <td colSpan={3} className="border border-gray-400 p-2 text-left font-black tracking-wide">
                    ĐIỂM TỔNG
                  </td>
                  <td className="border border-gray-400 p-2 text-center font-mono font-black">10</td>
                  <td className="border border-gray-400 p-2 text-center font-mono font-black text-sm text-huit-red">
                    {currentGrade ? currentGrade.DiemTongKet.toFixed(1) : '—'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Chân trang chữ ký Giảng viên */}
            <div className="pt-6 flex justify-end text-center pr-6">
              <div className="space-y-1">
                <p className="font-bold text-gray-800 text-xs">Giảng viên chấm điểm</p>
                <div className="py-4">
                  <span className="font-serif italic text-lg text-gray-400 block pr-2">HuuNguyen</span>
                </div>
                <p className="font-bold text-gray-900 text-sm">{lecturerName}</p>
              </div>
            </div>

            <p className="text-center text-[10px] text-gray-400 pt-2 font-mono">1</p>
          </div>
        )}
    </Modal>
  );
};




