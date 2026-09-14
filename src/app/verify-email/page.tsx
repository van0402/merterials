'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BrandLogo } from '@/components/brand-logo';
import { CheckCircle2, Loader2, MailCheck, RotateCcw } from 'lucide-react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') ?? '';
  const intendedRole = searchParams.get('role');
  const companyName = searchParams.get('companyName');
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/email-verification/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, code }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'Mã xác thực không đúng hoặc đã hết hạn.');
        return;
      }

     if (data.user?.role === 'ADMIN') {
  router.push('/admin');
} else if (intendedRole === 'supplier') {
  router.push(`/register-supplier${companyName ? `?companyName=${encodeURIComponent(companyName)}` : ''}`);
} else {
  router.push('/');
}
router.refresh();
    } catch {
      setError('Không xác thực được email. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setMessage('');
    setResending(true);

    try {
      const response = await fetch('/api/auth/email-verification/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'Không gửi lại được mã. Vui lòng thử lại.');
        return;
      }

      setMessage(data.message || 'Đã gửi lại mã xác thực.');
      setCooldown(60);
    } catch {
      setError('Không gửi lại được mã. Vui lòng thử lại.');
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-orange-50 via-white to-amber-50 p-4">
      <div className="smee-orb right-[-6rem] top-[-5rem] h-72 w-72 bg-orange-300/35" />
      <div className="smee-orb bottom-[-7rem] left-[-4rem] h-80 w-80 bg-amber-300/30" />

      <Card className="relative z-10 w-full max-w-md border-white/70 bg-white/85 shadow-2xl shadow-orange-950/10 backdrop-blur">
        <CardHeader className="space-y-4 text-center">
          <BrandLogo className="mx-auto h-16 w-16 rounded-3xl bg-white shadow-2xl shadow-orange-500/20" />
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600">
            <MailCheck className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-2xl font-black">Xác thực email</CardTitle>
            <CardDescription className="mt-2 leading-6">
              Nhập mã 6 số đã gửi tới email của bạn để hoàn tất đăng ký.
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleVerify}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {message && (
              <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Mã xác thực</Label>
              <Input
                id="code"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                className="h-14 text-center text-2xl font-black tracking-[0.45em]"
                placeholder="000000"
                required
                autoFocus
              />
              <p className="text-xs text-muted-foreground">Mã có hiệu lực trong 10 phút.</p>
            </div>
          </CardContent>

          <CardFooter className="flex-col gap-3">
            <Button type="submit" className="w-full" size="lg" disabled={loading || !email || code.length !== 6}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Đang xác thực...' : 'Xác thực và tiếp tục'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={handleResend}
              disabled={resending || !email || cooldown > 0}
            >
              {resending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
              {cooldown > 0 ? `Gửi lại mã sau ${cooldown}s` : 'Gửi lại mã'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Đã xác thực rồi?{' '}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Đăng nhập
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
