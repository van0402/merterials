import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { requireUser } from '@/lib/api-auth';
import { minioClient, minioBucket, ensureMinioBucket, getMinioPublicUrl, getMinioObjectNameFromUrl } from '@/lib/minio';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_FOLDERS = ['supplier-documents', 'supplier-logos', 'supplier-covers', 'material-images', 'supplier-gallery'];
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

export async function DELETE(request: NextRequest) {
  const auth = await requireUser(request);
  if ('response' in auth) return auth.response;

  const body = await request.json().catch(() => null);
  const url = body?.url;
  if (typeof url !== 'string') {
    return NextResponse.json({ success: false, error: 'Thiếu url' }, { status: 400 });
  }

  const objectName = getMinioObjectNameFromUrl(url);
  if (!objectName || !ALLOWED_FOLDERS.some((folder) => objectName.startsWith(`${folder}/`))) {
    return NextResponse.json({ success: false, error: 'URL không hợp lệ' }, { status: 400 });
  }

  const fileName = objectName.split('/')[1] ?? '';
  const isOwner = fileName.startsWith(`${auth.user.id}-`);
  if (!isOwner && auth.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Không có quyền xoá file này' }, { status: 403 });
  }

  try {
    await minioClient.removeObject(minioBucket, objectName);
  } catch (error) {
    console.warn('Xoá file MinIO thất bại (bỏ qua):', error);
  }

  return NextResponse.json({ success: true });
}
