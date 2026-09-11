'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BrandLogo } from '@/components/brand-logo';
import { PasswordInput } from '@/components/password-input';
import { LanguageToggle } from '@/components/language-toggle';
import { useI18n } from '@/components/i18n-provider';
import { User, Mail, Phone, LockKeyhole, Loader2, Sparkles, BadgeCheck, Zap } from 'lucide-react';

const benefitCards = [
  { icon: BadgeCheck, titleKey: 'registerPage.hero.vipTitle', descKey: 'registerPage.hero.vipDescription' },
  { icon: Zap, titleKey: 'registerPage.hero.payoutsTitle', descKey: 'registerPage.hero.payoutsDescription' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (password.length < 8) {
      setError(t('registerPage.validation.passwordMinLength'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('registerPage.validation.passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone: phone || undefined, name, password }),
      });
      const registerData = await registerResponse.json();

      if (!registerResponse.ok || !registerData.success) {
        setError(registerData.message || t('registerPage.validation.registerFailed'));
        return;
      }

      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch {
      setError(t('registerPage.validation.registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-orange-50 via-white to-amber-50 p-4">
      <div className="fixed right-4 top-4 z-50"><LanguageToggle /></div>
      <div className="smee-orb right-[-6rem] top-[-5rem] h-72 w-72 bg-orange-300/35" />
      <div className="smee-orb bottom-[-7rem] left-[-4rem] h-80 w-80 bg-amber-300/30" />
      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="mx-auto w-full max-w-md animate-smee-rise space-y-6">
          <div className="space-y-3 text-center">
            <BrandLogo className="mx-auto h-16 w-16 rounded-3xl bg-white shadow-2xl shadow-orange-500/20" />
            <div>
              <h1 className="text-3xl font-black tracking-[-0.04em]">SMEE</h1>
              <p className="text-sm text-muted-foreground">{t('registerPage.brand.subtitle')}</p>
            </div>
          </div>

          <Card className="border-white/70 bg-white/80 shadow-2xl shadow-orange-950/10">
            <CardHeader className="pb-4 text-center">
              <CardTitle className="text-2xl">{t('registerPage.form.title')}</CardTitle>
              <CardDescription>{t('registerPage.form.description')}</CardDescription>
            </CardHeader>
            <form onSubmit={handleRegister}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name">{t('registerPage.form.fullName')}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="name" value={name} onChange={(event) => setName(event.target.value)} className="pl-10" required autoFocus autoComplete="name" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('registerPage.form.email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="pl-10" required autoComplete="email" placeholder="you@smee.vn" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('registerPage.form.phone')} <span className="text-muted-foreground">({t('registerPage.form.optional')})</span></Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="pl-10" autoComplete="tel" placeholder="0912345678" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t('registerPage.form.password')}</Label>
                  <PasswordInput
                    id="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={8}
                    required
                    autoComplete="new-password"
                    leftIcon={<LockKeyhole className="h-4 w-4" />}
                  />
                  <p className="text-xs text-muted-foreground">{t('registerPage.form.passwordHint')}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">{t('registerPage.form.confirmPassword')}</Label>
                  <PasswordInput
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    minLength={8}
                    required
                    autoComplete="new-password"
                    leftIcon={<LockKeyhole className="h-4 w-4" />}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" size="lg" disabled={loading || !name || !email || !password || !confirmPassword}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? t('registerPage.form.creating') : t('registerPage.form.createAccount')}
                </Button>
              </CardFooter>
            </form>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            {t('registerPage.form.alreadyHaveAccount')}{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              {t('registerPage.form.login')}
            </Link>
          </p>
        </div>

        <section className="hidden space-y-8 lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/70 px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm backdrop-blur">
            <Sparkles className="h-4 w-4" />
            {t('registerPage.hero.badge')}
          </div>
          <div className="space-y-5">
            <h1 className="max-w-xl text-5xl font-black tracking-[-0.06em] text-slate-950">
              {t('registerPage.hero.title')} <span className="text-gradient">SMEE.</span>
            </h1>
            <p className="max-w-lg text-lg leading-8 text-slate-600">
              {t('registerPage.hero.description')}
            </p>
          </div>
          <div className="grid max-w-xl grid-cols-2 gap-3">
            {benefitCards.map((item) => (
              <div key={item.titleKey} className="glass-card p-5">
                <item.icon className="mb-4 h-6 w-6 text-orange-600" />
                <p className="font-black">{t(item.titleKey)}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{t(item.descKey)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
