'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Download,
} from 'lucide-react';
import { currencySymbolFor, formatMinorUnits } from '@/lib/money';
import { payoutMethodLabel } from '@/lib/payout-methods';
import { useI18n } from '@/components/i18n-provider';

interface Payout {
  id: string;
  affiliateId: string;
  affiliateName: string;
  affiliateEmail: string;
  amountCents: number;
  commissionCount: number;
  status: string;
  method: string;
  notes: string | null;
  paymentInfo?: Record<string, string> | null;
  paymentSummary?: string | null;
  createdAt: string;
  processedAt: string | null;
}

const statusConfig: Record<string, { labelKey: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  PENDING: { labelKey: 'adminPayoutsPage.status.pending', variant: 'secondary', icon: Clock },
  PROCESSING: { labelKey: 'adminPayoutsPage.status.processing', variant: 'outline', icon: Loader2 },
  COMPLETED: { labelKey: 'adminPayoutsPage.status.completed', variant: 'default', icon: CheckCircle2 },
  FAILED: { labelKey: 'adminPayoutsPage.status.failed', variant: 'destructive', icon: XCircle },
};

export default function PayoutsPage() {
  const { language, t } = useI18n();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currency, setCurrency] = useState('VND');
  const [updatingPayoutId, setUpdatingPayoutId] = useState<string | null>(null);

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    try {
      const res = await fetch('/api/admin/payouts');
      const data = await res.json();
      if (data.success) {
        setPayouts(data.payouts || []);
        setCurrency(data.currency || 'VND');
      }
    } catch (error) {
      console.error('Failed to fetch payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch('/api/admin/payouts?format=csv');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payouts-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export payouts:', error);
    }
  };

  const updatePayoutStatus = async (payoutId: string, status: string) => {
    setUpdatingPayoutId(payoutId);
    try {
      const res = await fetch('/api/admin/payouts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: payoutId, status }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || t('adminPayoutsPage.errors.updateStatus'));
      await fetchPayouts();
    } catch (error) {
      console.error('Failed to update payout status:', error);
      window.alert(error instanceof Error ? error.message : t('adminPayoutsPage.errors.updateStatus'));
    } finally {
      setUpdatingPayoutId(null);
    }
  };

  if (loading) {
    return <PayoutsSkeleton />;
  }

  const filtered = payouts.filter((p) => statusFilter === 'all' || p.status === statusFilter);
  const formatMoney = (amount: number) => formatMinorUnits(amount || 0, currency);

  const stats = {
    total: payouts.length,
    pending: payouts.filter((p) => p.status === 'PENDING').length,
    completed: payouts.filter((p) => p.status === 'COMPLETED').length,
    totalPaid: payouts
      .filter((p) => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + Math.abs(p.amountCents), 0),
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('adminPayoutsPage.title')}</h1>
        <p className="text-muted-foreground">{t('adminPayoutsPage.description')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('adminPayoutsPage.stats.total')}</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('adminPayoutsPage.status.pending')}</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('adminPayoutsPage.status.completed')}</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('adminPayoutsPage.stats.paid')}</CardTitle>
            <span className="text-sm font-bold text-muted-foreground">{currencySymbolFor(currency)}</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMoney(stats.totalPaid)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{t('adminPayoutsPage.history.title')}</CardTitle>
              <CardDescription>{t('adminPayoutsPage.history.description')}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                {t('adminPayoutsPage.history.exportCsv')}
              </Button>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={t('adminPayoutsPage.table.status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('adminPayoutsPage.status.all')}</SelectItem>
                  <SelectItem value="PENDING">{t('adminPayoutsPage.status.pending')}</SelectItem>
                  <SelectItem value="PROCESSING">{t('adminPayoutsPage.status.processing')}</SelectItem>
                  <SelectItem value="COMPLETED">{t('adminPayoutsPage.status.completed')}</SelectItem>
                  <SelectItem value="FAILED">{t('adminPayoutsPage.status.failed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Wallet className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">{t('adminPayoutsPage.empty.title')}</h3>
              <p className="text-sm text-muted-foreground">{t('adminPayoutsPage.empty.description')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('adminPayoutsPage.table.partner')}</TableHead>
                  <TableHead>{t('adminPayoutsPage.table.amount')}</TableHead>
                  <TableHead>{t('adminPayoutsPage.table.commissions')}</TableHead>
                  <TableHead>{t('adminPayoutsPage.table.method')}</TableHead>
                  <TableHead>{t('adminPayoutsPage.table.paymentInfo')}</TableHead>
                  <TableHead>{t('adminPayoutsPage.table.status')}</TableHead>
                  <TableHead>{t('adminPayoutsPage.table.requested')}</TableHead>
                  <TableHead>{t('adminPayoutsPage.table.processed')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((payout) => {
                  const cfg = statusConfig[payout.status] || statusConfig.PENDING;
                  return (
                    <TableRow key={payout.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{payout.affiliateName}</p>
                          <p className="text-xs text-muted-foreground">{payout.affiliateEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">
                          {formatMoney(Math.abs(payout.amountCents))}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{payout.commissionCount}</TableCell>
                      <TableCell className="text-sm">{payoutMethodLabel(payout.method)}</TableCell>
                      <TableCell className="max-w-xs text-sm">
                        {payout.paymentInfo || payout.paymentSummary ? (
                          <div className="space-y-1 rounded-xl border bg-muted/30 p-3">
                            {payout.paymentInfo?.bankName && <p><span className="font-medium">{t('adminPayoutsPage.paymentInfo.bank')}:</span> {payout.paymentInfo.bankName}</p>}
                            {payout.paymentInfo?.bankAccountNumber && <p><span className="font-medium">{t('adminPayoutsPage.paymentInfo.accountNumber')}:</span> {payout.paymentInfo.bankAccountNumber}</p>}
                            {payout.paymentInfo?.bankAccountHolder && <p><span className="font-medium">{t('adminPayoutsPage.paymentInfo.accountHolder')}:</span> {payout.paymentInfo.bankAccountHolder}</p>}
                            {payout.paymentInfo?.paymentEmail && <p><span className="font-medium">{t('adminPayoutsPage.paymentInfo.paymentEmail')}:</span> {payout.paymentInfo.paymentEmail}</p>}
                            {!payout.paymentInfo && payout.paymentSummary && <p>{payout.paymentSummary}</p>}
                          </div>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <Badge variant={cfg.variant} className="w-fit">{t(cfg.labelKey)}</Badge>
                          <Select
                            value={payout.status}
                            disabled={updatingPayoutId === payout.id}
                            onValueChange={(status) => updatePayoutStatus(payout.id, status)}
                          >
                            <SelectTrigger className="h-8 w-36 text-xs">
                              <SelectValue placeholder={t('adminPayoutsPage.status.change')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDING">{t('adminPayoutsPage.status.pending')}</SelectItem>
                              <SelectItem value="PROCESSING">{t('adminPayoutsPage.status.processing')}</SelectItem>
                              <SelectItem value="COMPLETED">{t('adminPayoutsPage.status.completed')}</SelectItem>
                              <SelectItem value="FAILED">{t('adminPayoutsPage.status.failed')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(payout.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {payout.processedAt
                          ? new Date(payout.processedAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                          : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PayoutsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-36 mb-1" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-6 w-32 mb-1" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-32" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
