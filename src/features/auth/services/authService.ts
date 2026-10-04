import { UserSession } from '@/types/database.types';

export const authService = {
  async logout(): Promise<void> {
    await fetch('/api/auth/logout', { method: 'POST' });
  },

  async login(
    type: 'sinhvien' | 'doanhnghiep' | 'giangvien',
    identifier: string,
    password?: string
  ): Promise<UserSession> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, identifier, password }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Đăng nhập không thành công');
    }

    return data.session;
  },
};
