import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { requireAffiliate } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { buildXlsxBuffer } from '@/lib/report-export';

interface DateRange {
  gte?: Date;
  lte?: Date;
}

type ReportAttribution = Prisma.AttributionGetPayload<{
  include: {
    conversions: {
      include: { commissions: true };
    };
  };
}>;

type ReportReferral = Prisma.ReferralGetPayload<{
  include: {
    conversions: { include: { commissions: true } };
  };
}>;

type ReportConversion = Prisma.ConversionGetPayload<{
  include: { commissions: true };
}>;

const REPORT_TIME_ZONE = 'Asia/Ho_Chi_Minh';

function parseDateRange(request: NextRequest): DateRange {
  const url = new URL(request.url);
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');
  const range: DateRange = {};

  if (startDate) {
    const start = new Date(`${startDate}T00:00:00.000+07:00`);
    if (!Number.isNaN(start.getTime())) range.gte = start;
  }

  if (endDate) {
    const end = new Date(`${endDate}T23:59:59.999+07:00`);
    if (!Number.isNaN(end.getTime())) range.lte = end;
  }

  return range;
}

function hasDateRange(range: DateRange) {
  return Boolean(range.gte || range.lte);
}

function dateWhere(range: DateRange) {
  return hasDateRange(range) ? { createdAt: range } : {};
}

function datePart(date: Date, partName: 'year' | 'month' | 'day') {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: REPORT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  return parts.find((part) => part.type === partName)?.value ?? '';
}

function dayKey(date: Date) {
  return `${datePart(date, 'year')}-${datePart(date, 'month')}-${datePart(date, 'day')}`;
}

