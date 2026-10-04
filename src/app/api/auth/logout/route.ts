import { createLogoutResponse, getSession } from '@/lib/server-auth';
import { recordActivity } from '@/lib/activity-log';

export async function POST(request: Request) {
  const session = getSession(request);
  await recordActivity(session?.nguoiDungId, 'DANG_XUAT', 'Đăng xuất khỏi hệ thống.', request);
  return createLogoutResponse();
}
