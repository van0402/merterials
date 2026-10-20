'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BrandLogo } from '@/components/brand-logo';
import { PasswordInput } from '@/components/password-input';
import { LanguageToggle } from '@/components/language-toggle';
import { LegalDialog } from '@/components/legal-dialog';
import { useI18n } from '@/components/i18n-provider';
import { User, Mail, Phone, Building2, LockKeyhole, Loader2, Sparkles } from 'lucide-react';

const featureCards = [
  { titleKey: 'registerPage.features.buyerTitle', textKey: 'registerPage.features.buyerText' },
  { titleKey: 'registerPage.features.supplierTitle', textKey: 'registerPage.features.supplierText' },
  { titleKey: 'registerPage.features.aiTitle', textKey: 'registerPage.features.aiText' },
  { titleKey: 'registerPage.features.verifiedTitle', textKey: 'registerPage.features.verifiedText' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [role, setRole] = useState<'user' | 'supplier'>('user');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!agreed) {
      setError('Vui lòng đồng ý với Điều khoản sử dụng và Chính sách bảo mật để tiếp tục.');
      return;
    }
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

      const params = new URLSearchParams({ email });
      if (role === 'supplier') {
        params.set('role', 'supplier');
        if (companyName.trim()) params.set('companyName', companyName.trim());
      }
      router.push(`/verify-email?${params.toString()}`);
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
      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden space-y-8 lg:block">
          <div className="flex items-center gap-3">
            <BrandLogo className="h-12 w-12 rounded-2xl bg-white shadow-lg shadow-orange-500/15" />
            <div>
              <p className="text-lg font-black tracking-[-0.02em]">{t('registerPage.brand.name')}</p>
              <p className="text-xs text-muted-foreground">{t('registerPage.brand.tagline')}</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/70 px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm backdrop-blur">
            <Sparkles className="h-4 w-4" />
            {t('registerPage.hero.badge')}
          </div>
          <div className="space-y-5">
            <h1 className="max-w-xl text-5xl font-black tracking-[-0.06em] text-slate-950">
              {t('registerPage.hero.titleLine1')}
              <br />
              <span className="text-gradient">{t('registerPage.hero.titleLine2')}</span>
            </h1>
            <p className="max-w-lg text-lg leading-8 text-slate-600">{t('registerPage.hero.description')}</p>
          </div>
          <div className="grid max-w-xl grid-cols-2 gap-3">
            {featureCards.map((item) => (
              <div key={item.titleKey} className="glass-card p-5">
                <p className="font-black">{t(item.titleKey)}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{t(item.textKey)}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mx-auto w-full max-w-md animate-smee-rise space-y-6">
          <Card className="border-white/70 bg-white/80 shadow-2xl shadow-orange-950/10">
            <CardHeader className="pb-4 text-center">
              <CardTitle className="text-2xl">{t('registerPage.form.title')}</CardTitle>
              <CardDescription>{t('registerPage.form.description')}</CardDescription>
            </CardHeader>
            <form onSubmit={handleRegister}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
                )}

                <div className="space-y-2">
                  <Label>{t('registerPage.form.roleQuestion')}</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('user')}
                      className={`rounded-xl border p-3 text-left transition ${role === 'user' ? 'border-orange-400 bg-orange-50 shadow-sm' : 'border-border'}`}
                    >
                      <p className="text-sm font-bold">{t('registerPage.form.roleUserTitle')}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{t('registerPage.form.roleUserText')}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('supplier')}
                      className={`rounded-xl border p-3 text-left transition ${role === 'supplier' ? 'border-orange-400 bg-orange-50 shadow-sm' : 'border-border'}`}
                    >
                      <p className="text-sm font-bold">{t('registerPage.form.roleSupplierTitle')}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{t('registerPage.form.roleSupplierText')}</p>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">{t('registerPage.form.fullName')}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="pl-10" required autoFocus autoComplete="name" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('registerPage.form.phone')} <span className="text-muted-foreground">({t('registerPage.form.optional')})</span></Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10" autoComplete="tel" placeholder="0912345678" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('registerPage.form.email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required autoComplete="email" placeholder={role === 'supplier' ? 'you@company.com' : 'you@gmail.com'} />
                  </div>
                </div>

                {role === 'supplier' && (
                  <div className="space-y-2">
                    <Label htmlFor="companyName">{t('registerPage.form.companyName')}</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="pl-10" placeholder="Công ty TNHH ABC" />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">{t('registerPage.form.password')}</Label>
                  <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required autoComplete="new-password" leftIcon={<LockKeyhole className="h-4 w-4" />} />
                  <p className="text-xs text-muted-foreground">{t('registerPage.form.passwordHint')}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">{t('registerPage.form.confirmPassword')}</Label>
                  <PasswordInput id="confirm-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={8} required autoComplete="new-password" leftIcon={<LockKeyhole className="h-4 w-4" />} />
                </div>

                <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <input
                    id="agree-terms"
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-orange-500"
                  />
                  <p>
                    <label htmlFor="agree-terms" className="cursor-pointer">Tôi đã đọc và đồng ý với</label>{' '}
                    <LegalDialog doc="terms">Điều khoản sử dụng</LegalDialog> và{' '}
                    <LegalDialog doc="privacy">Chính sách bảo mật</LegalDialog>.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" size="lg" disabled={loading || !agreed || !name || !email || !password || !confirmPassword}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? t('registerPage.form.creating') : t('registerPage.form.createAccount')}
                </Button>
              </CardFooter>
            </form>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            {t('registerPage.form.alreadyHaveAccount')}{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">{t('registerPage.form.login')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}