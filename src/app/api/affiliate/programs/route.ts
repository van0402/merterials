import { NextRequest, NextResponse } from 'next/server';
import { requireAffiliate } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await requireAffiliate(request);
  if ('response' in auth) return auth.response;

  try {
    const affiliate = await prisma.affiliate.findUnique({ where: { userId: auth.user.id } });
    if (!affiliate) {
      return NextResponse.json({ success: false, error: 'KOL/KOC profile not found' }, { status: 404 });
    }

    const programs = await prisma.program.findMany({
      where: {
        isActive: true,
        OR: [
          { visibility: 'PUBLIC' },
          {
            visibility: 'PRIVATE',
            affiliatePrograms: {
              some: {
                affiliateId: affiliate.id,
                status: { in: ['PENDING', 'ACTIVE'] },
              },
            },
          },
        ],
      },
      include: {
        affiliatePrograms: {
          where: { affiliateId: affiliate.id },
          select: { status: true, assignedByAdmin: true, joinedAt: true },
        },
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({
      success: true,
      programs: programs.map((program) => {
        const assignment = program.affiliatePrograms[0];
        return {
          id: program.id,
          name: program.name,
          slug: program.slug,
          description: program.description,
          commissionRate: program.commissionRate,
          commissionType: program.commissionType,
          cookieDuration: program.cookieDuration,
          currency: program.currency,
          visibility: program.visibility,
          isDefault: program.isDefault,
          autoApprove: program.autoApprove,
          minPayoutCents: program.minPayoutCents,
          payoutFrequency: program.payoutFrequency,
          termsUrl: program.termsUrl,
          logoUrl: program.logoUrl,
          bannerUrl: program.bannerUrl,
          brandColor: program.brandColor,
          productDescription: program.productDescription,
          servicePrice: program.servicePrice,
          estimatedCommission: program.estimatedCommission,
          campaignAssets: program.campaignAssets,
          contentSuggestions: program.contentSuggestions,
          supportUrl: program.supportUrl,
          supportLabel: program.supportLabel,
          assignmentStatus: assignment?.status ?? null,
          assignedByAdmin: assignment?.assignedByAdmin ?? false,
          joinedAt: assignment?.joinedAt ?? null,
        };
      }),
    });
  } catch (error) {
    console.error('Affiliate programs GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch programs' }, { status: 500 });
  }
}