function monthKey(date: Date) {
  return `${datePart(date, 'year')}-${datePart(date, 'month')}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('vi-VN', {
    month: 'short',
    year: 'numeric',
    timeZone: REPORT_TIME_ZONE,
  });
}

function addMonthKey(key: string) {
  const [year, month] = key.split('-').map(Number);
  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  return `${next.year}-${String(next.month).padStart(2, '0')}`;
}

function buildMonthBuckets(range: DateRange) {
  const now = new Date();
  const fallbackStart = new Date(now);
  fallbackStart.setMonth(fallbackStart.getMonth() - 5);
  const startKey = monthKey(range.gte ?? fallbackStart);
  const endKey = monthKey(range.lte ?? now);
  const buckets: Record<string, { month: string; totalClicks: number; uniqueClicks: number; conversions: number; estimatedRevenueCents: number; estimatedCommissionCents: number }> = {};

  for (let key = startKey; key <= endKey; key = addMonthKey(key)) {
    buckets[key] = {
      month: monthLabel(key),
      totalClicks: 0,
      uniqueClicks: 0,
      conversions: 0,
      estimatedRevenueCents: 0,
      estimatedCommissionCents: 0,
    };
  }

  return buckets;
}

function metadataObject(value: Prisma.JsonValue): Record<string, Prisma.JsonValue> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, Prisma.JsonValue>
    : {};
}

function utmCodeFromTargetUrl(targetUrl: string | null, referralCode: string) {
  if (!targetUrl) return referralCode;

  try {
    const parsed = new URL(targetUrl);
    const params = parsed.searchParams;
    const parts = [
      params.get('utm_source'),
      params.get('utm_medium'),
      params.get('utm_campaign'),
      params.get('utm_content'),
      params.get('utm_term'),
    ].filter(Boolean);

    if (parts.length > 0) return parts.join(' / ');
    return `${parsed.hostname}${parsed.pathname === '/' ? '' : parsed.pathname}`;
  } catch {
    return targetUrl;
  }
}

function uniqueClickKey(attribution: Pick<ReportAttribution, 'createdAt' | 'ipAddress' | 'userAgent' | 'key'>) {
  return [
    dayKey(attribution.createdAt),
    attribution.ipAddress || 'unknown-ip',
    attribution.userAgent || attribution.key,
  ].join('|');
}

function ownCommissions(conversion: ReportConversion | ReportAttribution['conversions'][number] | ReportReferral['conversions'][number], affiliateId: string) {
  return conversion.commissions.filter((commission) => commission.affiliateId === affiliateId && !['CANCELLED', 'CLAWBACK'].includes(commission.status));
}

function commissionSum(conversion: ReportConversion | ReportAttribution['conversions'][number] | ReportReferral['conversions'][number], affiliateId: string) {
  return ownCommissions(conversion, affiliateId).reduce((sum, commission) => sum + commission.amountCents, 0);
}

function isValidConversion(conversion: { status: string }) {
  return conversion.status !== 'REJECTED';
}

function csvEscape(value: unknown) {
  const text = value == null ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCSV(sections: { title: string; rows: Record<string, unknown>[] }[]) {
  return sections.map((section) => {
    if (section.rows.length === 0) return section.title;
    const headers = Object.keys(section.rows[0]);
    const lines = [section.title, headers.join(',')];
    for (const row of section.rows) {
      lines.push(headers.map((header) => csvEscape(row[header])).join(','));
    }
    return lines.join('\n');
  }).join('\n\n');
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAffiliate(request);
    if ('response' in auth) return auth.response;

    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: auth.user.id },
      include: { user: true },
    });
    if (!affiliate) {
      return NextResponse.json({ success: false, error: 'KOL/KOC profile not found' }, { status: 404 });
    }

    const range = parseDateRange(request);
    const createdAtFilter = dateWhere(range);
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'json';

    const conversionWhere: Prisma.ConversionWhereInput = {
      ...createdAtFilter,
      status: { not: 'REJECTED' },
      OR: [
        { affiliateId: affiliate.id },
        { commissions: { some: { affiliateId: affiliate.id } } },
      ],
    };

    const [programSettings, attributions, referrals, conversions] = await Promise.all([
      prisma.programSettings.findFirst({ select: { currency: true } }),
      prisma.attribution.findMany({
        where: { affiliateId: affiliate.id, ...createdAtFilter },
        include: {
          conversions: {
            where: { status: { not: 'REJECTED' } },
            include: { commissions: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.referral.findMany({
        where: { affiliateId: affiliate.id, ...createdAtFilter },
        include: {
          conversions: {
            where: { status: { not: 'REJECTED' } },
            include: { commissions: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.conversion.findMany({
        where: conversionWhere,
        include: { commissions: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const currency = programSettings?.currency ?? 'VND';
    const uniqueClicks = new Set(attributions.map(uniqueClickKey));
    const estimatedRevenueCents = conversions.reduce((sum, conversion) => sum + conversion.amountCents, 0);
    const estimatedCommissionCents = conversions.reduce((sum, conversion) => sum + commissionSum(conversion, affiliate.id), 0);
    const conversionRate = uniqueClicks.size > 0 ? (conversions.length / uniqueClicks.size) * 100 : 0;

    const utmMap = new Map<string, {
      utmCode: string;
      totalClicks: number;
      uniqueClickKeys: Set<string>;
      conversions: Set<string>;
      estimatedRevenueCents: number;
      estimatedCommissionCents: number;
    }>();

    for (const attribution of attributions) {
      const utmCode = utmCodeFromTargetUrl(attribution.targetUrl, affiliate.referralCode);
      const row = utmMap.get(utmCode) ?? {
        utmCode,
        totalClicks: 0,
        uniqueClickKeys: new Set<string>(),
        conversions: new Set<string>(),
        estimatedRevenueCents: 0,
        estimatedCommissionCents: 0,
      };

      row.totalClicks += 1;
      row.uniqueClickKeys.add(uniqueClickKey(attribution));

      for (const conversion of attribution.conversions.filter(isValidConversion)) {
        if (row.conversions.has(conversion.id)) continue;
        row.conversions.add(conversion.id);
        row.estimatedRevenueCents += conversion.amountCents;
        row.estimatedCommissionCents += commissionSum(conversion, affiliate.id);
      }

      utmMap.set(utmCode, row);
    }

    const utmRows = Array.from(utmMap.values()).map((row) => {
      const uniqueClickCount = row.uniqueClickKeys.size;
      return {
        utmCode: row.utmCode,
        totalClicks: uniqueClickCount,
        conversions: row.conversions.size,
        conversionRate: uniqueClickCount > 0 ? (row.conversions.size / uniqueClickCount) * 100 : 0,
        estimatedRevenueCents: row.estimatedRevenueCents,
        estimatedCommissionCents: row.estimatedCommissionCents,
      };
    }).sort((a, b) => b.totalClicks - a.totalClicks);

    const leadRows = referrals.map((referral) => {
      const metadata = metadataObject(referral.metadata);
      const validConversions = referral.conversions.filter(isValidConversion);
      const revenue = validConversions.reduce((sum, conversion) => sum + conversion.amountCents, 0);
      const commission = validConversions.reduce((sum, conversion) => sum + commissionSum(conversion, affiliate.id), 0);

      return {
        referralId: referral.id,
        leadName: referral.leadName,
        leadEmail: referral.leadEmail,
        company: String(metadata.company ?? ''),
        status: referral.status,
        smeeInDiscussion: referral.status === 'PENDING' ? 1 : 0,
        convertedCustomers: validConversions.length > 0 ? 1 : 0,
        conversionCount: validConversions.length,
        estimatedRevenueCents: revenue,
        estimatedCommissionCents: commission,
        createdAt: referral.createdAt.toISOString(),
      };
    });

    const leadSummary = {
      totalIntroduced: referrals.length,
      smeeInDiscussion: leadRows.reduce((sum, row) => sum + row.smeeInDiscussion, 0),
      convertedCustomers: leadRows.reduce((sum, row) => sum + row.convertedCustomers, 0),
      estimatedRevenueCents: leadRows.reduce((sum, row) => sum + row.estimatedRevenueCents, 0),
      estimatedCommissionCents: leadRows.reduce((sum, row) => sum + row.estimatedCommissionCents, 0),
    };

    const monthlyMap = buildMonthBuckets(range);
    const monthlyUniqueClicks = new Map<string, Set<string>>();

    for (const attribution of attributions) {
      const key = monthKey(attribution.createdAt);
      if (!monthlyMap[key]) continue;
      monthlyMap[key].totalClicks += 1;
      const set = monthlyUniqueClicks.get(key) ?? new Set<string>();
      set.add(uniqueClickKey(attribution));
      monthlyUniqueClicks.set(key, set);
    }

    for (const conversion of conversions) {
      const key = monthKey(conversion.createdAt);
      if (!monthlyMap[key]) continue;
      monthlyMap[key].conversions += 1;
      monthlyMap[key].estimatedRevenueCents += conversion.amountCents;
      monthlyMap[key].estimatedCommissionCents += commissionSum(conversion, affiliate.id);
    }

    for (const [key, set] of monthlyUniqueClicks.entries()) {
      if (monthlyMap[key]) {
        monthlyMap[key].uniqueClicks = set.size;
        monthlyMap[key].totalClicks = set.size;
      }
    }

    const monthly = Object.entries(monthlyMap).map(([key, value]) => ({ key, ...value }));

    const report = {
      period: {
        startDate: range.gte?.toISOString() ?? null,
        endDate: range.lte?.toISOString() ?? null,
      },
      affiliate: {
        id: affiliate.id,
        name: affiliate.user.name,
        referralCode: affiliate.referralCode,
      },
      currency,
      summary: {
        totalEstimatedCommissionCents: estimatedCommissionCents,
        totalEstimatedRevenueCents: estimatedRevenueCents,
        totalClicks: uniqueClicks.size,
        uniqueClicks: uniqueClicks.size,
        conversions: conversions.length,
        conversionRate,
      },
      utmRows,
      leadSummary,
      leadRows,
      monthly,
    };

    const monthlyExportRows = monthly.map((row) => ({
      key: row.key,
      month: row.month,
      totalClicks: row.totalClicks,
      conversions: row.conversions,
      estimatedRevenueCents: row.estimatedRevenueCents,
      estimatedCommissionCents: row.estimatedCommissionCents,
    }));

    if (format === 'xlsx') {
      const buffer = buildXlsxBuffer([
        { name: 'UTM code', rows: utmRows },
        { name: 'Lead', rows: leadRows },
        { name: 'Theo thang', rows: monthlyExportRows },
      ]);
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="affiliate-report-${Date.now()}.xlsx"`,
        },
      });
    }

    if (format === 'csv') {
      const csv = toCSV([
        { title: 'Bao cao theo UTM code', rows: utmRows },
        { title: 'Bao cao theo khach hang tiem nang', rows: leadRows },
        { title: 'Bieu do chi tiet theo thang', rows: monthlyExportRows },
      ]);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="affiliate-report-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Affiliate reports API error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate affiliate report' }, { status: 500 });
  }
}
