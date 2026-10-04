import { DotThucTap } from '@/types/database.types';

const BATCH_CACHE_MS = 30_000;
let cachedBatches: DotThucTap[] | null = null;
let cacheExpiresAt = 0;
let pendingBatchRequest: Promise<DotThucTap[]> | null = null;

export const batchService = {
  async getBatches(): Promise<DotThucTap[]> {
    if (cachedBatches && Date.now() < cacheExpiresAt) return cachedBatches;
    if (pendingBatchRequest) return pendingBatchRequest;

    pendingBatchRequest = (async () => {
      const res = await fetch('/api/batches');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to load internship batches.');
      cachedBatches = data.data;
      cacheExpiresAt = Date.now() + BATCH_CACHE_MS;
      return cachedBatches || [];
    })();

    try {
      return await pendingBatchRequest;
    } finally {
      pendingBatchRequest = null;
    }
  },

  async createBatch(payload: {
    NamHoc: string;
    ThuTuDot?: string;
    NgayBatDauDangKy: string;
    NgayKetThucDangKy: string;
    NgayBatDau: string;
    NgayKetThuc: string;
    TaoBoiGiangVienId: number;
  }) {
    const res = await fetch('/api/batches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi tạo đợt thực tập');
    cachedBatches = null;
    cacheExpiresAt = 0;
    return data;
  },
};
