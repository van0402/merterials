import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAffiliate } from '@/lib/api-auth';

// GET: List active resources for affiliates
export async function GET(request: NextRequest) {
  try {
    const affiliateAuth = await requireAffiliate(request);
    if ('response' in affiliateAuth) return affiliateAuth.response;

    const resources = await prisma.resource.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      resources: resources.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        type: r.type,
        fileUrl: r.fileUrl,
        fileName: r.fileName,
        fileSize: r.fileSize,
        mimeType: r.mimeType,
        category: r.category,
        downloads: r.downloads,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Affiliate resources API error:', error);
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
  }
}

// POST: Track download (increment counter)
export async function POST(request: NextRequest) {
  try {
    const affiliateAuth = await requireAffiliate(request);
    if ('response' in affiliateAuth) return affiliateAuth.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id')?.trim();

    if (!id) {
      return NextResponse.json({ error: 'Resource ID required' }, { status: 400 });
    }

    const result = await prisma.resource.updateMany({
      where: { id, isActive: true },
      data: { downloads: { increment: 1 } },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track download error:', error);
    return NextResponse.json({ error: 'Failed to track download' }, { status: 500 });
  }
}
