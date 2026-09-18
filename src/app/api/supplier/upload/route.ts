import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { requireUser } from '@/lib/api-auth';
import { minioClient, minioBucket, ensureMinioBucket, getMinioPublicUrl } from '@/lib/minio';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_FOLDERS = ['supplier-documents', 'supplier-logos'];

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if ('response' in auth) return auth.response;

  const formData = await request.formData();
  const file = formData.get('file');
  const folder = formData.get('folder');

  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, error: 'Thiếu file' }, { status: 400 });
  }
  if (typeof folder !== 'string' || !ALLOWED_FOLDERS.includes(folder)) {
    return NextResponse.json({ success: false, error: 'Thư mục không hợp lệ' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ success: false, error: 'Chỉ chấp nhận PNG, JPG, WEBP hoặc PDF' }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ success: false, error: 'File vượt quá 10MB' }, { status: 400 });
  }

  await ensureMinioBucket();

  const ext = file.name.split('.').pop() || 'bin';
  const objectName = `${folder}/${auth.user.id}-${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await minioClient.putObject(minioBucket, objectName, buffer, buffer.length, {
    'Content-Type': file.type,
  });

  return NextResponse.json({ success: true, url: getMinioPublicUrl(objectName) });
}
