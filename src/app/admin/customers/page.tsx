'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Search,
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  Mail,
  Phone,
  BadgeDollarSign,
  Eye,
} from 'lucide-react';
import { formatCurrencyAmount } from '@/lib/money';
import { useI18n } from '@/components/i18n-provider';

interface Referral {
  id: string;
  leadEmail: string;
  leadName: string;
  leadPhone: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  estimatedValue: number;
  company: string;
  affiliate: {
    id: string;
    name: string;
    email: string;
    referralCode: string;
    partnerGroup: string;
    commissionRate: number;
  };
}

const statusConfig: Record<string, { labelKey: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING: { labelKey: 'adminCustomersPage.status.pending', variant: 'secondary' },
  APPROVED: { labelKey: 'adminCustomersPage.status.approved', variant: 'default' },
  REJECTED: { labelKey: 'adminCustomersPage.status.rejected', variant: 'destructive' },
};

export default function CustomersPage() {
  const { language, t } = useI18n();
  const router = useRouter();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currency, setCurrency] = useState('VND');

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      const res = await fetch('/api/admin/referrals');
      const data = await res.json();
      if (data.success) {
        setReferrals(data.referrals);
        setCurrency(data.currency || 'VND');
      }
    } catch (error) {
      console.error('Failed to fetch referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (referralIds: string[], action: 'approve' | 'reject') => {
    setActionLoading(referralIds[0]);
    try {
      const res = await fetch('/api/admin/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralIds, action }),
      });
      const data = await res.json();
      if (data.success) {
        fetchReferrals();
      }
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = referrals.filter((r) => {
    const matchesSearch =
      r.leadName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.leadEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.company?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: referrals.length,
    pending: referrals.filter((r) => r.status === 'PENDING').length,
    approved: referrals.filter((r) => r.status === 'APPROVED').length,
    rejected: referrals.filter((r) => r.status === 'REJECTED').length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('adminCustomersPage.title')}</h1>
        <p className="text-muted-foreground">{t('adminCustomersPage.description')}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('adminCustomersPage.stats.total')}</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('adminCustomersPage.status.pending')}</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('adminCustomersPage.status.approved')}</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('adminCustomersPage.status.rejected')}</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{t('adminCustomersPage.table.title')}</CardTitle>
              <CardDescription>{t('adminCustomersPage.table.description')}</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('adminCustomersPage.table.search')}
                  className="pl-8 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder={t('adminCustomersPage.table.status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('adminCustomersPage.status.all')}</SelectItem>
                  <SelectItem value="PENDING">{t('adminCustomersPage.status.pending')}</SelectItem>
                  <SelectItem value="APPROVED">{t('adminCustomersPage.status.approved')}</SelectItem>
                  <SelectItem value="REJECTED">{t('adminCustomersPage.status.rejected')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <UserCheck className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">{t('adminCustomersPage.empty.title')}</h3>
              <p className="text-sm text-muted-foreground">{t('adminCustomersPage.empty.description')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('adminCustomersPage.table.lead')}</TableHead>
                  <TableHead>{t('adminCustomersPage.table.company')}</TableHead>
                  <TableHead>{t('adminCustomersPage.table.referrer')}</TableHead>
                  <TableHead>{t('adminCustomersPage.table.value')}</TableHead>
                  <TableHead>{t('adminCustomersPage.table.status')}</TableHead>
                  <TableHead>{t('adminCustomersPage.table.date')}</TableHead>
                  <TableHead className="text-right">{t('adminCustomersPage.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((referral) => (
                  <TableRow key={referral.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-primary/10">
                            {referral.leadName?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{referral.leadName}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {referral.leadEmail}
                          </div>
                          {referral.leadPhone && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {referral.leadPhone}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {referral.company ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          {referral.company}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium">{referral.affiliate.name}</p>
                        <p className="text-xs text-muted-foreground">{referral.affiliate.partnerGroup}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <BadgeDollarSign className="h-3.5 w-3.5" />
                        {formatCurrencyAmount(referral.estimatedValue, currency)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig[referral.status]?.variant || 'outline'}>
                        {statusConfig[referral.status]?.labelKey ? t(statusConfig[referral.status].labelKey) : referral.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(referral.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => router.push(`/admin/customers/${referral.id}`)}
                        >
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          Xem
                        </Button>
                        {referral.status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={(e) => { e.stopPropagation(); handleAction([referral.id], 'approve'); }}
                              disabled={actionLoading === referral.id}
                            >
                              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                              {t('adminCustomersPage.actions.approve')}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => { e.stopPropagation(); handleAction([referral.id], 'reject'); }}
                              disabled={actionLoading === referral.id}
                            >
                              <XCircle className="mr-1 h-3.5 w-3.5" />
                              {t('adminCustomersPage.actions.reject')}
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
