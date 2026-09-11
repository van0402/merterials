import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { requireAdmin } from '@/lib/api-auth';
import { ensureMinioBucket, getMinioPublicUrl, minioBucket, minioClient } from '@/lib/minio';

const MAX_SIZE = 8 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    if (!EXTENSIONS[file.type]) {
      return NextResponse.json({ success: false, error: 'Only JPG, PNG or WebP images are allowed' }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ success: false, error: 'Uploaded image is empty. Please choose the image again.' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, error: 'Image must be smaller than 8MB' }, { status: 400 });
    }

    const extension = EXTENSIONS[file.type];
    const fileName = `${Date.now()}-${randomUUID()}.${extension}`;
    const objectName = `program-banners/${fileName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    try {
      await ensureMinioBucket();
      await minioClient.putObject(minioBucket, objectName, buffer, buffer.length, {
        'Content-Type': file.type,
        'Cache-Control': 'public, max-age=31536000, immutable',
      });

      return NextResponse.json({
        success: true,
        url: getMinioPublicUrl(objectName),
      });
    } catch (storageError) {
      console.warn('MinIO banner upload failed; falling back to local public upload:', storageError);

      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'program-banners');
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, fileName), buffer);

      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
      const publicPath = `/uploads/program-banners/${fileName}`;

      return NextResponse.json({
        success: true,
        url: appUrl ? `${appUrl}${publicPath}` : publicPath,
      });
    }
  } catch (error) {
    console.error('Program banner upload error:', error);
    return NextResponse.json({ success: false, error: 'Failed to upload banner. Please check storage configuration.' }, { status: 500 });
  }
}
