'use client';

import { useI18n } from '@/components/i18n-provider';

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart3,
  Banknote,
  Calendar,
  Download,
  MousePointerClick,
  Percent,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { formatMinorUnits } from '@/lib/money';

interface SummaryStats {
  totalEstimatedCommissionCents: number;
  totalEstimatedRevenueCents: number;
  totalClicks: number;
  uniqueClicks: number;
  conversions: number;
  conversionRate: number;
}

interface UtmRow {
  utmCode: string;
  totalClicks: number;
  conversions: number;
  conversionRate: number;
  estimatedRevenueCents: number;
  estimatedCommissionCents: number;
}

interface LeadSummary {
  totalIntroduced: number;
  smeeInDiscussion: number;
  convertedCustomers: number;
  estimatedRevenueCents: number;
  estimatedCommissionCents: number;
}

interface LeadRow {
  referralId: string;
  leadName: string;
  leadEmail: string;
  company: string;
  status: string;
  smeeInDiscussion: number;
  convertedCustomers: number;
  conversionCount: number;
  estimatedRevenueCents: number;
  estimatedCommissionCents: number;
  createdAt: string;
}

interface MonthlyRow {
  key: string;
  month: string;
  totalClicks: number;
  conversions: number;
  estimatedRevenueCents: number;
  estimatedCommissionCents: number;
}

interface AffiliateReport {
  currency: string;
  summary: SummaryStats;
  leadSummary: LeadSummary;
  utmRows: UtmRow[];
  leadRows: LeadRow[];
  monthly: MonthlyRow[];
}

const emptyReport: AffiliateReport = {
  currency: 'VND',
  summary: {
    totalEstimatedCommissionCents: 0,
    totalEstimatedRevenueCents: 0,
    totalClicks: 0,
    uniqueClicks: 0,
    conversions: 0,
    conversionRate: 0,
  },
  leadSummary: {
    totalIntroduced: 0,
    smeeInDiscussion: 0,
    convertedCustomers: 0,
    estimatedRevenueCents: 0,
    estimatedCommissionCents: 0,
  },
  utmRows: [],
  leadRows: [],
  monthly: [],
};

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function defaultStartDate() {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return toDateInputValue(date);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatDate(date: string, locale: string) {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatMonthLabel(month: MonthlyRow, locale: string) {
  const [year, monthNumber] = month.key.split('-').map(Number);
  if (!year || !monthNumber) return month.month;

  return new Date(Date.UTC(year, monthNumber - 1, 1)).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
  });
}

function statusLabel(status: string, t: (key: string, fallback?: string) => string) {
  if (status === 'APPROVED') return t('affiliateReportsPage.status.approved');
  if (status === 'PENDING') return t('affiliateReportsPage.status.pending');
  if (status === 'REJECTED') return t('affiliateReportsPage.status.rejected');
  return status;
}

