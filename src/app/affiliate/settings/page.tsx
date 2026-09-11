'use client';

import React, { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PasswordInput } from '@/components/password-input';
import { useI18n } from '@/components/i18n-provider';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Building2,
  Mail,
  Globe,
  CreditCard,
  Shield,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Upload,
  Loader2,
  AtSign,
  Phone,
  Link,
  LockKeyhole,
} from 'lucide-react';

const COUNTRY_OPTIONS = [
  { value: 'Vietnam', labelKey: 'affiliateSettingsPage.country.Vietnam' },
  { value: 'India', labelKey: 'affiliateSettingsPage.country.India' },
  { value: 'USA', labelKey: 'affiliateSettingsPage.country.USA' },
  { value: 'UK', labelKey: 'affiliateSettingsPage.country.UK' },
  { value: 'Canada', labelKey: 'affiliateSettingsPage.country.Canada' },
  { value: 'Australia', labelKey: 'affiliateSettingsPage.country.Australia' },
  { value: 'Germany', labelKey: 'affiliateSettingsPage.country.Germany' },
  { value: 'France', labelKey: 'affiliateSettingsPage.country.France' },
  { value: 'Singapore', labelKey: 'affiliateSettingsPage.country.Singapore' },
  { value: 'UAE', labelKey: 'affiliateSettingsPage.country.UAE' },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: 'BANK_TRANSFER_VN', labelKey: 'affiliateSettingsPage.paymentMethods.bankTransferVn' },
  { value: 'PayPal', labelKey: 'PayPal' },
  { value: 'Stripe', labelKey: 'Stripe' },
  { value: 'Wise', labelKey: 'Wise' },
  { value: 'Wire Transfer', labelKey: 'affiliateSettingsPage.paymentMethods.wireTransfer' },
];

const VIETNAM_BANKS = [
  'Vietcombank',
  'VietinBank',
  'BIDV',
  'Agribank',
  'Techcombank',
  'MB Bank',
  'ACB',
  'VPBank',
  'Sacombank',
  'HDBank',
  'SHB',
  'VIB',
  'TPBank',
  'OCB',
  'MSB',
  'SeABank',
  'Eximbank',
  'Nam A Bank',
  'Bac A Bank',
  'ABBank',
  'PVcomBank',
  'LPBank',
  'SCB',
  'KienlongBank',
  'VietBank',
  'BaoViet Bank',
  'BVBank',
  'NCB',
  'Saigonbank',
  'PG Bank',
  'CBBank',
  'OceanBank',
  'GPBank',
  'VRB',
  'Indovina Bank',
  'HSBC Việt Nam',
  'Standard Chartered Việt Nam',
  'Shinhan Bank Việt Nam',
  'Woori Bank Việt Nam',
  'UOB Việt Nam',
  'Public Bank Việt Nam',
  'Hong Leong Bank Việt Nam',
  'CIMB Việt Nam',
  'DBS Bank Việt Nam',
];

const normalizePaymentMethod = (method?: unknown) => {
  if (method === 'Bank Transfer' || method === 'BANK_TRANSFER') return 'BANK_TRANSFER_VN';
  return typeof method === 'string' && method ? method : 'BANK_TRANSFER_VN';
};

const normalizeReferralCode = (value: string) => value.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase().slice(0, 10);
const isValidReferralCode = (value: string) => /^[A-Z0-9-]{4,10}$/.test(value);

