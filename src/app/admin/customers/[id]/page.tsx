'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  IndianRupee,
  User,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  Trash2,
  Link2,
  FileText,
  Shield,
  Loader2,
} from 'lucide-react';
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
    partnerGroupId: string | null;
    commissionRate: number;
  };
}

const statusConfig: Record<string, { viLabel: string; enLabel: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  PENDING: { viLabel: 'Chờ xử lý', enLabel: 'Pending', variant: 'secondary', icon: Clock },
  APPROVED: { viLabel: 'Đã duyệt', enLabel: 'Approved', variant: 'default', icon: CheckCircle2 },
  REJECTED: { viLabel: 'Đã từ chối', enLabel: 'Rejected', variant: 'destructive', icon: XCircle },
};

export default function CustomerDetailPage() {
  const { language, tx } = useI18n();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [referral, setReferral] = useState<Referral | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Editable fields
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    fetchReferral();
  }, [id]);

  const fetchReferral = async () => {
    try {
      const res = await fetch('/api/admin/referrals');
      const data = await res.json();
      if (data.success) {
        const found = data.referrals.find((r: Referral) => r.id === id);
        if (found) {
          setReferral(found);
          setEditName(found.leadName);
          setEditEmail(found.leadEmail);
        }
      }
    } catch (error) {
      console.error('Failed to fetch referral:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/referrals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadName: editName,
          leadEmail: editEmail,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        await fetchReferral();
      }
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async (action: 'approve' | 'reject') => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/referrals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reviewNotes: reviewNotes || undefined }),
      });
      if (res.ok) {
        await fetchReferral();
        setReviewNotes('');
      }
    } catch (error) {
      console.error('Failed to process action:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/referrals/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/admin/customers');
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-[400px] md:col-span-2" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  if (!referral) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/admin/customers')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {tx('Quay lại danh sách khách hàng', 'Back to customer list')}
        </Button>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <User className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">{tx('Không tìm thấy khách hàng', 'Customer not found')}</h3>
          <p className="text-sm text-muted-foreground">{tx('Khách hàng tiềm năng này có thể đã bị xóa', 'This lead may have been deleted')}</p>
        </div>
      </div>
    );
  }

  const cfg = statusConfig[referral.status] || statusConfig.PENDING;
  const StatusIcon = cfg.icon;
  const estimatedCommission = Math.round(referral.estimatedValue * referral.affiliate.commissionRate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin/customers')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-lg">
                {referral.leadName?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{referral.leadName}</h1>
              <p className="text-sm text-muted-foreground">{referral.leadEmail}</p>
            </div>
          </div>
          <Badge variant={cfg.variant} className="ml-2">
            <StatusIcon className="mr-1 h-3 w-3" />
            {tx(cfg.viLabel, cfg.enLabel)}
          </Badge>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              {tx('Xóa', 'Delete')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this referral lead?</AlertDialogTitle>
              <AlertDialogDescription>
                {tx('Thao tác này sẽ xóa vĩnh viễn', 'This will permanently delete')} <strong>{referral.leadName}</strong> {tx('và toàn bộ chuyển đổi/hoa hồng liên quan. Không thể hoàn tác thao tác này.', 'and all associated conversions and commissions. This action cannot be undone.')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{tx('Hủy', 'Cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleting}
              >
                {deleting ? tx('Đang xóa...', 'Deleting...') : tx('Xóa', 'Delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Details & Edit */}
        <div className="space-y-6 md:col-span-2">
          {/* Lead Details Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {tx('Thông tin khách hàng tiềm năng', 'Lead information')}
                  </CardTitle>
                  <CardDescription>{tx('Xem và chỉnh sửa thông tin khách hàng', 'View and edit customer information')}</CardDescription>
                </div>
                <Button onClick={handleSave} disabled={saving} size="sm">
                  {saved ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                      {tx('Đã lưu', 'Saved')}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? tx('Đang lưu...', 'Saving...') : tx('Lưu', 'Save')}
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="leadName">{tx('Họ và tên', 'Full name')}</Label>
                  <Input
                    id="leadName"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="leadEmail">{tx('Địa chỉ email', 'Email address')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="leadEmail"
                      type="email"
                      className="pl-9"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>{tx('Số điện thoại', 'Phone number')}</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-9" value={referral.leadPhone || '—'} readOnly disabled />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>{tx('Công ty', 'Company')}</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-9" value={referral.company || '—'} readOnly disabled />
                  </div>
                </div>
              </div>
              {referral.notes && (
                <div className="grid gap-2">
                  <Label>{tx('Ghi chú', 'Notes')}</Label>
                  <div className="rounded-md border bg-muted/50 p-3 text-sm">{referral.notes}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Review Actions Card - only for PENDING */}
          {referral.status === 'PENDING' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {tx('Duyệt khách hàng tiềm năng', 'Approve lead')}
                </CardTitle>
                <CardDescription>{tx('Duyệt hoặc từ chối khách hàng tiềm năng này', 'Approve or reject this lead')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="reviewNotes">{tx('Ghi chú duyệt (không bắt buộc)', 'Review notes (optional)')}</Label>
                  <Textarea
                    id="reviewNotes"
                    placeholder="Add notes about this review decision..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleAction('approve')}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    {tx('Duyệt khách hàng tiềm năng', 'Approve lead')}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleAction('reject')}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="mr-2 h-4 w-4" />
                    )}
                    {tx('Từ chối khách hàng tiềm năng', 'Reject lead')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Sidebar Info */}
        <div className="space-y-6">
          {/* Value Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{tx('Tổng quan tài chính', 'Financial overview')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{tx('Giá trị dự kiến', 'Estimated value')}</span>
                <span className="flex items-center gap-1 font-semibold">
                  <IndianRupee className="h-3.5 w-3.5" />
                  {referral.estimatedValue.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{tx('Tỷ lệ hoa hồng', 'Commission rate')}</span>
                <span className="font-semibold">{(referral.affiliate.commissionRate * 100).toFixed(0)}%</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{tx('Hoa hồng dự kiến', 'Estimated commission')}</span>
                <span className="flex items-center gap-1 text-lg font-bold text-primary">
                  <IndianRupee className="h-4 w-4" />
                  {estimatedCommission.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Referring Partner Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                {tx('Đối tác giới thiệu', 'Referring partner')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                    {referral.affiliate.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{referral.affiliate.name}</p>
                  <p className="text-xs text-muted-foreground">{referral.affiliate.email}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{tx('Mã giới thiệu', 'Referral code')}</span>
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                    {referral.affiliate.referralCode}
                  </code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{tx('Nhóm đối tác', 'Partner group')}</span>
                  <Badge variant="outline" className="text-xs">{referral.affiliate.partnerGroup}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-blue-100 p-1">
                    <FileText className="h-3 w-3 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{tx('Đã gửi khách hàng tiềm năng', 'Lead submitted')}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(referral.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                      {tx(' lúc ', ' at ')}
                      {new Date(referral.createdAt).toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 rounded-full p-1 ${
                    referral.status === 'APPROVED'
                      ? 'bg-green-100'
                      : referral.status === 'REJECTED'
                        ? 'bg-red-100'
                        : 'bg-yellow-100'
                  }`}>
                    <StatusIcon className={`h-3 w-3 ${
                      referral.status === 'APPROVED'
                        ? 'text-green-600'
                        : referral.status === 'REJECTED'
                          ? 'text-red-600'
                          : 'text-yellow-600'
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {referral.status === 'APPROVED'
                        ? tx('Đã duyệt', 'Approved')
                        : referral.status === 'REJECTED'
                          ? tx('Đã từ chối', 'Rejected')
                          : tx('Chờ duyệt', 'Pending')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {referral.status === 'PENDING'
                        ? tx('Cần quản trị viên duyệt', 'Admin review required')
                        : tx('Đã ghi nhận quyết định', 'Decision recorded')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
