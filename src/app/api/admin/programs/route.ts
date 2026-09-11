import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';
import {
  createProgramAssignedNotification,
  createProgramAvailableNotifications,
} from '@/lib/notification-service';

const PROGRAM_VISIBILITIES = new Set(['PUBLIC', 'PRIVATE']);
const COMMISSION_TYPES = new Set(['PERCENTAGE', 'FIXED', 'TIERED']);
const PAYOUT_FREQUENCIES = new Set(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY']);
const SUPPORTED_CURRENCIES = new Set(['VND', 'USD', 'EUR', 'GBP', 'INR']);
const ASSIGNMENT_STATUSES = new Set(['PENDING', 'ACTIVE', 'REJECTED', 'REMOVED']);

function normalizeSlug(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
}

function numberOrUndefined(value: unknown) {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function intOrUndefined(value: unknown) {
  const parsed = numberOrUndefined(value);
  return parsed === undefined ? undefined : Math.trunc(parsed);
}

function textOrNull(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function isUrl(value: string | null) {
  return /^https?:\/\//i.test(value || '');
}

function normalizeExternalUrl(value: unknown) {
  const text = textOrNull(value);
  if (!text) return null;
  if (/^(https?:\/\/|mailto:|tel:)/i.test(text)) return text;
  return `https://${text.replace(/^\/+/, '')}`;
}

function normalizeCampaignAssets(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') {
        const url = normalizeExternalUrl(item);
        if (!url) return null;
        return { type: 'file', title: 'Link tài nguyên chiến dịch', url, note: null };
      }
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      let title = textOrNull(record.title);
      let url = normalizeExternalUrl(record.url);
      if (!url && isUrl(title)) {
        url = title;
        title = 'Link tài nguyên chiến dịch';
      }
      if (!title && !url) return null;
      const type = String(record.type || 'file').toLowerCase();
      return {
        type: ['video', 'image', 'file', 'drive'].includes(type) ? type : 'file',
        title: title || url,
        url,
        note: textOrNull(record.note),
      };
    })
    .filter(Boolean);
}

function normalizeContentSuggestions(value: unknown) {
  if (typeof value === 'string') {
    const body = textOrNull(value);
    return body ? [{ title: 'Gợi ý content', body, url: null }] : [];
  }
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') {
        const body = textOrNull(item);
        return body ? { title: 'Gợi ý content', body, url: null } : null;
      }
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const title = textOrNull(record.title);
      const body = textOrNull(record.body) || (isUrl(title) ? title : null);
      if (!title && !body) return null;
      return { title: isUrl(title) ? 'Gợi ý content' : title || 'Gợi ý content', body, url: null };
    })
    .filter(Boolean);
}

