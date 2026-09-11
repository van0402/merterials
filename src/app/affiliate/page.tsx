'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/components/i18n-provider';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MousePointerClick,
  Target,
  Users,
  Copy,
  Check,
  Link,
  Plus,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Ban,
  TrendingUp,
  ArrowRight,
  Banknote,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrencyAmount, formatMinorUnits } from '@/lib/money';

interface AffiliateStats {
  totalEarnings: number;
  pendingEarnings: number;
  totalClicks: number;
  totalLeads: number;
  totalReferredCustomers: number;
  totalConversions: number;
  conversionRate: number;
  referralLink: string;
  referralCode: string;
  currencySymbol: string;
  nextMaturesAt: string | null;
}

interface Referral {
  id: string;
  leadName: string;
  leadEmail: string;
  company?: string;
  estimatedValue: number;
  status: string;
  createdAt: string;
}

export default function AffiliateDashboard() {
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [currency, setCurrency] = useState('VND');
  const [currencySymbol, setCurrencySymbol] = useState('₫');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copied, setCopied] = useState<'link' | 'code' | null>(null);

  // Referral form state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitForm, setSubmitForm] = useState({
    leadName: '',
    leadPhone: '',
    leadEmail: '',
    estimatedValue: '0',
  });

  useEffect(() => {
    if (!authLoading && user) {
      loadDashboardData();
    }
  }, [authLoading, user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/affiliate/profile');
      const data = await response.json();

      if (data.success) {
        setStats({
          totalEarnings: data.affiliate?.balanceCents || 0,
          pendingEarnings: data.stats?.pendingEarnings || 0,
          totalClicks: data.stats?.totalClicks || 0,
          totalLeads: data.referrals?.length || 0,
          totalReferredCustomers: data.referrals?.filter((r: any) => r.status === 'APPROVED').length || 0,
          totalConversions: data.stats?.totalConversions || 0,
          conversionRate: data.stats?.conversionRate || 0,
          referralLink: `${window.location.origin}/r/${data.affiliate?.referralCode}`,
          referralCode: data.affiliate?.referralCode || '',
          currencySymbol: data.currencySymbol || '₫',
          nextMaturesAt: data.stats?.nextMaturesAt || null,
        });
        setReferrals(data.referrals || []);
        setCurrency(data.currency || 'VND');
        setCurrencySymbol(data.currencySymbol || '₫');
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      const response = await fetch('/api/affiliate/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadName: submitForm.leadName,
          leadPhone: submitForm.leadPhone || undefined,
          leadEmail: submitForm.leadEmail,
          estimatedValue: Number(submitForm.estimatedValue) || 0,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showNotification('success', 'Đã gửi khách hàng tiềm năng và đang chờ quản trị viên duyệt.');
        setShowSubmitModal(false);
        setSubmitForm({ leadName: '', leadPhone: '', leadEmail: '', estimatedValue: '0' });
        loadDashboardData();
      } else {
        showNotification('error', data.error || 'Không thể gửi khách hàng tiềm năng');
      }
    } catch (_e) {
      showNotification('error', 'Đã xảy ra lỗi khi gửi khách hàng tiềm năng');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    try {
      const response = await fetch('/api/affiliate/generate-code', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        window.location.reload();
      } else {
        showNotification('error', 'Không thể tạo mã: ' + data.error);
      }
    } catch (_e) {
      showNotification('error', 'Không thể tạo mã. Vui lòng thử lại.');
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const copyToClipboard = (text: string, type: 'link' | 'code') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric' });

  const formatCurrency = (minorUnits: number) => formatMinorUnits(minorUnits, currency);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
      APPROVED: { variant: 'default', icon: CheckCircle2 },
      COMPLETED: { variant: 'default', icon: CheckCircle2 },
      PAID: { variant: 'default', icon: CheckCircle2 },
      PENDING: { variant: 'secondary', icon: Clock },
      PROCESSING: { variant: 'secondary', icon: Loader2 },
      REJECTED: { variant: 'destructive', icon: Ban },
      FAILED: { variant: 'destructive', icon: AlertCircle },
    };
    const { variant, icon: Icon } = map[status] || { variant: 'outline' as const, icon: Clock };
    return (
      <Badge variant={variant} className="gap-1 text-xs">
        <Icon className="h-3 w-3" />
        {status === 'APPROVED' ? 'Đã duyệt'
          : status === 'COMPLETED' ? 'Hoàn tất'
          : status === 'PAID' ? 'Đã thanh toán'
          : status === 'PENDING' ? 'Chờ xử lý'
          : status === 'PROCESSING' ? 'Đang xử lý'
          : status === 'REJECTED' ? 'Đã từ chối'
          : status === 'FAILED' ? 'Thất bại'
          : status}
      </Badge>
    );
  };

  if (authLoading || loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <Alert variant={notification.type === 'error' ? 'destructive' : 'default'}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      {/* Commission Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white border-0 shadow-lg overflow-hidden relative group">
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl -translate-x-full group-hover:translate-x-full" />
          <CardContent className="flex items-center justify-between p-6 relative z-10">
            <div className="flex items-center gap-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner">
                <span className="text-2xl font-bold">{currencySymbol}</span>
              </div>
              <div>
                <p className="text-sm text-white/90 font-medium tracking-wide">{t('affiliateDashboardPage.referralBanner.eyebrow')}</p>
                <p className="text-xl font-bold mt-1 tracking-tight">{t('affiliateDashboardPage.referralBanner.title')}</p>
              </div>
            </div>
            <Button variant="secondary" onClick={() => { window.location.href = '/affiliate/seller'; }} className="gap-2 hidden sm:flex bg-white text-emerald-700 hover:bg-emerald-50 border-0 shadow-md transform transition hover:scale-105 active:scale-95">
              <Plus className="h-4 w-4" />
                {t('affiliateDashboardPage.referralBanner.sellWithSmee')}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      {/* <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {[
          {
            label: 'Số dư khả dụng',
            value: formatCurrency(stats?.totalEarnings || 0),
            icon: Banknote,
            color: 'text-emerald-600',
            bg: 'bg-emerald-500/10',
            description: 'Sẵn sàng thanh toán'
          },
          {
            label: 'Số dư chờ xử lý',
            value: formatCurrency(stats?.pendingEarnings || 0),
            icon: Clock,
            color: 'text-amber-600',
            bg: 'bg-amber-500/10',
            description: stats?.nextMaturesAt
              ? `Ngày khả dụng dự kiến: ${new Date(stats.nextMaturesAt).toLocaleDateString('vi-VN')}`
              : 'Đang giữ trong thời gian chờ hoàn tiền'
          },
          { label: 'Tổng lượt nhấp', value: stats?.totalClicks || 0, icon: MousePointerClick, color: 'text-blue-600', bg: 'bg-blue-500/10' },
          { label: 'Tổng lượt giới thiệu', value: stats?.totalLeads || 0, icon: Target, color: 'text-rose-600', bg: 'bg-rose-500/10' },
          { label: 'Tỷ lệ CĐ', value: `${stats?.conversionRate?.toFixed(1) || '0.0'}%`, icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-500/10' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            className="h-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            whileHover={{ y: -5 }}
          >
            <Card className="glass-card h-full border-0">
              <CardContent className="flex h-full min-h-[132px] items-center p-6">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.bg} backdrop-blur-sm transition-transform group-hover:scale-110`}>
                    {stat.icon === Banknote ? (
                      <span className={`text-lg font-bold ${stat.color}`}>{currencySymbol}</span>
                    ) : (
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    )}
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${stat.color}`}>
                      {stat.value}
                    </p>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                    {stat.description && (
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5 italic">{stat.description}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div> */}

      {/* Referral Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link className="h-4 w-4" />
            {t('affiliateDashboardPage.referralLinks.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!stats?.referralCode ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
                <Link className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium">{t('affiliateDashboardPage.referralLinks.emptyTitle')}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('affiliateDashboardPage.referralLinks.emptyDescription')}
              </p>
              <Button className="mt-4" onClick={handleGenerateCode}>
                {t('affiliateDashboardPage.referralLinks.generateCode')}
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>{t('affiliateDashboardPage.referralLinks.linkLabel')}</Label>
                <div className="flex gap-2">
                  <Input readOnly value={stats?.referralLink || ''} className="font-mono text-sm" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(stats?.referralLink || '', 'link')}
                  >
                    {copied === 'link' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('affiliateDashboardPage.referralLinks.codeLabel')}</Label>
                <div className="flex gap-2">
                  <Input readOnly value={stats?.referralCode || ''} className="font-mono text-sm" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(stats?.referralCode || '', 'code')}
                  >
                    {copied === 'code' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Recent Referrals */}
      {/* <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Giới thiệu gần đây</CardTitle>
            <CardDescription>5 lượt giới thiệu gần nhất</CardDescription>
          </div>
          {referrals.length > 5 && (
            <Button variant="ghost" size="sm" asChild>
              <a href="/affiliate/referrals" className="gap-1">
                Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {referrals.length === 0 ? (
            <EmptyState icon={Users} message="Chưa có lượt giới thiệu" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày</TableHead>
                  <TableHead className="text-right">Giá trị</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.slice(0, 5).map((ref) => (
                  <TableRow key={ref.id}>
                    <TableCell className="font-medium">{ref.leadName}</TableCell>
                    <TableCell className="text-muted-foreground">{ref.leadEmail}</TableCell>
                    <TableCell>{getStatusBadge(ref.status)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDate(ref.createdAt)}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrencyAmount(Number(ref.estimatedValue) || 0, currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card> */}

      {/* Quick Actions */}
      {/* <div className="grid gap-4 sm:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/affiliate/referrals'}>
          <CardContent className="p-5 flex items-center gap-3">
            <Users className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium">Quản lý giới thiệu</p>
              <p className="text-xs text-muted-foreground">Xem tất cả lượt giới thiệu của bạn</p>
            </div>
            <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/affiliate/reports'}>
          <CardContent className="p-5 flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="font-medium">Xem báo cáo</p>
              <p className="text-xs text-muted-foreground">Phân tích hiệu quả của bạn</p>
            </div>
            <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/affiliate/resources'}>
          <CardContent className="p-5 flex items-center gap-3">
            <Target className="h-5 w-5 text-violet-600" />
            <div>
              <p className="font-medium">Tài nguyên</p>
              <p className="text-xs text-muted-foreground">Tài liệu tiếp thị</p>
            </div>
            <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
          </CardContent>
        </Card>
      </div> */}

      {/* Submit Lead Modal */}
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="h-10 w-10 text-muted-foreground/40 mb-3" />
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-10 w-full max-w-md" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div>
                  <Skeleton className="h-7 w-20 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
