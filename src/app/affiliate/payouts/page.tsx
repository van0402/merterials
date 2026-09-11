'use client';

import { useI18n } from '@/components/i18n-provider';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
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
  Clock,
  CheckCircle2,
  Ban,
  Wallet,
  CreditCard,
  Download,
  AlertCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { formatMinorUnits } from '@/lib/money';
import { payoutMethodLabel } from '@/lib/payout-methods';

interface Payout {
  id: string;
  amount: number;
  status: string;
  method: string;
  createdAt: string;
  paidAt?: string;
}

export default function PayoutsPage() {
  const { t, tx } = useI18n();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState('VND');
  const [minPayoutCents, setMinPayoutCents] = useState(0);
  const [withdrawalAmount, setWithdrawalAmount] = useState(0);
  const [leadCount, setLeadCount] = useState(0);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string; actionUrl?: string; actionLabel?: string } | null>(null);

  useEffect(() => {
    if (!authLoading && user) fetchPayouts();
  }, [authLoading, user]);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const [payRes, profileRes] = await Promise.all([
        fetch('/api/affiliate/payouts'),
        fetch('/api/affiliate/profile'),
      ]);
      const payData = await payRes.json();
      const profileData = await profileRes.json();
      if (payData.success) setPayouts(payData.payouts || []);
      if (profileData.success) {
        const nextBalance = profileData.affiliate?.balanceCents || 0;
        const nextMinPayout = profileData.minPayoutCents || 0;
        setBalance(nextBalance);
        setCurrency(profileData.currency || 'VND');
        setMinPayoutCents(nextMinPayout);
        setWithdrawalAmount((current) => {
          if (nextBalance < nextMinPayout || nextBalance <= 0) return 0;
          if (current <= 0) return nextBalance;
          return Math.min(Math.max(current, nextMinPayout), nextBalance);
        });
        setLeadCount(profileData.referrals?.length || 0);
      }
    } catch (error) {
      console.error('Failed to fetch payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric' });

  const formatCurrency = (minorUnits: number) => formatMinorUnits(minorUnits, currency);
  const formatMethod = (method?: string) => payoutMethodLabel(method);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
      COMPLETED: { variant: 'default', icon: CheckCircle2 },
      PAID: { variant: 'default', icon: CheckCircle2 },
      PENDING: { variant: 'secondary', icon: Clock },
      PROCESSING: { variant: 'secondary', icon: Loader2 },
      FAILED: { variant: 'destructive', icon: Ban },
    };
    const { variant, icon: Icon } = map[status] || { variant: 'outline' as const, icon: Clock };
    return (
      <Badge variant={variant} className="gap-1 text-xs">
        <Icon className="h-3 w-3" />
        {status === 'COMPLETED' ? tx('Hoàn tất', 'Completed')
          : status === 'PAID' ? tx('Đã thanh toán', 'Paid')
          : status === 'PENDING' ? tx('Chờ xử lý', 'Pending')
          : status === 'PROCESSING' ? tx('Đang xử lý', 'Processing')
          : status === 'FAILED' ? tx('Thất bại', 'Failed')
          : status}
      </Badge>
    );
  };

  const totalPaid = payouts.filter((p) => p.status === 'COMPLETED' || p.status === 'PAID').reduce((sum, p) => sum + Math.abs(p.amount), 0);
  const pendingPayout = payouts.filter((p) => p.status === 'PENDING' || p.status === 'PROCESSING').reduce((sum, p) => sum + Math.abs(p.amount), 0);
  const canWithdraw = balance >= minPayoutCents && balance > 0;
  const withdrawalMin = canWithdraw ? minPayoutCents : 0;
  const withdrawalMax = balance;
  const selectedWithdrawalAmount = canWithdraw ? Math.min(Math.max(withdrawalAmount, withdrawalMin), withdrawalMax) : 0;
  const missingForWithdraw = Math.max(minPayoutCents - balance, 0);
  const payoutProgress = minPayoutCents > 0 ? Math.min((balance / minPayoutCents) * 100, 100) : 100;
  const memberName = user?.name || user?.email || 'Thành viên RefferQ';
  const memberInitial = memberName.trim().charAt(0).toUpperCase() || 'R';
  const memberCardTier = leadCount > 10
    ? {
        label: t('affiliatePayoutsPage.memberCard.tiers.diamond'),
        className: 'border-cyan-100/70 bg-[radial-gradient(circle_at_12%_0%,rgba(236,254,255,0.55),transparent_34%),linear-gradient(135deg,rgba(8,47,73,0.96),rgba(14,116,144,0.9)_46%,rgba(224,242,254,0.96))] text-white shadow-cyan-950/35',
        mutedTextClassName: 'text-cyan-50/70',
        badgeClassName: 'bg-cyan-100/20 text-cyan-50 ring-cyan-100/35',
        avatarClassName: 'bg-cyan-100/20 text-cyan-50 ring-cyan-100/35',
        glowClassName: 'bg-cyan-200/40',
        shineClassName: 'from-transparent via-cyan-50/30 to-transparent',
      }
    : leadCount >= 5
      ? {
          label: t('affiliatePayoutsPage.memberCard.tiers.gold'),
          className: 'border-amber-200/70 bg-[radial-gradient(circle_at_12%_0%,rgba(254,243,199,0.48),transparent_34%),linear-gradient(135deg,rgba(69,26,3,0.96),rgba(180,83,9,0.9)_48%,rgba(253,230,138,0.96))] text-white shadow-amber-950/35',
          mutedTextClassName: 'text-amber-50/72',
          badgeClassName: 'bg-amber-100/20 text-amber-50 ring-amber-100/35',
          avatarClassName: 'bg-amber-100/20 text-amber-50 ring-amber-100/35',
          glowClassName: 'bg-amber-200/35',
          shineClassName: 'from-transparent via-amber-50/30 to-transparent',
        }
      : leadCount >= 3
        ? {
            label: t('affiliatePayoutsPage.memberCard.tiers.silver'),
            className: 'border-slate-100/55 bg-[radial-gradient(circle_at_12%_0%,rgba(248,250,252,0.32),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(71,85,105,0.9)_48%,rgba(226,232,240,0.82))] text-white shadow-slate-950/30',
            mutedTextClassName: 'text-slate-100/65',
            badgeClassName: 'bg-white/14 text-slate-50 ring-white/25',
            avatarClassName: 'bg-white/14 text-slate-50 ring-white/25',
            glowClassName: 'bg-slate-100/30',
            shineClassName: 'from-transparent via-white/24 to-transparent',
          }
        : {
            label: t('affiliatePayoutsPage.memberCard.tiers.standard'),
            className: 'border-white/20 bg-[radial-gradient(circle_at_12%_0%,rgba(16,185,129,0.20),transparent_34%),linear-gradient(135deg,rgba(2,6,23,0.95),rgba(15,23,42,0.9)_54%,rgba(6,78,59,0.72))] text-white shadow-emerald-950/35',
            mutedTextClassName: 'text-white/55',
            badgeClassName: 'bg-white/10 text-white/70 ring-white/15',
            avatarClassName: 'bg-white/15 text-white ring-white/15',
            glowClassName: 'bg-emerald-200/20',
            shineClassName: 'from-transparent via-white/16 to-transparent',
          };

  const requestPayout = async () => {
    if (!canWithdraw || requestingPayout) return;
    const amountCents = selectedWithdrawalAmount;
    const confirmed = window.confirm(`Xác nhận yêu cầu rút ${formatCurrency(amountCents)}?`);
    if (!confirmed) return;
    setRequestingPayout(true);
    setNotice(null);
    try {
      const res = await fetch('/api/affiliate/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountCents }),
      });
      const data = await res.json();
      if (data.success) {
        setNotice({ type: 'success', message: `Đã gửi yêu cầu rút ${formatCurrency(amountCents)}. Admin sẽ xử lý trong danh sách thanh toán.` });
        await fetchPayouts();
      } else {
        setNotice({
          type: 'error',
          message: data.error || 'Không thể tạo yêu cầu rút tiền',
          actionUrl: data.settingsUrl,
          actionLabel: data.code === 'PAYMENT_INFO_REQUIRED' ? 'Bổ sung trong Cài đặt' : undefined,
        });
      }
    } catch (error) {
      setNotice({ type: 'error', message: 'Không thể tạo yêu cầu rút tiền' });
    } finally {
      setRequestingPayout(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Ngày', 'Phương thức', 'Trạng thái', 'Số tiền'];
    const rows = payouts.map((p) => [
      formatDate(p.paidAt || p.createdAt),
      formatMethod(p.method),
      p.status,
      formatCurrency(Math.abs(p.amount)),
    ]);
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payouts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{tx('Thanh toán', 'Payouts')}</h1>
          <p className="text-sm text-muted-foreground">{tx('Ví hoa hồng, yêu cầu rút tiền và lịch sử thanh toán', 'Commission wallet, withdrawal requests, and payout history')}</p>
        </div>
        {payouts.length > 0 && (
          <Button variant="outline" onClick={exportCSV} className="gap-1.5 rounded-2xl bg-white/80">
            <Download className="h-4 w-4" />
            {tx('Xuất dữ liệu', 'Export data')}
          </Button>
        )}
      </div>

      {notice && (
        <Card className={notice.type === 'success' ? 'border-emerald-200 bg-emerald-50' : 'border-destructive/30 bg-destructive/5'}>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              {notice.type === 'success' ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" /> : <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />}
              <p className={notice.type === 'success' ? 'text-sm text-emerald-800' : 'text-sm text-destructive'}>{notice.message}</p>
            </div>
            {notice.actionUrl && notice.actionLabel && (
              <Button variant="outline" size="sm" className="shrink-0 rounded-xl" onClick={() => router.push(notice.actionUrl!)}>
                {notice.actionLabel}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden border-0 bg-gradient-to-br from-teal-600 via-emerald-600 to-amber-500 text-white shadow-2xl shadow-emerald-950/20">
        <CardContent className="relative flex flex-col gap-5 p-6 sm:block sm:min-h-[22rem] sm:p-8 lg:min-h-[20rem]">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
          <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-amber-300/20 blur-2xl" />

          <div className="relative order-2 z-10 max-w-xl space-y-5 pr-0 sm:order-none lg:pr-28">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold ring-1 ring-white/20">
              <Wallet className="h-3.5 w-3.5" /> {tx('Ví hoa hồng Affiliate', 'Affiliate commission wallet')}
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-50/90">{tx('Số dư khả dụng', 'Available balance')}</p>
              <p className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">{formatCurrency(balance)}</p>
            </div>
            <div className="max-w-lg space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-50/90">
                <span>{canWithdraw ? t('affiliatePayoutsPage.wallet.eligibleToWithdraw') : `${t('affiliatePayoutsPage.wallet.missingPrefix')} ${formatCurrency(missingForWithdraw)}`}</span>
                <span>{tx('Ngưỡng:', 'Threshold:')} {formatCurrency(minPayoutCents)}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-emerald-950/30 ring-1 ring-white/15">
                <div className="h-full rounded-full bg-white shadow-lg transition-all" style={{ width: `${payoutProgress}%` }} />
              </div>
            </div>

            <div className="max-w-lg rounded-3xl bg-white/12 p-4 ring-1 ring-white/20 backdrop-blur">
              <div className="flex items-center justify-between gap-3 text-sm font-semibold text-emerald-50/90">
                <span>{tx('Khoản muốn rút', 'Withdrawal amount')}</span>
                <span className="text-base font-black text-white">{formatCurrency(selectedWithdrawalAmount)}</span>
              </div>
              <input
                type="range"
                min={withdrawalMin}
                max={withdrawalMax}
                step={10000}
                value={selectedWithdrawalAmount}
                disabled={!canWithdraw || requestingPayout}
                onChange={(event) => setWithdrawalAmount(Number(event.target.value))}
                className="mt-3 w-full accent-white disabled:opacity-50"
              />
              <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-emerald-50/75">
                <span>{tx('Tối thiểu', 'Min')} {formatCurrency(withdrawalMin)}</span>
                <span>{tx('Tối đa', 'Max')} {formatCurrency(withdrawalMax)}</span>
              </div>
            </div>
          </div>

          <div className={`smee-card-sweep relative order-1 z-20 w-full overflow-hidden rounded-[1.6rem] border p-5 shadow-2xl backdrop-blur-md transition-colors sm:absolute sm:left-[62%] sm:top-1/2 sm:order-none sm:w-[22rem] sm:-translate-x-1/2 sm:-translate-y-1/2 lg:left-[58%] ${memberCardTier.className}`}>
            <div className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl ${memberCardTier.glowClassName}`} />
            <div className="pointer-events-none absolute inset-0 rounded-[1.6rem] ring-1 ring-white/10" />
            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className={`text-[10px] font-black uppercase tracking-[0.24em] ${memberCardTier.mutedTextClassName}`}>{t('affiliatePayoutsPage.memberCard.title')}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ring-1 ${memberCardTier.badgeClassName}`}>
                    {memberCardTier.label}
                  </span>
                </div>
                <p className={`mt-4 text-xs font-semibold ${memberCardTier.mutedTextClassName}`}>{t('affiliatePayoutsPage.memberCard.memberName')}</p>
                <p className="mt-1 truncate text-xl font-black tracking-tight">{memberName}</p>
              </div>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-base font-black ring-1 ${memberCardTier.avatarClassName}`}>
                {memberInitial}
              </div>
            </div>
            <div className={`relative mt-5 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.18em] ${memberCardTier.mutedTextClassName}`}>
              <span>Affiliate Smee</span>
            </div>
          </div>

          <div className="relative order-3 z-30 mt-0 flex justify-end sm:order-none sm:mt-20 lg:mt-14">
            <Button
              type="button"
              size="lg"
              onClick={requestPayout}
              disabled={!canWithdraw || requestingPayout}
              className="h-12 rounded-2xl bg-white px-6 font-black text-emerald-700 shadow-xl shadow-emerald-950/20 hover:bg-emerald-50 disabled:bg-white/60 disabled:text-emerald-900/50"
            >
              {requestingPayout ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
              {requestingPayout ? tx('Đang gửi...', 'Submitting...') : tx('Yêu cầu rút tiền', 'Request withdrawal')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-blue-100 bg-white/85">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-black text-blue-600">+{formatCurrency(totalPaid)}</p>
              <p className="text-xs text-muted-foreground">{tx('Tổng đã thanh toán', 'Total paid')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-100 bg-white/85">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-black text-amber-600">{formatCurrency(pendingPayout)}</p>
              <p className="text-xs text-muted-foreground">{tx('Đang xử lý', 'Processing')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-100 bg-white/85">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10">
              <Wallet className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-black text-emerald-600">{formatCurrency(minPayoutCents)}</p>
              <p className="text-xs text-muted-foreground">{tx('Ngưỡng rút tối thiểu', 'Minimum withdrawal threshold')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-violet-100 bg-white/85">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/10">
              <CreditCard className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-xl font-black text-violet-600">{payouts.length}</p>
              <p className="text-xs text-muted-foreground">{tx('Tổng lượt payout', 'Total payouts')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 text-blue-600" />
          <div>
            <p className="text-sm font-medium text-blue-900">{tx('Lịch thanh toán', 'Payout schedule')}</p>
            <p className="text-sm text-blue-700">
              {tx('Thanh toán được xử lý vào ngày đầu tiên mỗi tháng cho thu nhập của tháng trước.', "Payouts are processed on the first day of each month for the previous month's earnings.")}
              {tx('Ngưỡng rút tối thiểu hiện tại:', 'Current minimum withdrawal threshold:')} {formatCurrency(minPayoutCents)}.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-slate-200/80 bg-white/90 shadow-lg shadow-slate-950/5">
        <CardHeader>
          <CardTitle className="text-base">{tx('Lịch sử thanh toán', 'Payout history')}</CardTitle>
          <CardDescription>{payouts.length} {tx('khoản thanh toán', 'payouts')}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {payouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Wallet className="mb-3 h-12 w-12 text-muted-foreground/40" />
              <p className="font-medium">{tx('Chưa có thanh toán', 'No payouts yet')}</p>
              <p className="mt-1 text-sm text-muted-foreground">{tx('Bắt đầu giới thiệu khách hàng để nhận hoa hồng', 'Start referring customers to earn commissions')}</p>
            </div>
          ) : (
            <div className="divide-y">
              {payouts.map((payout) => (
                <div key={payout.id} className="flex flex-col gap-3 p-4 transition hover:bg-orange-50/50 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 text-orange-700">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{formatMethod(payout.method)}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(payout.paidAt || payout.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:min-w-64 sm:justify-end">
                    {getStatusBadge(payout.status)}
                    <p className="text-lg font-black">-{formatCurrency(Math.abs(payout.amount))}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