export default function ReportsPage() {
  const { language, t } = useI18n();
  const locale = language === 'vi' ? 'vi-VN' : 'en-US';
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<AffiliateReport>(emptyReport);
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(() => toDateInputValue(new Date()));
  const [appliedRange, setAppliedRange] = useState({ startDate: defaultStartDate(), endDate: toDateInputValue(new Date()) });

  useEffect(() => {
    if (!authLoading && user) fetchReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, appliedRange]);

  const reportUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (appliedRange.startDate) params.set('startDate', appliedRange.startDate);
    if (appliedRange.endDate) params.set('endDate', appliedRange.endDate);
    return `/api/affiliate/reports?${params.toString()}`;
  }, [appliedRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const res = await fetch(reportUrl);
      const data = await res.json();
      if (data.success) setReport(data.report || emptyReport);
    } catch (error) {
      console.error('Failed to fetch report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyDateRange = () => {
    setAppliedRange({ startDate, endDate });
  };

  const exportExcel = () => {
    const params = new URLSearchParams();
    if (appliedRange.startDate) params.set('startDate', appliedRange.startDate);
    if (appliedRange.endDate) params.set('endDate', appliedRange.endDate);
    params.set('format', 'xlsx');
    window.open(`/api/affiliate/reports?${params.toString()}`, '_blank');
  };

  const formatCurrency = (minorUnits: number) => formatMinorUnits(minorUnits, report.currency);
  const maxMonthlyValue = Math.max(...report.monthly.map((m) => Math.max(m.estimatedRevenueCents, m.estimatedCommissionCents)), 1);

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('affiliateReportsPage.header.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('affiliateReportsPage.header.description')}</p>
        </div>
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="startDate" className="text-xs">{t('affiliateReportsPage.filters.fromDate')}</Label>
            <Input id="startDate" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="endDate" className="text-xs">{t('affiliateReportsPage.filters.toDate')}</Label>
            <Input id="endDate" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </div>
          <Button onClick={applyDateRange} className="gap-1.5">
            <Calendar className="h-4 w-4" /> {t('affiliateReportsPage.filters.apply')}
          </Button>
          <Button variant="outline" onClick={exportExcel} className="gap-1.5">
            <Download className="h-4 w-4" /> {t('affiliateReportsPage.filters.exportExcel')}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <Banknote className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(report.summary.totalEstimatedCommissionCents)}</p>
                <p className="text-xs text-muted-foreground">{t('affiliateReportsPage.summary.totalEstimatedCommission')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(report.summary.totalEstimatedRevenueCents)}</p>
                <p className="text-xs text-muted-foreground">{t('affiliateReportsPage.summary.totalEstimatedRevenue')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                <MousePointerClick className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{report.summary.totalClicks}</p>
                <p className="text-xs text-muted-foreground">{t('affiliateReportsPage.summary.totalClicks')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Percent className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatPercent(report.summary.conversionRate)}</p>
                <p className="text-xs text-muted-foreground">{t('affiliateReportsPage.common.conversionRate')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('affiliateReportsPage.utmReport.title')}</CardTitle>
          <CardDescription>{t('affiliateReportsPage.utmReport.description')}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[680px] table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px] px-3 text-center align-middle text-[11px] font-bold uppercase leading-tight tracking-wide">{t('affiliateReportsPage.common.utmCodeLink')}</TableHead>
                  <TableHead className="w-[104px] px-3 text-center align-middle text-[11px] font-bold uppercase leading-tight tracking-wide">{t('affiliateReportsPage.common.totalClick')}</TableHead>
                  <TableHead className="w-[112px] px-3 text-center align-middle text-[11px] font-bold uppercase leading-tight tracking-wide">{t('affiliateReportsPage.common.conversions')}</TableHead>
                  <TableHead className="w-[112px] px-3 text-center align-middle text-[11px] font-bold uppercase leading-tight tracking-wide">{t('affiliateReportsPage.common.conversionRate')}</TableHead>
                  <TableHead className="w-[112px] px-3 text-center align-middle text-[11px] font-bold uppercase leading-tight tracking-wide">{t('affiliateReportsPage.common.estimatedRevenue')}</TableHead>
                  <TableHead className="w-[112px] px-3 text-center align-middle text-[11px] font-bold uppercase leading-tight tracking-wide">{t('affiliateReportsPage.common.estimatedCommission')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.utmRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">{t('affiliateReportsPage.utmReport.empty')}</TableCell>
                  </TableRow>
                ) : report.utmRows.map((row) => (
                  <TableRow key={row.utmCode}>
                    <TableCell className="truncate px-3 text-center font-medium" title={row.utmCode}>{row.utmCode}</TableCell>
                    <TableCell className="px-3 text-center">{row.totalClicks}</TableCell>
                    <TableCell className="px-3 text-center">{row.conversions}</TableCell>
                    <TableCell className="px-3 text-center">{formatPercent(row.conversionRate)}</TableCell>
                    <TableCell className="px-3 text-center">{formatCurrency(row.estimatedRevenueCents)}</TableCell>
                    <TableCell className="px-3 text-center font-semibold">{formatCurrency(row.estimatedCommissionCents)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t('affiliateReportsPage.leadOverview.title')}</CardTitle>
            <CardDescription>{t('affiliateReportsPage.leadOverview.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-bold">{report.leadSummary.totalIntroduced}</p>
                <p className="text-xs text-muted-foreground">{t('affiliateReportsPage.leadOverview.introducedCustomers')}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-bold">{report.leadSummary.smeeInDiscussion}</p>
                <p className="text-xs text-muted-foreground">{t('affiliateReportsPage.leadOverview.smeeInDiscussion')}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-bold">{report.leadSummary.convertedCustomers}</p>
                <p className="text-xs text-muted-foreground">{t('affiliateReportsPage.leadOverview.convertedToRevenue')}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-bold">{formatCurrency(report.leadSummary.estimatedCommissionCents)}</p>
                <p className="text-xs text-muted-foreground">{t('affiliateReportsPage.common.estimatedCommission')}</p>
              </div>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-sm text-muted-foreground">{t('affiliateReportsPage.common.estimatedRevenue')}</p>
              <p className="mt-1 text-2xl font-bold">{formatCurrency(report.leadSummary.estimatedRevenueCents)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">{t('affiliateReportsPage.monthlyChart.title')}</CardTitle>
            <CardDescription>{t('affiliateReportsPage.monthlyChart.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-56 items-end gap-3">
              {report.monthly.map((month) => (
                <div key={month.key} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-44 w-full items-end justify-center gap-1">
                    <div
                      className="w-4 rounded-t bg-blue-500 transition-all"
                      style={{ height: `${Math.max((month.estimatedRevenueCents / maxMonthlyValue) * 100, 2)}%` }}
                      title={`${t('affiliateReportsPage.monthlyChart.revenueTooltip')} ${formatCurrency(month.estimatedRevenueCents)}`}
                    />
                    <div
                      className="w-4 rounded-t bg-emerald-500 transition-all"
                      style={{ height: `${Math.max((month.estimatedCommissionCents / maxMonthlyValue) * 100, 2)}%` }}
                      title={`${t('affiliateReportsPage.monthlyChart.commissionTooltip')} ${formatCurrency(month.estimatedCommissionCents)}`}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{formatMonthLabel(month, locale)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" />{t('affiliateReportsPage.common.estimatedRevenueShort')}</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />{t('affiliateReportsPage.common.estimatedCommissionShort')}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('affiliateReportsPage.leadReport.title')}</CardTitle>
          <CardDescription>{t('affiliateReportsPage.leadReport.description')}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('affiliateReportsPage.common.customer')}</TableHead>
                <TableHead>{t('affiliateReportsPage.common.company')}</TableHead>
                <TableHead>{t('affiliateReportsPage.common.status')}</TableHead>
                <TableHead className="text-center">{t('affiliateReportsPage.common.conversions')}</TableHead>
                <TableHead className="text-right">{t('affiliateReportsPage.common.estimatedRevenue')}</TableHead>
                <TableHead className="text-right">{t('affiliateReportsPage.common.estimatedCommission')}</TableHead>
                <TableHead>{t('affiliateReportsPage.common.submittedDate')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.leadRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">{t('affiliateReportsPage.leadReport.empty')}</TableCell>
                </TableRow>
              ) : report.leadRows.map((row) => (
                <TableRow key={row.referralId}>
                  <TableCell>
                    <div className="font-medium">{row.leadName}</div>
                    <div className="text-xs text-muted-foreground">{row.leadEmail}</div>
                  </TableCell>
                  <TableCell>{row.company || '-'}</TableCell>
                  <TableCell>{statusLabel(row.status, t)}</TableCell>
                  <TableCell className="text-center">{row.conversionCount}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.estimatedRevenueCents)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(row.estimatedCommissionCents)}</TableCell>
                  <TableCell>{formatDate(row.createdAt, locale)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="h-4 w-4" /> {t('affiliateReportsPage.monthlyDetails.title')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('affiliateReportsPage.common.month')}</TableHead>
                <TableHead className="text-center">{t('affiliateReportsPage.common.totalClick')}</TableHead>
                <TableHead className="text-center">{t('affiliateReportsPage.common.conversions')}</TableHead>
                <TableHead className="text-right">{t('affiliateReportsPage.common.estimatedRevenue')}</TableHead>
                <TableHead className="text-right">{t('affiliateReportsPage.common.estimatedCommission')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.monthly.map((month) => (
                <TableRow key={month.key}>
                  <TableCell className="font-medium">{formatMonthLabel(month, locale)}</TableCell>
                  <TableCell className="text-center">{month.totalClicks}</TableCell>
                  <TableCell className="text-center">{month.conversions}</TableCell>
                  <TableCell className="text-right">{formatCurrency(month.estimatedRevenueCents)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(month.estimatedCommissionCents)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell>{t('affiliateReportsPage.common.total')}</TableCell>
                <TableCell className="text-center">{report.monthly.reduce((sum, month) => sum + month.totalClicks, 0)}</TableCell>
                <TableCell className="text-center">{report.monthly.reduce((sum, month) => sum + month.conversions, 0)}</TableCell>
                <TableCell className="text-right">{formatCurrency(report.monthly.reduce((sum, month) => sum + month.estimatedRevenueCents, 0))}</TableCell>
                <TableCell className="text-right">{formatCurrency(report.monthly.reduce((sum, month) => sum + month.estimatedCommissionCents, 0))}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
