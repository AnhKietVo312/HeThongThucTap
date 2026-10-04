'use client';

import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import { ClockCounterClockwise, ArrowClockwise, CalendarBlank, Eye, Newspaper, PencilSimple, Plus, PushPin, Trash, X } from '@phosphor-icons/react';
import { UserSession } from '@/types/database.types';

interface NewsItem {
  Id: number;
  TieuDe: string;
  Slug: string;
  TomTat: string | null;
  NoiDung: string;
  HinhAnhDaiDien: string | null;
  DoiTuongXem: string;
  GhimTin: boolean;
  TacGiaId: number;
  LuotXem: number;
  CreatedAt: string;
}

interface ActivityItem {
  Id: number;
  NguoiDungId: number;
  HanhDong: string;
  ChiTiet: string | null;
  IpAddress: string | null;
  CreatedAt: string;
  NguoiDung?: { TenDangNhap: string; VaiTro: string } | null;
}

interface NewsForm {
  TieuDe: string;
  TomTat: string;
  NoiDung: string;
  HinhAnhDaiDien: string;
  DoiTuongXem: string;
  GhimTin: boolean;
}

const emptyForm: NewsForm = { TieuDe: '', TomTat: '', NoiDung: '', HinhAnhDaiDien: '', DoiTuongXem: 'TatCa', GhimTin: false };
const audienceLabels: Record<string, string> = { TatCa: 'Tất cả', SinhVien: 'Sinh viên', GiangVien: 'Giảng viên', DoanhNghiep: 'Doanh nghiệp' };
const activityLabels: Record<string, string> = {
  DANG_NHAP: 'Đăng nhập', DANG_XUAT: 'Đăng xuất',
  CAP_NHAT_HO_SO_THUC_TAP: 'Cập nhật hồ sơ thực tập', UNG_TUYEN_CONG_VIEC: 'Ứng tuyển công việc',
  HUY_DANG_KY_THUC_TAP: 'Hủy đăng ký thực tập', DOANH_NGHIEP_DUYET_UNG_VIEN: 'Doanh nghiệp duyệt ứng viên',
  DOANH_NGHIEP_TU_CHOI_UNG_VIEN: 'Doanh nghiệp từ chối ứng viên', KHOA_DUYET_HO_SO: 'Khoa duyệt hồ sơ',
  KHOA_TU_CHOI_HO_SO: 'Khoa từ chối hồ sơ', NOP_BAO_CAO_THUC_TAP: 'Nộp báo cáo thực tập',
  DUYET_BAO_CAO_THUC_TAP: 'Giảng viên nhận xét báo cáo', TAO_TIN_TUC: 'Đăng tin tức',
  CAP_NHAT_TIN_TUC: 'Cập nhật tin tức', AN_TIN_TUC: 'Ẩn tin tức',
  KHAI_BAO_DOANH_NGHIEP_THUC_TAP: 'Khai báo doanh nghiệp thực tập', NOP_NHAT_KY_THUC_TAP: 'Nộp nhật ký thực tập',
  NHAN_XET_NHAT_KY: 'Giảng viên nhận xét nhật ký', PHAN_CONG_GIANG_VIEN: 'Phân công giảng viên hướng dẫn',
  TAO_DOT_THUC_TAP: 'Tạo đợt thực tập', TAO_TIN_TUYEN_DUNG: 'Đăng tin tuyển dụng',
  CAP_NHAT_TRANG_THAI_TUYEN_DUNG: 'Cập nhật trạng thái tuyển dụng',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function NewsActivityView({ activeTab, currentUser, showToast }: {
  activeTab: 'shared-news' | 'shared-activity';
  currentUser: UserSession;
  showToast: (message: string) => void;
}) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<NewsItem | null>(null);
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<NewsForm>(emptyForm);
  const isAdmin = currentUser.role === 'QuanTriVien';

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(activeTab === 'shared-news' ? '/api/news' : '/api/activity?limit=100', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Không thể tải dữ liệu.');
      if (activeTab === 'shared-news') setNews(result.data || []);
      else setActivities(result.data || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { void load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormOpen(true); };
  const openEdit = (item: NewsItem) => {
    setEditing(item);
    setForm({ TieuDe: item.TieuDe, TomTat: item.TomTat || '', NoiDung: item.NoiDung, HinhAnhDaiDien: item.HinhAnhDaiDien || '', DoiTuongXem: item.DoiTuongXem, GhimTin: item.GhimTin });
    setFormOpen(true);
    setSelected(null);
  };

  const saveNews = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(editing ? `/api/news/${editing.Id}` : '/api/news', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, HinhAnhDaiDien: form.HinhAnhDaiDien || null }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Không thể lưu tin tức.');
      setFormOpen(false);
      showToast(editing ? 'Đã cập nhật tin tức.' : 'Đã đăng tin tức.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể lưu tin tức.');
    } finally {
      setSaving(false);
    }
  };

  const deleteNews = async (item: NewsItem) => {
    if (!window.confirm(`Ẩn tin “${item.TieuDe}” khỏi danh sách?`)) return;
    try {
      const response = await fetch(`/api/news/${item.Id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Không thể ẩn tin tức.');
      setSelected(null);
      showToast('Đã ẩn tin tức.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể ẩn tin tức.');
    }
  };

  const openArticle = async (item: NewsItem) => {
    setSelected(item);
    try {
      const response = await fetch(`/api/news?id=${item.Id}`, { cache: 'no-store' });
      const result = await response.json();
      if (response.ok) {
        setSelected(result.data);
        setNews((items) => items.map((row) => row.Id === item.Id ? result.data : row));
      }
    } catch { /* Article content is already available from the list. */ }
  };

  return (
    <section className="mx-auto w-full max-w-6xl space-y-5 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-gradient-to-r from-white to-blue-50 p-5 shadow-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-huit-blue">HUIT · Hệ thống thực tập</p>
          <h1 className="mt-1 text-2xl font-black text-gray-900">{activeTab === 'shared-news' ? 'Tin tức & thông báo' : 'Lịch sử hoạt động'}</h1>
          <p className="mt-1 text-sm text-gray-500">{activeTab === 'shared-news' ? 'Cập nhật thông tin mới nhất từ Khoa và hệ thống.' : 'Theo dõi các thao tác đã thực hiện trên tài khoản.'}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 active:scale-[.98]">
            <ArrowClockwise size={17} className={loading ? 'animate-spin' : ''} /> Làm mới
          </button>
          {activeTab === 'shared-news' && isAdmin && <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-huit-blue px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#00264d] active:scale-[.98]"><Plus size={17} weight="bold" /> Đăng tin</button>}
        </div>
      </div>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {loading ? <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center text-sm text-gray-500">Đang tải dữ liệu…</div> : activeTab === 'shared-news' ? (
        news.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {news.map((item) => <article key={item.Id} className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            {item.HinhAnhDaiDien ? <img src={item.HinhAnhDaiDien} alt="" className="h-44 w-full bg-gray-100 object-cover" /> : <div className="flex h-36 items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 text-huit-blue"><Newspaper size={42} weight="duotone" /></div>}
            <div className="space-y-3 p-4">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-500"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-huit-blue">{audienceLabels[item.DoiTuongXem] || item.DoiTuongXem}</span>{item.GhimTin && <span className="inline-flex items-center gap-1 text-amber-600"><PushPin size={13} weight="fill" /> Ghim</span>}</div>
              <button onClick={() => void openArticle(item)} className="block text-left text-base font-bold leading-snug text-gray-900 transition group-hover:text-huit-blue">{item.TieuDe}</button>
              <p className="line-clamp-3 min-h-[3.75rem] text-sm leading-5 text-gray-600">{item.TomTat || item.NoiDung}</p>
              <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-400"><span className="inline-flex items-center gap-1.5"><CalendarBlank size={14} />{formatDate(item.CreatedAt)}</span><span className="inline-flex items-center gap-1"><Eye size={14} />{item.LuotXem || 0}</span></div>
              {isAdmin && <div className="flex gap-2"><button onClick={() => openEdit(item)} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"><PencilSimple size={14} /> Sửa</button><button onClick={() => void deleteNews(item)} className="inline-flex items-center gap-1 rounded-lg border border-red-100 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"><Trash size={14} /> Ẩn tin</button></div>}
            </div>
          </article>)}
        </div> : <EmptyState icon={<Newspaper size={30} />} title="Chưa có tin tức" text="Tin mới sẽ xuất hiện tại đây." />
      ) : activities.length ? <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"><div className="divide-y divide-gray-100">
        {activities.map((item) => <div key={item.Id} className="flex gap-3 p-4 sm:p-5"><div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-huit-blue"><ClockCounterClockwise size={19} weight="bold" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><p className="text-sm font-bold text-gray-900">{activityLabels[item.HanhDong] || item.HanhDong.replaceAll('_', ' ')}</p>{isAdmin && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">{item.NguoiDung?.TenDangNhap || `Tài khoản #${item.NguoiDungId}`}</span>}</div>{item.ChiTiet && <p className="mt-1 text-sm leading-5 text-gray-600">{item.ChiTiet}</p>}<p className="mt-2 text-xs text-gray-400">{formatDate(item.CreatedAt)}</p></div></div>)}
      </div></div> : <EmptyState icon={<ClockCounterClockwise size={30} />} title="Chưa có lịch sử hoạt động" text="Các thao tác quan trọng trên hệ thống sẽ được ghi lại tại đây." />}

      {formOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setFormOpen(false); }}><div role="dialog" aria-modal="true" aria-labelledby="news-form-title" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6"><div className="mb-5 flex items-start justify-between"><div><h2 id="news-form-title" className="text-xl font-black text-gray-900">{editing ? 'Chỉnh sửa tin tức' : 'Đăng tin mới'}</h2><p className="mt-1 text-sm text-gray-500">Tin sẽ hiển thị theo nhóm đối tượng bạn chọn.</p></div><button onClick={() => setFormOpen(false)} aria-label="Đóng" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><X size={20} /></button></div>
        <form onSubmit={saveNews} className="space-y-4"><label className="block text-sm font-semibold text-gray-700">Tiêu đề<input required minLength={4} maxLength={255} value={form.TieuDe} onChange={(e) => setForm({ ...form, TieuDe: e.target.value })} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-huit-blue focus:ring-2 focus:ring-blue-100" /></label>
          <label className="block text-sm font-semibold text-gray-700">Tóm tắt<textarea rows={2} maxLength={2000} value={form.TomTat} onChange={(e) => setForm({ ...form, TomTat: e.target.value })} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-huit-blue focus:ring-2 focus:ring-blue-100" /></label>
          <label className="block text-sm font-semibold text-gray-700">Nội dung<textarea required rows={8} maxLength={50000} value={form.NoiDung} onChange={(e) => setForm({ ...form, NoiDung: e.target.value })} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm leading-6 outline-none focus:border-huit-blue focus:ring-2 focus:ring-blue-100" /></label>
          <label className="block text-sm font-semibold text-gray-700">Đường dẫn ảnh bìa<input type="url" value={form.HinhAnhDaiDien} onChange={(e) => setForm({ ...form, HinhAnhDaiDien: e.target.value })} placeholder="https://…" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-huit-blue focus:ring-2 focus:ring-blue-100" /></label>
          <div className="flex flex-wrap items-center justify-between gap-3"><label className="text-sm font-semibold text-gray-700">Đối tượng xem<select value={form.DoiTuongXem} onChange={(e) => setForm({ ...form, DoiTuongXem: e.target.value })} className="ml-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"><option value="TatCa">Tất cả</option><option value="SinhVien">Sinh viên</option><option value="GiangVien">Giảng viên</option><option value="DoanhNghiep">Doanh nghiệp</option></select></label><label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><input type="checkbox" checked={form.GhimTin} onChange={(e) => setForm({ ...form, GhimTin: e.target.checked })} className="h-4 w-4 accent-[#003366]" /> Ghim lên đầu</label></div>
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4"><button type="button" onClick={() => setFormOpen(false)} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Hủy</button><button disabled={saving} className="rounded-xl bg-huit-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#00264d] disabled:cursor-wait disabled:opacity-60">{saving ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Đăng tin'}</button></div>
        </form></div></div>}

      {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><article role="dialog" aria-modal="true" aria-labelledby="article-title" className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">{selected.HinhAnhDaiDien && <img src={selected.HinhAnhDaiDien} alt="" className="max-h-72 w-full bg-gray-100 object-cover" />}<div className="p-5 sm:p-8"><div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-gray-500"><span className="rounded-full bg-blue-50 px-2.5 py-1 font-semibold text-huit-blue">{audienceLabels[selected.DoiTuongXem] || selected.DoiTuongXem}</span><span>{formatDate(selected.CreatedAt)}</span></div><div className="flex justify-between gap-4"><h2 id="article-title" className="text-2xl font-black leading-tight text-gray-900">{selected.TieuDe}</h2><button onClick={() => setSelected(null)} aria-label="Đóng" className="h-fit rounded-lg p-2 text-gray-500 hover:bg-gray-100"><X size={20} /></button></div>{selected.TomTat && <p className="mt-4 border-l-4 border-huit-blue pl-4 text-base font-medium leading-7 text-gray-600">{selected.TomTat}</p>}<p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-gray-700">{selected.NoiDung}</p>{isAdmin && <div className="mt-6 flex gap-2 border-t border-gray-100 pt-4"><button onClick={() => openEdit(selected)} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"><PencilSimple size={16} /> Chỉnh sửa</button><button onClick={() => void deleteNews(selected)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"><Trash size={16} /> Ẩn tin</button></div>}</div></article></div>}
    </section>
  );
}

function EmptyState({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-huit-blue">{icon}</div><h2 className="mt-4 text-base font-bold text-gray-900">{title}</h2><p className="mt-1 text-sm text-gray-500">{text}</p></div>;
}