function invalid(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

async function setOnlyDefault(programId: string) {
  await prisma.$transaction([
    prisma.program.updateMany({ where: { isDefault: true, id: { not: programId } }, data: { isDefault: false } }),
    prisma.program.update({ where: { id: programId }, data: { isDefault: true } }),
  ]);
}

async function safelyCreateNotifications(task: () => Promise<unknown>) {
  try {
    await task();
  } catch (error) {
    console.error('Program notification error:', error);
  }
}

// GET: List all programs
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  try {
    const programs = await prisma.program.findMany({
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      include: {
        _count: { select: { affiliatePrograms: true } },
        affiliatePrograms: {
          where: { status: { in: ['PENDING', 'ACTIVE'] } },
          include: { affiliate: { include: { user: { select: { id: true, name: true, email: true, status: true } } } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return NextResponse.json({ success: true, programs });
  } catch (error) {
    console.error('Admin programs GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch programs' }, { status: 500 });
  }
}

// POST: Create program, or assign/unassign an affiliate to a private/public program
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  try {
    const body = await request.json();

    if (body.action === 'assign') {
      const { programId, affiliateId } = body;
      const status = String(body.status || 'ACTIVE').toUpperCase();
      if (!programId || !affiliateId) return invalid('Program ID and affiliate ID are required');
      if (!ASSIGNMENT_STATUSES.has(status)) return invalid('Invalid assignment status');

      const assignment = await prisma.affiliateProgram.upsert({
        where: { affiliateId_programId: { affiliateId, programId } },
        create: {
          affiliateId,
          programId,
          status: status as any,
          assignedByAdmin: true,
          assignedBy: auth.user.id,
          joinedAt: status === 'ACTIVE' ? new Date() : null,
        },
        update: {
          status: status as any,
          assignedByAdmin: true,
          assignedBy: auth.user.id,
          joinedAt: status === 'ACTIVE' ? new Date() : null,
        },
        include: {
          affiliate: { select: { userId: true } },
          program: { select: { id: true, name: true, commissionRate: true, cookieDuration: true } },
        },
      });

      if (status === 'ACTIVE') {
        await safelyCreateNotifications(() => createProgramAssignedNotification({
          userId: assignment.affiliate.userId,
          programId: assignment.program.id,
          programName: assignment.program.name,
          commissionRate: assignment.program.commissionRate,
          cookieDuration: assignment.program.cookieDuration,
        }));
      }

      return NextResponse.json({ success: true, assignment });
    }

    if (body.action === 'unassign') {
      const { programId, affiliateId } = body;
      if (!programId || !affiliateId) return invalid('Program ID and affiliate ID are required');
      await prisma.affiliateProgram.delete({ where: { affiliateId_programId: { affiliateId, programId } } });
      return NextResponse.json({ success: true });
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const slug = normalizeSlug(String(body.slug || name));
    const visibility = String(body.visibility || 'PUBLIC').toUpperCase();
    const commissionType = String(body.commissionType || 'PERCENTAGE').toUpperCase();
    const payoutFrequency = String(body.payoutFrequency || 'MONTHLY').toUpperCase();
    const currency = String(body.currency || 'VND').toUpperCase();
    const commissionRate = numberOrUndefined(body.commissionRate) ?? 20;
    const cookieDuration = intOrUndefined(body.cookieDuration) ?? 30;
    const minPayoutCents = intOrUndefined(body.minPayoutCents) ?? 100000;

    if (!name || !slug) return invalid('Name and slug are required');
    if (!PROGRAM_VISIBILITIES.has(visibility)) return invalid('Invalid program visibility');
    if (!COMMISSION_TYPES.has(commissionType)) return invalid('Invalid commission type');
    if (!PAYOUT_FREQUENCIES.has(payoutFrequency)) return invalid('Invalid payout frequency');
    if (!SUPPORTED_CURRENCIES.has(currency)) return invalid('Unsupported currency');
    if (commissionRate < 0 || commissionRate > 100) return invalid('Commission rate must be between 0 and 100');
    if (cookieDuration < 1 || cookieDuration > 3650) return invalid('Cookie duration must be between 1 and 3650 days');
    if (minPayoutCents < 0) return invalid('Minimum payout must be greater than or equal to 0');

    const existing = await prisma.program.findUnique({ where: { slug } });
    if (existing) return invalid('Slug already exists');

    const program = await prisma.program.create({
      data: {
        name,
        slug,
        description: body.description || null,
        commissionRate,
        commissionType,
        cookieDuration,
        currency,
        visibility: visibility as any,
        autoApprove: Boolean(body.autoApprove),
        minPayoutCents,
        payoutFrequency,
        termsUrl: normalizeExternalUrl(body.termsUrl),
        logoUrl: normalizeExternalUrl(body.logoUrl),
        bannerUrl: normalizeExternalUrl(body.bannerUrl),
        brandColor: body.brandColor || '#10b981',
        productDescription: textOrNull(body.productDescription),
        servicePrice: textOrNull(body.servicePrice),
        estimatedCommission: textOrNull(body.estimatedCommission),
        campaignAssets: normalizeCampaignAssets(body.campaignAssets),
        contentSuggestions: normalizeContentSuggestions(body.contentSuggestions),
        supportUrl: normalizeExternalUrl(body.supportUrl),
        supportLabel: textOrNull(body.supportLabel),
        isDefault: Boolean(body.isDefault),
      },
    });

    if (body.isDefault) await setOnlyDefault(program.id);

    if (program.isActive && program.visibility === 'PUBLIC') {
      await safelyCreateNotifications(() => createProgramAvailableNotifications(program));
    }

    return NextResponse.json({ success: true, program });
  } catch (error) {
    console.error('Admin programs POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create program' }, { status: 500 });
  }
}

// PUT: Update program
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  try {
    const body = await request.json();
    const { id } = body;
    if (!id) return invalid('Program ID required');

    const updates: Record<string, any> = {};
    if (typeof body.name === 'string') updates.name = body.name.trim();
    if (typeof body.slug === 'string') updates.slug = normalizeSlug(body.slug);
    if ('description' in body) updates.description = body.description || null;
    if ('commissionRate' in body) updates.commissionRate = numberOrUndefined(body.commissionRate);
    if ('commissionType' in body) updates.commissionType = String(body.commissionType).toUpperCase();
    if ('cookieDuration' in body) updates.cookieDuration = intOrUndefined(body.cookieDuration);
    if ('currency' in body) updates.currency = String(body.currency).toUpperCase();
    if ('visibility' in body) updates.visibility = String(body.visibility).toUpperCase();
    if ('isActive' in body) updates.isActive = Boolean(body.isActive);
    if ('autoApprove' in body) updates.autoApprove = Boolean(body.autoApprove);
    if ('minPayoutCents' in body) updates.minPayoutCents = intOrUndefined(body.minPayoutCents);
    if ('payoutFrequency' in body) updates.payoutFrequency = String(body.payoutFrequency).toUpperCase();
    if ('termsUrl' in body) updates.termsUrl = normalizeExternalUrl(body.termsUrl);
    if ('logoUrl' in body) updates.logoUrl = normalizeExternalUrl(body.logoUrl);
    if ('bannerUrl' in body) updates.bannerUrl = normalizeExternalUrl(body.bannerUrl);
    if ('brandColor' in body) updates.brandColor = body.brandColor || null;
    if ('productDescription' in body) updates.productDescription = textOrNull(body.productDescription);
    if ('servicePrice' in body) updates.servicePrice = textOrNull(body.servicePrice);
    if ('estimatedCommission' in body) updates.estimatedCommission = textOrNull(body.estimatedCommission);
    if ('campaignAssets' in body) updates.campaignAssets = normalizeCampaignAssets(body.campaignAssets);
    if ('contentSuggestions' in body) updates.contentSuggestions = normalizeContentSuggestions(body.contentSuggestions);
    if ('supportUrl' in body) updates.supportUrl = normalizeExternalUrl(body.supportUrl);
    if ('supportLabel' in body) updates.supportLabel = textOrNull(body.supportLabel);

    if ('commissionRate' in updates && (updates.commissionRate === undefined || updates.commissionRate < 0 || updates.commissionRate > 100)) {
      return invalid('Commission rate must be between 0 and 100');
    }
    if ('cookieDuration' in updates && (!updates.cookieDuration || updates.cookieDuration < 1 || updates.cookieDuration > 3650)) {
      return invalid('Cookie duration must be between 1 and 3650 days');
    }
    if ('minPayoutCents' in updates && (updates.minPayoutCents === undefined || updates.minPayoutCents < 0)) {
      return invalid('Minimum payout must be greater than or equal to 0');
    }
    if ('currency' in updates && !SUPPORTED_CURRENCIES.has(updates.currency)) return invalid('Unsupported currency');
    if ('visibility' in updates && !PROGRAM_VISIBILITIES.has(updates.visibility)) return invalid('Invalid program visibility');
    if ('commissionType' in updates && !COMMISSION_TYPES.has(updates.commissionType)) return invalid('Invalid commission type');
    if ('payoutFrequency' in updates && !PAYOUT_FREQUENCIES.has(updates.payoutFrequency)) return invalid('Invalid payout frequency');

    if (body.isDefault === true) {
      await setOnlyDefault(id);
      delete updates.isDefault;
    }

    const program = Object.keys(updates).length
      ? await prisma.program.update({ where: { id }, data: updates })
      : await prisma.program.findUnique({ where: { id } });

    return NextResponse.json({ success: true, program });
  } catch (error: any) {
    console.error('Admin programs PUT error:', error);
    if (error?.code === 'P2002') return invalid('Slug already exists');
    return NextResponse.json({ success: false, error: 'Failed to update program' }, { status: 500 });
  }
}

// DELETE: Delete program
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return invalid('Program ID required');

    const program = await prisma.program.findUnique({
      where: { id },
      include: { _count: { select: { affiliatePrograms: true } } },
    });
    if (!program) return invalid('Program not found', 404);
    if (program.isDefault) return invalid('Default program cannot be deleted');
    if (program._count.affiliatePrograms > 0) return invalid('Program has affiliate assignments and cannot be deleted');

    await prisma.program.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin programs DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete program' }, { status: 500 });
  }
}
