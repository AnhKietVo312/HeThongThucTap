import { NextResponse } from 'next/server';
import { uploadPrivateFile } from '@/lib/supabase';
import { isAuthError, requireRoles } from '@/lib/server-auth';

export async function POST(request: Request) {
  try {
    const actor = requireRoles(request, ['SinhVien']);
    if (isAuthError(actor)) return actor;
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const bucketType = (formData.get('bucketType') as string) || 'private'; // 'public' | 'private'
    const customPath = (formData.get('path') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'Không tìm thấy tệp tải lên' }, { status: 400 });
    }
    if (!actor.sinhVienId) return NextResponse.json({ error: 'Tài khoản chưa được liên kết hồ sơ sinh viên.' }, { status: 403 });
    if (file.type !== 'application/pdf' || file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Chỉ nhận tệp PDF tối đa 10 MB.' }, { status: 400 });
    const allowedPrefix = new RegExp(`^(cv|reports)/${actor.sinhVienId}/`);
    if (bucketType !== 'private' || !allowedPrefix.test(customPath)) return NextResponse.json({ error: 'Đường dẫn tệp không hợp lệ.' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = customPath;

    const result = await uploadPrivateFile(fileName, buffer, file.type);
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ success: true, path: result.path, name: file.name });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lỗi tải lên tệp tin' },
      { status: 500 }
    );
  }
}
