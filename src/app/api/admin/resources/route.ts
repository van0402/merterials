import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';

const allowedResourceTypes = new Set(['BANNER', 'SOCIAL_POST', 'VIDEO', 'OTHER']);

function cleanString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function normalizeFileUrl(value: unknown): string | null {
  const fileUrl = cleanString(value);
  if (!fileUrl) return null;

  try {
    // Accept regular external links and local/public app paths.
    if (fileUrl.startsWith('/')) return fileUrl;
    const parsed = new URL(fileUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function deriveFileName(fileUrl: string, fallbackTitle: string): string {
  try {
    const parsed = fileUrl.startsWith('/')
      ? new URL(fileUrl, 'http://localhost')
      : new URL(fileUrl);
    const segments = parsed.pathname.split('/').filter(Boolean);
    const lastPathSegment = segments.at(-1);
    const genericDriveSegment = ['view', 'preview', 'edit'].includes(lastPathSegment ?? '');
    if (lastPathSegment && !genericDriveSegment) return decodeURIComponent(lastPathSegment);
  } catch {
    // Fall back below.
  }

  return fallbackTitle
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'resource-link';
}

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((tag) => cleanString(tag))
    .filter((tag): tag is string => Boolean(tag));
}

// GET: List all resources
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  try {
    const resources = await prisma.resource.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, resources });
  } catch (error) {
    console.error('Admin resources GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
  }
}

// POST: Create resource
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  const user = auth.user;

  try {
    const body = await request.json();
    const title = cleanString(body.title);
    const description = cleanString(body.description) ?? null;
    const type = cleanString(body.type);
    const fileUrl = normalizeFileUrl(body.fileUrl ?? body.url ?? body.link);
    const category = cleanString(body.category) ?? null;
    const mimeType = cleanString(body.mimeType) ?? null;
    const fileSize = Number.isInteger(body.fileSize) && body.fileSize > 0 ? body.fileSize : null;

    if (!title || !type || !fileUrl) {
      return NextResponse.json({ error: 'Title, type, and link are required' }, { status: 400 });
    }
    if (!allowedResourceTypes.has(type)) {
      return NextResponse.json({ error: 'Invalid resource type' }, { status: 400 });
    }

    const fileName = cleanString(body.fileName) ?? deriveFileName(fileUrl, title);

    const resource = await prisma.resource.create({
      data: {
        title,
        description,
        type,
        fileUrl,
        fileName,
        fileSize,
        mimeType,
        category,
        tags: normalizeTags(body.tags),
        isActive: typeof body.isActive === 'boolean' ? body.isActive : true,
        createdBy: user.id,
      },
    });

    return NextResponse.json({ success: true, resource });
  } catch (error) {
    console.error('Admin resources POST error:', error);
    return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 });
  }
}

// PUT: Update resource
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  try {
    const body = await request.json();
    const id = cleanString(body.id);

    if (!id) {
      return NextResponse.json({ error: 'Resource ID required' }, { status: 400 });
    }

    const updates: Record<string, any> = {};

    if ('title' in body) {
      const title = cleanString(body.title);
      if (!title) return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
      updates.title = title;
    }
    if ('description' in body) updates.description = cleanString(body.description) ?? null;
    if ('type' in body) {
      const type = cleanString(body.type);
      if (!type || !allowedResourceTypes.has(type)) {
        return NextResponse.json({ error: 'Invalid resource type' }, { status: 400 });
      }
      updates.type = type;
    }
    if ('fileUrl' in body || 'url' in body || 'link' in body) {
      const fileUrl = normalizeFileUrl(body.fileUrl ?? body.url ?? body.link);
      if (!fileUrl) return NextResponse.json({ error: 'Invalid link' }, { status: 400 });
      updates.fileUrl = fileUrl;
      if (!cleanString(body.fileName)) {
        updates.fileName = deriveFileName(fileUrl, cleanString(body.title) ?? 'resource-link');
      }
    }
    if ('fileName' in body) {
      const fileName = cleanString(body.fileName);
      if (fileName) updates.fileName = fileName;
    }
    if ('fileSize' in body) {
      updates.fileSize = Number.isInteger(body.fileSize) && body.fileSize > 0 ? body.fileSize : null;
    }
    if ('mimeType' in body) updates.mimeType = cleanString(body.mimeType) ?? null;
    if ('category' in body) updates.category = cleanString(body.category) ?? null;
    if ('tags' in body) updates.tags = normalizeTags(body.tags);
    if ('isActive' in body) updates.isActive = Boolean(body.isActive);

    const resource = await prisma.resource.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ success: true, resource });
  } catch (error) {
    console.error('Admin resources PUT error:', error);
    return NextResponse.json({ error: 'Failed to update resource' }, { status: 500 });
  }
}

// DELETE: Delete resource
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  try {
    const body = await request.json();
    const id = cleanString(body.id);

    if (!id) {
      return NextResponse.json({ error: 'Resource ID required' }, { status: 400 });
    }

    await prisma.resource.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin resources DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 });
  }
}
