import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api-auth';
import { readObject } from '@/lib/minio';

const TYPE_BY_EXT: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const auth = await requireUser(request);
  if ('response' in auth) return auth.response;

  const { name } = await params;
  if (!/^[\w-]+\.(pdf|png|jpg|webp)$/.test(name)) {
    return NextResponse.json({ success: false, error: 'Tên file không hợp lệ' }, { status: 400 });
  }

  // Tên file bắt đầu bằng id người tải lên (xem api/supplier/upload)
  const isOwner = name.startsWith(`${auth.user.id}-`);
  if (!isOwner && auth.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Không có quyền xem file này' }, { status: 403 });
  }

  const buffer = await readObject(`supplier-documents/${name}`);
  if (!buffer) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy file' }, { status: 404 });
  }

  const ext = name.split('.').pop() as string;
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': TYPE_BY_EXT[ext],
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}