export default function SettingsPage() {
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [publisherTier, setPublisherTier] = useState('STANDARD');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordOtpDialogOpen, setPasswordOtpDialogOpen] = useState(false);
  const [passwordResendIn, setPasswordResendIn] = useState(0);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    otpCode: '',
  });

  const [settingsForm, setSettingsForm] = useState({
    name: '',
    username: '',
    phone: '',
    company: '',
    email: '',
    country: 'Vietnam',
    paymentMethod: 'BANK_TRANSFER_VN',
    paymentEmail: '',
    bankName: '',
    bankAccountNumber: '',
    bankAccountHolder: '',
    bankBranch: '',
    bankProvince: '',
    profilePicture: '',
    facebookUrl: '',
    tiktokUrl: '',
    threadsUrl: '',
    youtubeUrl: '',
  });

  useEffect(() => {
    if (!authLoading && user) loadProfile();
  }, [authLoading, user]);

  useEffect(() => {
    if (passwordResendIn <= 0) return;
    const timer = window.setInterval(() => {
      setPasswordResendIn((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [passwordResendIn]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/affiliate/profile');
      const data = await res.json();
      if (data.success) {
        const pd = data.affiliate?.payoutDetails || {};
        const socialLinks = pd.socialLinks || {};
        setReferralCode(data.affiliate?.referralCode || '');
        setPublisherTier(data.affiliate?.tier || 'STANDARD');
        setSettingsForm({
          name: data.user?.name || user?.name || '',
          username: data.user?.username || user?.username || '',
          phone: data.user?.phone || user?.phone || '',
          company: pd.company || '',
          email: data.user?.email || user?.email || '',
          country: pd.country || 'Vietnam',
          paymentMethod: normalizePaymentMethod(pd.paymentMethod || pd.method),
          paymentEmail: pd.paymentEmail || pd.email || data.user?.email || '',
          bankName: pd.bankName || '',
          bankAccountNumber: pd.bankAccountNumber || pd.accountNumber || '',
          bankAccountHolder: pd.bankAccountHolder || '',
          bankBranch: pd.bankBranch || '',
          bankProvince: pd.bankProvince || '',
          profilePicture: data.user?.profilePicture || user?.profilePicture || '',
          facebookUrl: socialLinks.facebookUrl || '',
          tiktokUrl: socialLinks.tiktokUrl || '',
          threadsUrl: socialLinks.threadsUrl || '',
          youtubeUrl: socialLinks.youtubeUrl || '',
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const nextReferralCode = normalizeReferralCode(referralCode.trim());
    if (!isValidReferralCode(nextReferralCode)) {
      showNotification('error', t('affiliateSettingsPage.notifications.invalidReferralCode'));
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/affiliate/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settingsForm, referralCode: nextReferralCode }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success !== false) {
        window.dispatchEvent(new CustomEvent('affiliate-profile-updated'));
        showNotification('success', t('affiliateSettingsPage.notifications.settingsUpdated'));
      } else {
        showNotification('error', data?.error || t('affiliateSettingsPage.notifications.updateFailed'));
      }
    } catch (_e) {
      showNotification('error', t('affiliateSettingsPage.notifications.genericError'));
    } finally {
      setSaving(false);
    }
  };

  const validatePasswordForm = (requireOtp: boolean) => {
    if (!passwordForm.currentPassword) return t('affiliateSettingsPage.notifications.currentPasswordRequired');
    if (!passwordForm.newPassword) return t('affiliateSettingsPage.notifications.newPasswordRequired');
    if (passwordForm.newPassword.length < 8) return t('affiliateSettingsPage.notifications.passwordMinLength');
    if (!/[A-Za-z]/.test(passwordForm.newPassword) || !/\d/.test(passwordForm.newPassword)) {
      return t('affiliateSettingsPage.notifications.passwordNeedsLettersAndNumbers');
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return t('affiliateSettingsPage.notifications.passwordMismatch');
    if (passwordForm.currentPassword === passwordForm.newPassword) return t('affiliateSettingsPage.notifications.passwordSameAsCurrent');
    if (requireOtp && !passwordForm.otpCode.trim()) return t('affiliateSettingsPage.notifications.otpRequired');
    return null;
  };

  const handleRequestPasswordOtp = async () => {
    const validationError = validatePasswordForm(false);
    if (validationError) {
      showNotification('error', validationError);
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch('/api/affiliate/password-change/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: passwordForm.currentPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPasswordOtpDialogOpen(true);
        setPasswordResendIn(data.cooldownSeconds || 60);
        setPasswordForm((current) => ({ ...current, otpCode: '' }));
        showNotification('success', data.message || t('affiliateSettingsPage.notifications.otpSent'));
      } else {
        setPasswordResendIn(data.retryAfter || 0);
        showNotification('error', data.error || t('affiliateSettingsPage.notifications.otpSendFailed'));
      }
    } catch (_e) {
      showNotification('error', t('affiliateSettingsPage.notifications.otpSendFailed'));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleConfirmPasswordChange = async () => {
    const validationError = validatePasswordForm(true);
    if (validationError) {
      showNotification('error', validationError);
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch('/api/affiliate/password-change/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('success', data.message || t('affiliateSettingsPage.notifications.passwordChanged'));
        setPasswordOtpDialogOpen(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '', otpCode: '' });
        setTimeout(() => {
          window.location.href = '/login';
        }, 800);
      } else {
        showNotification('error', data.error || t('affiliateSettingsPage.notifications.passwordChangeFailed'));
      }
    } catch (_e) {
      showNotification('error', t('affiliateSettingsPage.notifications.passwordChangeFailed'));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    try {
      const res = await fetch('/api/affiliate/generate-code', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showNotification('success', t('affiliateSettingsPage.notifications.referralGenerated'));
        loadProfile();
      } else {
        showNotification('error', 'Failed to generate code: ' + data.error);
      }
    } catch (_e) {
      showNotification('error', t('affiliateSettingsPage.notifications.referralGenerateFailed'));
    }
  };

  const getReferralLink = () => `${window.location.origin}/r/${referralCode}`;

  const getPublisherRank = () => {
    switch (publisherTier) {
      case 'SVIP':
        return { type: 'S-VIP', label: 'Gold Publisher', badgeClassName: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'VIP':
        return { type: 'VIP', label: 'Silver Publisher', badgeClassName: 'bg-slate-100 text-slate-800 border-slate-200' };
      default:
        return { type: 'Standard', label: 'Standard Publisher', badgeClassName: 'bg-orange-50 text-orange-700 border-orange-200' };
    }
  };

  const accountInitial = (settingsForm.name || user?.name || 'A').charAt(0).toUpperCase();
  const publisherRank = getPublisherRank();

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(getReferralLink());
      setCopied(true);
      showNotification('success', t('affiliateSettingsPage.notifications.referralLinkCopied'));
      setTimeout(() => setCopied(false), 2000);
    } catch (_e) {
      showNotification('error', t('affiliateSettingsPage.notifications.referralLinkCopyFailed'));
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showNotification('error', t('affiliateSettingsPage.notifications.invalidAvatarType'));
      event.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showNotification('error', t('affiliateSettingsPage.notifications.avatarTooLarge'));
      event.target.value = '';
      return;
    }

    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await fetch('/api/affiliate/avatar', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSettingsForm((current) => ({ ...current, profilePicture: data.profilePicture }));
        showNotification('success', t('affiliateSettingsPage.notifications.avatarUploaded'));
      } else {
        showNotification('error', data.error || t('affiliateSettingsPage.notifications.avatarUpdateFailed'));
      }
    } catch (_e) {
      showNotification('error', t('affiliateSettingsPage.notifications.avatarUpdateFailed'));
    } finally {
      setAvatarUploading(false);
      event.target.value = '';
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {notification && (
        <Alert variant={notification.type === 'error' ? 'destructive' : 'default'}>
          {notification.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('affiliateSettingsPage.header.title')}</h1>
        <p className="text-muted-foreground">{t('affiliateSettingsPage.header.description')}</p>
      </div>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            {t('affiliateSettingsPage.account.title')}
          </CardTitle>
          <CardDescription>{t('affiliateSettingsPage.account.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 rounded-2xl">
                  <AvatarImage src={settingsForm.profilePicture} alt={settingsForm.name || user?.name || 'Avatar'} />
                  <AvatarFallback className="rounded-2xl bg-gradient-to-br from-orange-600 to-amber-500 text-lg font-bold text-white">
                    {accountInitial}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Avatar</p>
                  <p className="font-semibold">{settingsForm.name || user?.name || 'Publisher'}</p>
                </div>
              </div>
              <div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                >
                  {avatarUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  {t('affiliateSettingsPage.account.changeAvatar')}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('affiliateSettingsPage.account.rank')}</Label>
                <div className="flex h-10 items-center justify-between rounded-md border border-input bg-background px-3">
                  <span className="text-sm font-medium">{publisherRank.label}</span>
                  <Badge variant="outline" className={publisherRank.badgeClassName}>{publisherRank.type}</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('affiliateSettingsPage.account.referralCode')}</Label>
                <Input
                  value={referralCode}
                  onChange={(e) => setReferralCode(normalizeReferralCode(e.target.value))}
                  className="font-mono uppercase"
                  maxLength={10}
                  placeholder="SMEE-01"
                />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">{t('affiliateSettingsPage.account.referralCodeHint')}</p>
                  {!referralCode && (
                    <Button type="button" variant="outline" size="sm" onClick={handleGenerateCode}>
                      {t('affiliateSettingsPage.account.autoGenerate')}
                    </Button>
                  )}
                </div>
              </div>

              {referralCode && (
                <div className="space-y-2 md:col-span-2">
                  <Label>{t('affiliateSettingsPage.account.referralLink')}</Label>
                  <div className="flex items-center gap-2">
                    <Input readOnly value={getReferralLink()} className="font-mono" />
                    <Button variant="outline" size="icon" onClick={copyCode} aria-label={t('affiliateSettingsPage.account.copyReferralLink')}>
                      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            {t('affiliateSettingsPage.personal.title')}
          </CardTitle>
          <CardDescription>{t('affiliateSettingsPage.personal.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> {t('affiliateSettingsPage.personal.fullName')}
              </Label>
              <Input
                value={settingsForm.name}
                onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <AtSign className="h-3.5 w-3.5" /> {t('affiliateSettingsPage.personal.username')}
              </Label>
              <Input
                value={settingsForm.username}
                onChange={(e) => setSettingsForm({ ...settingsForm, username: e.target.value })}
                placeholder="hungpham"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> {t('affiliateSettingsPage.personal.phone')}
              </Label>
              <Input
                inputMode="tel"
                value={settingsForm.phone}
                onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                placeholder="0901234567"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> {t('affiliateSettingsPage.personal.company')}
              </Label>
              <Input
                value={settingsForm.company}
                onChange={(e) => setSettingsForm({ ...settingsForm, company: e.target.value })}
                placeholder={t('affiliateSettingsPage.personal.companyPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Email
              </Label>
              <Input
                type="email"
                value={settingsForm.email}
                onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" /> {t('affiliateSettingsPage.personal.country')}
              </Label>
              <Select
                value={settingsForm.country}
                onValueChange={(v) => setSettingsForm({ ...settingsForm, country: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COUNTRY_OPTIONS.map((country) => (
                    <SelectItem key={country.value} value={country.value}>
                      {t(country.labelKey, country.value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link className="h-4 w-4" />
            {t('affiliateSettingsPage.accountLinks.title')}
          </CardTitle>
          <CardDescription>{t('affiliateSettingsPage.accountLinks.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Facebook</Label>
              <Input
                type="url"
                value={settingsForm.facebookUrl}
                onChange={(e) => setSettingsForm({ ...settingsForm, facebookUrl: e.target.value })}
                placeholder="https://facebook.com/username"
              />
            </div>
            <div className="space-y-2">
              <Label>Tiktok</Label>
              <Input
                type="url"
                value={settingsForm.tiktokUrl}
                onChange={(e) => setSettingsForm({ ...settingsForm, tiktokUrl: e.target.value })}
                placeholder="https://tiktok.com/@username"
              />
            </div>
            <div className="space-y-2">
              <Label>Threads</Label>
              <Input
                type="url"
                value={settingsForm.threadsUrl}
                onChange={(e) => setSettingsForm({ ...settingsForm, threadsUrl: e.target.value })}
                placeholder="https://threads.net/@username"
              />
            </div>
            <div className="space-y-2">
              <Label>Youtube</Label>
              <Input
                type="url"
                value={settingsForm.youtubeUrl}
                onChange={(e) => setSettingsForm({ ...settingsForm, youtubeUrl: e.target.value })}
                placeholder="https://youtube.com/@username"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4" />
            {t('affiliateSettingsPage.payment.title')}
          </CardTitle>
          <CardDescription>{t('affiliateSettingsPage.payment.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('affiliateSettingsPage.payment.method')}</Label>
              <Select
                value={settingsForm.paymentMethod}
                onValueChange={(v) => setSettingsForm({ ...settingsForm, paymentMethod: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHOD_OPTIONS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {t(method.labelKey, method.value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {settingsForm.paymentMethod !== 'BANK_TRANSFER_VN' && (
              <div className="space-y-2">
                <Label>{t('affiliateSettingsPage.payment.email')}</Label>
                <Input
                  value={settingsForm.paymentEmail}
                  onChange={(e) => setSettingsForm({ ...settingsForm, paymentEmail: e.target.value })}
                  placeholder="payment@example.com"
                />
              </div>
            )}
          </div>

          {settingsForm.paymentMethod === 'BANK_TRANSFER_VN' && (
            <div className="grid grid-cols-1 gap-4 rounded-xl border bg-muted/20 p-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('affiliateSettingsPage.payment.bank')}</Label>
                <Select
                  value={settingsForm.bankName}
                  onValueChange={(v) => setSettingsForm({ ...settingsForm, bankName: v })}
                >
                  <SelectTrigger><SelectValue placeholder={t('affiliateSettingsPage.payment.bankPlaceholder')} /></SelectTrigger>
                  <SelectContent>
                    {VIETNAM_BANKS.map((bank) => (
                      <SelectItem key={bank} value={bank}>
                        {bank}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('affiliateSettingsPage.payment.accountNumber')}</Label>
                <Input
                  inputMode="numeric"
                  value={settingsForm.bankAccountNumber}
                  onChange={(e) => setSettingsForm({
                    ...settingsForm,
                    bankAccountNumber: e.target.value.replace(/\D/g, ''),
                  })}
                  placeholder={t('affiliateSettingsPage.payment.accountNumberPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('affiliateSettingsPage.payment.accountHolder')}</Label>
                <Input
                  value={settingsForm.bankAccountHolder}
                  onChange={(e) => setSettingsForm({
                    ...settingsForm,
                    bankAccountHolder: e.target.value.toLocaleUpperCase('vi-VN'),
                  })}
                  placeholder="NGUYEN VAN A"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('affiliateSettingsPage.payment.branch')}</Label>
                <Input
                  value={settingsForm.bankBranch}
                  onChange={(e) => setSettingsForm({ ...settingsForm, bankBranch: e.target.value })}
                  placeholder={t('affiliateSettingsPage.payment.branchPlaceholder')}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>{t('affiliateSettingsPage.payment.province')}</Label>
                <Input
                  value={settingsForm.bankProvince}
                  onChange={(e) => setSettingsForm({ ...settingsForm, bankProvince: e.target.value })}
                  placeholder={t('affiliateSettingsPage.payment.provincePlaceholder')}
                />
              </div>
            </div>
          )}

          <Separator />

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              {t('affiliateSettingsPage.payment.securityNote')}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <LockKeyhole className="h-4 w-4" />
            {t('affiliateSettingsPage.password.title')}
          </CardTitle>
          <CardDescription>
            {t('affiliateSettingsPage.password.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>{t('affiliateSettingsPage.password.current')}</Label>
              <PasswordInput
                autoComplete="current-password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder={t('affiliateSettingsPage.password.currentPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('affiliateSettingsPage.password.next')}</Label>
              <PasswordInput
                autoComplete="new-password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder={t('affiliateSettingsPage.password.nextPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('affiliateSettingsPage.password.confirm')}</Label>
              <PasswordInput
                autoComplete="new-password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder={t('affiliateSettingsPage.password.confirmPlaceholder')}
              />
            </div>
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              {t('affiliateSettingsPage.password.note')}
            </AlertDescription>
          </Alert>

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleRequestPasswordOtp}
              disabled={passwordLoading}
            >
              {passwordLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LockKeyhole className="mr-2 h-4 w-4" />}
              {t('affiliateSettingsPage.password.title')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={passwordOtpDialogOpen} onOpenChange={setPasswordOtpDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('affiliateSettingsPage.password.dialogTitle')}</DialogTitle>
            <DialogDescription>
              {t('affiliateSettingsPage.password.dialogDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('affiliateSettingsPage.password.otp')}</Label>
              <Input
                inputMode="numeric"
                maxLength={6}
                value={passwordForm.otpCode}
                onChange={(e) => setPasswordForm({ ...passwordForm, otpCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                placeholder={t('affiliateSettingsPage.password.otpPlaceholder')}
              />
            </div>
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                {t('affiliateSettingsPage.password.resendNote')}
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleRequestPasswordOtp}
              disabled={passwordLoading || passwordResendIn > 0}
            >
              {passwordResendIn > 0 ? `${t('affiliateSettingsPage.password.resendAfter')} ${passwordResendIn}s` : t('affiliateSettingsPage.password.resendCode')}
            </Button>
            <Button
              type="button"
              onClick={handleConfirmPasswordChange}
              disabled={passwordLoading || passwordForm.otpCode.length !== 6}
            >
              {passwordLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('affiliateSettingsPage.password.confirmChange')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
          {saving ? t('affiliateSettingsPage.actions.saving') : t('affiliateSettingsPage.actions.saveChanges')}
        </Button>
      </div>
    </div>
  );
}
