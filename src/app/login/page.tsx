'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BrandLogo } from '@/components/brand-logo';
import { PasswordInput } from '@/components/password-input';
import { LanguageToggle } from '@/components/language-toggle';
import { useI18n } from '@/components/i18n-provider';
import {
  BriefcaseBusiness,
  Coffee,
  Eye,
  EyeOff,
  GraduationCap,
  Headphones,
  HeartPulse,
  Home,
  Loader2,
  LockKeyhole,
  Mail,
  Shirt,
  ShieldCheck,
  Cpu,
} from 'lucide-react';

const industryCards = [
  {
    icon: HeartPulse,
    titleKey: 'loginPage.industries.healthcare.title',
    textKey: 'loginPage.industries.healthcare.text',
    image: '/images/y-te.png',
    iconClass: 'text-sky-500 bg-sky-50',
  },
  {
    icon: GraduationCap,
    titleKey: 'loginPage.industries.education.title',
    textKey: 'loginPage.industries.education.text',
    image: '/images/giao-duc.png',
    iconClass: 'text-blue-500 bg-blue-50',
  },
  {
    icon: Home,
    titleKey: 'loginPage.industries.realEstate.title',
    textKey: 'loginPage.industries.realEstate.text',
    image: '/images/bat-dong-san.png',
    iconClass: 'text-orange-500 bg-orange-50',
  },
  {
    icon: Coffee,
    titleKey: 'loginPage.industries.household.title',
    textKey: 'loginPage.industries.household.text',
    image: '/images/gia-dung.png',
    iconClass: 'text-emerald-600 bg-emerald-50',
  },
  {
    icon: Shirt,
    titleKey: 'loginPage.industries.fashion.title',
    textKey: 'loginPage.industries.fashion.text',
    image: '/images/thoi-trang.png',
    iconClass: 'text-pink-500 bg-pink-50',
  },
  {
    icon: Cpu,
    titleKey: 'loginPage.industries.technology.title',
    textKey: 'loginPage.industries.technology.text',
    image: '/images/cong-nghe.png',
    iconClass: 'text-violet-500 bg-violet-50',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState('');
  const [loginMessage, setLoginMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [activeIndustry, setActiveIndustry] = useState(2);
  const [forgotDialogOpen, setForgotDialogOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'confirm'>('email');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotResendIn, setForgotResendIn] = useState(0);
  const [forgotForm, setForgotForm] = useState({
    email: '',
    otpCode: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const googleError = new URLSearchParams(window.location.search).get('error');
    if (googleError) setError(googleError);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndustry((current) => (current + 1) % industryCards.length);
    }, 2800);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (forgotResendIn <= 0) return;
    const timer = window.setInterval(() => {
      setForgotResendIn((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [forgotResendIn]);

  useEffect(() => {
    let cancelled = false;

    const redirectIfAuthenticated = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok || cancelled) {
          if (!cancelled) setCheckingSession(false);
          return;
        }

        const data = await response.json();
        if (data.user?.role) {
          router.replace(resolveLoginTarget(data.user));
          router.refresh();
          return;
        }


        if (!cancelled) setCheckingSession(false);
      } catch {
        // Not authenticated or session check failed; stay on login.
        if (!cancelled) setCheckingSession(false);
      }
    };

    redirectIfAuthenticated();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const openForgotPassword = () => {
    setForgotError('');
    setForgotMessage('');
    setForgotStep('email');
    setForgotForm({
      email: email || '',
      otpCode: '',
      newPassword: '',
      confirmPassword: '',
    });
    setForgotDialogOpen(true);
  };

  const validateForgotPassword = () => {
    if (!forgotForm.newPassword) return t('loginPage.forgot.newPasswordRequired');
    if (forgotForm.newPassword.length < 8) return t('loginPage.forgot.passwordMinLength');
    if (!/[A-Za-z]/.test(forgotForm.newPassword) || !/\d/.test(forgotForm.newPassword)) {
      return t('loginPage.forgot.passwordNeedsLettersAndNumbers');
    }
    if (forgotForm.newPassword !== forgotForm.confirmPassword) return t('loginPage.forgot.passwordMismatch');
    if (forgotForm.otpCode.length !== 6) return t('loginPage.forgot.otpRequired');
    return null;
  };

  const requestPasswordReset = async () => {
    setForgotError('');
    setForgotMessage('');
    const targetEmail = forgotForm.email.trim().toLowerCase();
    if (!targetEmail) {
      setForgotError(t('loginPage.forgot.emailRequired'));
      return;
    }

    setForgotLoading(true);
    try {
      const response = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setForgotResendIn(data.retryAfter || 0);
        setForgotError(data.error || t('loginPage.forgot.requestFailed'));
        return;
      }

      setForgotStep('confirm');
      setForgotResendIn(data.cooldownSeconds || 60);
      setForgotMessage(data.message || t('loginPage.forgot.otpSent'));
      setForgotForm((current) => ({ ...current, email: targetEmail, otpCode: '' }));
    } catch {
      setForgotError(t('loginPage.forgot.requestFailedRetry'));
    } finally {
      setForgotLoading(false);
    }
  };

  const confirmPasswordReset = async () => {
    setForgotError('');
    setForgotMessage('');
    const validationError = validateForgotPassword();
    if (validationError) {
      setForgotError(validationError);
      return;
    }

    setForgotLoading(true);
    try {
      const response = await fetch('/api/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(forgotForm),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setForgotError(data.error || t('loginPage.forgot.resetFailed'));
        return;
      }

      setEmail(forgotForm.email);
      setPassword('');
      setForgotDialogOpen(false);
      setError('');
      setLoginMessage(data.message || t('loginPage.forgot.resetSuccess'));
      setForgotForm({ email: '', otpCode: '', newPassword: '', confirmPassword: '' });
    } catch {
      setForgotError(t('loginPage.forgot.resetFailedRetry'));
    } finally {
      setForgotLoading(false);
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoginMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.code === 'EMAIL_NOT_VERIFIED') {
          router.push(`/verify-email?email=${encodeURIComponent(email)}`);
          return;
        }
        setError(response.status === 401 ? t('auth.invalidCredentials') : data.message || t('auth.invalidCredentials'));
        return;
      }

      router.push(resolveLoginTarget(data.user));
      router.refresh();

    } catch {
      setError(t('loginPage.form.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  function resolveLoginTarget(user: { role: string; contractStatus?: string | null }) {
    if (user.role === 'ADMIN') return '/admin';
    const needsContract = !user.contractStatus || user.contractStatus === 'DRAFT';
    return needsContract ? '/affiliate/contract' : '/affiliate';
  }


  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8fb] p-4">
        <div className="fixed right-4 top-4 z-50"><LanguageToggle /></div>
        <Card className="w-full max-w-sm border-slate-200 bg-white text-center shadow-xl shadow-slate-950/5">
          <CardContent className="flex flex-col items-center gap-4 p-8">
            <BrandLogo className="h-14 w-14 rounded-2xl bg-white shadow-lg shadow-orange-500/15" />
            <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
            <div>
              <p className="font-semibold text-slate-900">{t('loginPage.sessionCheck.title')}</p>
              <p className="mt-1 text-sm text-slate-500">{t('loginPage.sessionCheck.description')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f6fa] text-slate-950 lg:p-5">
      <div className="fixed right-4 top-4 z-50"><LanguageToggle /></div>
      <div className="mx-auto grid min-h-screen w-full overflow-hidden bg-white shadow-2xl shadow-slate-950/10 lg:min-h-[calc(100vh-2.5rem)] lg:max-w-[1600px] lg:rounded-[2rem] lg:border lg:border-slate-200 lg:grid-cols-[1.25fr_0.75fr] 2xl:max-w-[1760px]">
        <section className="relative hidden overflow-hidden bg-[#fff7ef] p-10 text-slate-950 lg:flex lg:flex-col lg:justify-between xl:p-16 2xl:p-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(255,255,255,0.95),transparent_34%),radial-gradient(circle_at_84%_28%,rgba(255,222,190,0.7),transparent_34%),linear-gradient(135deg,#fffaf5_0%,#fff0e3_52%,#fff8f0_100%)]" />
          <div className="absolute -right-24 top-24 h-80 w-80 rounded-full bg-orange-200/35 blur-3xl" />
          <div className="absolute -bottom-28 -left-20 h-96 w-96 rounded-full bg-amber-100/80 blur-3xl" />

          <div className="relative z-10 mx-auto w-full max-w-[820px] space-y-5 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white/70 px-4 py-2 text-sm font-bold text-orange-600 shadow-sm backdrop-blur">
              <ShieldCheck className="h-4 w-4" />
              {t('loginPage.hero.badge')}
            </div>
            <div className="space-y-4">
              <h1 className="mx-auto max-w-[780px] text-center font-black leading-[0.92] tracking-[-0.055em] text-[#101a33]">
                <span className="block whitespace-nowrap text-[clamp(2.65rem,4.8vw,4.9rem)]">
                  {t('loginPage.hero.titleLine1')}
                </span>
                <span className="mt-1 block whitespace-nowrap text-[clamp(2.65rem,4.8vw,4.9rem)] text-orange-500">
                  {t('loginPage.hero.titleLine2')}
                </span>
              </h1>
              <p className="mx-auto w-fit -rotate-1 text-center text-[clamp(1.65rem,2.45vw,2.65rem)] font-extrabold leading-none tracking-[-0.03em] text-[#15213a]">
                {t('loginPage.hero.subtitle')}
                <span className="mx-auto mt-1.5 block h-1 w-[88%] rounded-full bg-orange-400/70" />
              </p>
              <p className="mx-auto max-w-lg text-[15px] font-medium leading-7 text-slate-600 xl:text-base xl:leading-8">
                {t('loginPage.hero.description')}
              </p>
            </div>
          </div>

          <div className="relative z-10 mx-auto w-full max-w-[980px] space-y-6">
            <div className="relative h-80 overflow-hidden rounded-[2.25rem] bg-white/45 p-6 shadow-2xl shadow-orange-200/45 backdrop-blur xl:h-88 2xl:h-96">
              <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-orange-50/40 to-white/40" />
              <div className="relative flex h-full items-center justify-center gap-3">
                {industryCards.map((item, index) => {
                  const rawOffset = index - activeIndustry;
                  const offset = rawOffset > industryCards.length / 2
                    ? rawOffset - industryCards.length
                    : rawOffset < -industryCards.length / 2
                      ? rawOffset + industryCards.length
                      : rawOffset;
                  const isActive = offset === 0;
                  const isVisible = Math.abs(offset) <= 2;

                  if (!isVisible) return null;

                  return (
                    <button
                      key={item.titleKey}
                      type="button"
                      onClick={() => setActiveIndustry(index)}
                      className={`group absolute top-1/2 w-48 -translate-y-1/2 overflow-hidden rounded-[1.8rem] border bg-white text-left text-white shadow-xl transition-all duration-500 xl:w-56 ${isActive
                          ? 'z-30 h-64 scale-110 border-orange-200 shadow-orange-500/30 ring-2 ring-orange-300/70 xl:h-72'
                          : 'z-10 h-56 border-white/70 opacity-75 shadow-slate-950/20 hover:opacity-100 xl:h-64'
                        }`}
                      style={{ transform: `translate(${offset * 11}rem, -50%) scale(${isActive ? 1.08 : 0.88})` }}
                    >
                      <Image
                        src={item.image}
                        alt={t(item.titleKey)}
                        fill
                        sizes="224px"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 px-3 pb-4 text-center">
                        <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full shadow-lg ring-1 ring-white/60 ${item.iconClass}`}>
                          <item.icon className="h-5 w-5" />
                        </div>
                        <p className="mt-3 text-base font-black uppercase tracking-tight drop-shadow">{t(item.titleKey)}</p>
                        <p className="mt-1.5 text-xs leading-5 text-white/85 drop-shadow">{t(item.textKey)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              {industryCards.map((item, index) => (
                <button
                  key={item.titleKey}
                  type="button"
                  aria-label={`${t('loginPage.hero.selectIndustry')} ${t(item.titleKey)}`}
                  onClick={() => setActiveIndustry(index)}
                  className={`h-2 rounded-full transition-all ${index === activeIndustry ? 'w-7 bg-orange-500' : 'w-2 bg-orange-200/70 hover:bg-orange-300'}`}
                />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-orange-100 bg-white/75 p-4 shadow-lg shadow-orange-100/40 backdrop-blur">
                <BriefcaseBusiness className="mb-2 h-5 w-5 text-orange-500" />
                <p className="text-sm font-bold text-slate-900">{t('loginPage.hero.multiIndustryTitle')}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{t('loginPage.hero.multiIndustryDescription')}</p>
              </div>
              <div className="rounded-2xl border border-orange-100 bg-white/75 p-4 shadow-lg shadow-orange-100/40 backdrop-blur">
                <Headphones className="mb-2 h-5 w-5 text-orange-500" />
                <p className="text-sm font-bold text-slate-900">{t('loginPage.hero.realtimeSupportTitle')}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{t('loginPage.hero.realtimeSupportDescription')}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center bg-white p-5 sm:p-8 lg:p-12 xl:p-16">
          <div className="w-full max-w-[430px]">
            <Card className="border-0 bg-white shadow-none">
              <CardHeader className="items-center px-0 pb-9 pt-0 text-center">
                <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-[0_18px_55px_rgba(249,115,22,0.18)] ring-1 ring-orange-100/70">
                  <BrandLogo className="h-16 w-16 rounded-3xl" />
                </div>
                <CardTitle className="text-[26px] font-black tracking-[-0.04em] text-slate-950">
                  {t('loginPage.form.title')}
                </CardTitle>
                <CardDescription className="mt-3 max-w-[320px] text-[15px] leading-7 text-slate-500">
                  {t('loginPage.form.description')}
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleLogin}>
                <CardContent className="space-y-5 px-0">
                  {loginMessage && (
                    <Alert>
                      <AlertDescription>{loginMessage}</AlertDescription>
                    </Alert>
                  )}
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2.5">
                    <Label htmlFor="email" className="text-[15px] font-bold text-slate-800">{t('loginPage.form.email')}</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder={t('loginPage.form.emailPlaceholder')}
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="h-[54px] rounded-2xl border-slate-200 bg-white pl-14 text-[15px] shadow-[0_5px_20px_rgba(15,23,42,0.04)] placeholder:text-slate-400 focus-visible:ring-orange-200"
                        required
                        autoFocus
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <Label htmlFor="password" className="text-[15px] font-bold text-slate-800">{t('loginPage.form.password')}</Label>
                    <div className="relative">
                      <LockKeyhole className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('loginPage.form.passwordPlaceholder')}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="h-[54px] rounded-2xl border-slate-200 bg-white px-12 text-[15px] shadow-[0_5px_20px_rgba(15,23,42,0.04)] placeholder:text-slate-400 focus-visible:ring-orange-200"
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-orange-500"
                        aria-label={showPassword ? t('loginPage.form.hidePassword') : t('loginPage.form.showPassword')}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-1">
                    <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-slate-400">
                      <Checkbox
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
                        className="h-4 w-4 rounded border-slate-200 data-[state=checked]:border-orange-500 data-[state=checked]:bg-orange-500"
                      />
                      {t('loginPage.form.rememberMe')}
                    </label>
                    <button
                      type="button"
                      onClick={openForgotPassword}
                      className="text-sm font-bold text-orange-500 hover:text-orange-600 hover:underline"
                    >
                      {t('loginPage.form.forgotPassword')}
                    </button>
                  </div>
                </CardContent>

                <CardFooter className="flex-col gap-6 px-0 pb-0 pt-7">
                  <Button
                    type="submit"
                    className="h-[56px] w-full rounded-2xl bg-gradient-to-r from-orange-600 to-orange-400 text-base font-extrabold text-white shadow-[0_14px_30px_rgba(249,115,22,0.32)] transition hover:from-orange-700 hover:to-orange-500"
                    disabled={loading || !email || !password}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {loading ? t('loginPage.form.loggingIn') : t('loginPage.form.loginCta')}
                  </Button>

                  <div className="flex w-full items-center gap-4 text-sm text-slate-400">
                    <div className="h-px flex-1 bg-slate-100" />
                    <span>{t('loginPage.form.or')}</span>
                    <div className="h-px flex-1 bg-slate-100" />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { window.location.href = '/api/auth/google/start'; }}
                    className="h-[52px] w-full rounded-2xl border-slate-200 bg-white text-[15px] font-bold text-slate-700 shadow-[0_5px_20px_rgba(15,23,42,0.03)] hover:bg-slate-50"
                  >
                    <span className="mr-3 text-xl font-black leading-none text-[#4285f4]">G</span>
                    {t('loginPage.form.googleLogin')}
                  </Button>

                  <p className="pt-2 text-center text-sm text-slate-400">
                    {t('loginPage.form.noAccount')}{' '}
                    <Link href="/register" className="font-bold text-orange-500 hover:text-orange-600 hover:underline">
                      {t('loginPage.form.registerNow')}
                    </Link>
                  </p>
                </CardFooter>
              </form>
            </Card>
          </div>
        </section>
      </div>

      <Dialog open={forgotDialogOpen} onOpenChange={setForgotDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('loginPage.forgot.title')}</DialogTitle>
            <DialogDescription>
              {forgotStep === 'email'
                ? t('loginPage.forgot.emailDescription')
                : t('loginPage.forgot.confirmDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {forgotMessage && (
              <Alert>
                <AlertDescription>{forgotMessage}</AlertDescription>
              </Alert>
            )}
            {forgotError && (
              <Alert variant="destructive">
                <AlertDescription>{forgotError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>{t('loginPage.form.email')}</Label>
              <Input
                type="email"
                value={forgotForm.email}
                onChange={(event) => setForgotForm({ ...forgotForm, email: event.target.value })}
                placeholder="you@example.com"
                disabled={forgotStep === 'confirm'}
              />
            </div>

            {forgotStep === 'confirm' && (
              <>
                <div className="space-y-2">
                  <Label>{t('loginPage.forgot.otpCode')}</Label>
                  <Input
                    inputMode="numeric"
                    maxLength={6}
                    value={forgotForm.otpCode}
                    onChange={(event) => setForgotForm({ ...forgotForm, otpCode: event.target.value.replace(/\D/g, '').slice(0, 6) })}
                    placeholder={t('loginPage.forgot.otpPlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('loginPage.forgot.newPassword')}</Label>
                  <PasswordInput
                    autoComplete="new-password"
                    value={forgotForm.newPassword}
                    onChange={(event) => setForgotForm({ ...forgotForm, newPassword: event.target.value })}
                    placeholder={t('loginPage.forgot.newPasswordPlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('loginPage.forgot.confirmNewPassword')}</Label>
                  <PasswordInput
                    autoComplete="new-password"
                    value={forgotForm.confirmPassword}
                    onChange={(event) => setForgotForm({ ...forgotForm, confirmPassword: event.target.value })}
                    placeholder={t('loginPage.forgot.confirmNewPasswordPlaceholder')}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            {forgotStep === 'confirm' ? (
              <Button
                type="button"
                variant="outline"
                onClick={requestPasswordReset}
                disabled={forgotLoading || forgotResendIn > 0}
              >
                {forgotResendIn > 0 ? `${t('loginPage.forgot.resendAfter')} ${forgotResendIn}s` : t('loginPage.forgot.resendCode')}
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={() => setForgotDialogOpen(false)}>
                {t('loginPage.forgot.cancel')}
              </Button>
            )}
            <Button
              type="button"
              onClick={forgotStep === 'email' ? requestPasswordReset : confirmPasswordReset}
              disabled={forgotLoading}
            >
              {forgotLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {forgotStep === 'email' ? t('loginPage.forgot.sendOtp') : t('loginPage.forgot.resetPassword')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
