import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireAffiliate } from '@/lib/api-auth';
import { ensureMinioBucket, getMinioPublicUrl, minioBucket, minioClient } from '@/lib/minio';
export const runtime = 'nodejs';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

const extensionFor = (mimeType: string) => {
  switch (mimeType) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return 'jpg';
  }
};

export async function POST(request: NextRequest) {
  const auth = await requireAffiliate(request);
  if ('response' in auth) return auth.response;

  const formData = await request.formData();
  const avatar = formData.get('avatar');

  if (!(avatar instanceof File)) {
    return NextResponse.json({ success: false, error: 'Avatar file is required' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(avatar.type)) {
    return NextResponse.json({ success: false, error: 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP' }, { status: 400 });
  }

  if (avatar.size > MAX_AVATAR_SIZE) {
    return NextResponse.json({ success: false, error: 'Avatar tối đa 2MB' }, { status: 400 });
  }

  const buffer = Buffer.from(await avatar.arrayBuffer());
  const objectName = `avatars/${auth.user.id}/${randomUUID()}.${extensionFor(avatar.type)}`;

  await ensureMinioBucket();
  await minioClient.putObject(minioBucket, objectName, buffer, buffer.length, {
    'Content-Type': avatar.type,
    'Cache-Control': 'public, max-age=31536000, immutable',
  });

  const profilePicture = getMinioPublicUrl(objectName);

  return NextResponse.json({ success: true, profilePicture });
}
