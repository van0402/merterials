'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Save,
  CheckCircle2,
  Shield,
  Key,
  BadgeDollarSign,
} from 'lucide-react';
import { useI18n } from '@/components/i18n-provider';

interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

interface ProgramSettings {
  id: string;
  currency: string;
  minPayoutCents: number;
}

const CURRENCY_OPTIONS = [
  { value: 'VND', label: 'VND - Vietnamese dong (₫)' },
  { value: 'USD', label: 'USD - US dollar ($)' },
  { value: 'EUR', label: 'EUR - Euro (€)' },
  { value: 'GBP', label: 'GBP - British pound (£)' },
  { value: 'INR', label: 'INR - Indian rupee (₹)' },
];

export default function SettingsPage() {
  const { language, t } = useI18n();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [settings, setSettings] = useState<ProgramSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [saved, setSaved] = useState(false);
  const [currencySaved, setCurrencySaved] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([fetchProfile(), fetchSettings()]);
    setLoading(false);
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/admin/profile');
      const data = await res.json();
      if (data.success) {
        setProfile(data.user);
        setName(data.user.name);
        setEmail(data.user.email);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.success) {
        setSettings({
          id: data.settings.id,
          currency: data.settings.currency || 'VND',
          minPayoutCents: data.settings.minPayoutCents ?? data.settings.minimumPayoutThreshold ?? 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch program settings:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        await fetchProfile();
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCurrency = async () => {
    if (!settings) return;
    setSavingCurrency(true);
    setCurrencySaved(false);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: settings.currency, minPayoutCents: settings.minPayoutCents }),
      });
      if (res.ok) {
        setCurrencySaved(true);
        setTimeout(() => setCurrencySaved(false), 3000);
        await fetchSettings();
      }
    } catch (error) {
      console.error('Failed to update currency:', error);
    } finally {
      setSavingCurrency(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[300px]" />
        <Skeleton className="h-[200px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('adminSettingsPage.title')}</h1>
        <p className="text-muted-foreground">{t('adminSettingsPage.description')}</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('adminSettingsPage.profile.title')}
              </CardTitle>
              <CardDescription>{t('adminSettingsPage.profile.description')}</CardDescription>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saved ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                  {t('adminSettingsPage.saved')}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? t('adminSettingsPage.saving') : t('adminSettingsPage.save')}
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="name">{t('adminSettingsPage.profile.name')}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">{t('adminSettingsPage.profile.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Currency Settings */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BadgeDollarSign className="h-5 w-5" />
                {t('adminSettingsPage.currency.title')}
              </CardTitle>
              <CardDescription>{t('adminSettingsPage.currency.description')}</CardDescription>
            </div>
            <Button onClick={handleSaveCurrency} disabled={savingCurrency || !settings}>
              {currencySaved ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                  {t('adminSettingsPage.saved')}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {savingCurrency ? t('adminSettingsPage.saving') : t('adminSettingsPage.saveConfig')}
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="currency">{t('adminSettingsPage.currency.defaultCurrency')}</Label>
            <Select
              value={settings?.currency || 'VND'}
              onValueChange={(value) =>
                setSettings((current) => ({
                  id: current?.id || '',
                  currency: value,
                  minPayoutCents: current?.minPayoutCents ?? 0,
                }))
              }
            >
              <SelectTrigger id="currency">
                <SelectValue placeholder={t('adminSettingsPage.currency.placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="minPayoutCents">{t('adminSettingsPage.currency.minPayout')}</Label>
            <Input
              id="minPayoutCents"
              type="number"
              min="0"
              value={settings?.minPayoutCents ?? 0}
              onChange={(e) =>
                setSettings((current) => ({
                  id: current?.id || '',
                  currency: current?.currency || 'VND',
                  minPayoutCents: Math.max(0, Math.trunc(Number(e.target.value) || 0)),
                }))
              }
              placeholder="100000"
            />
            <p className="text-xs text-muted-foreground">{t('adminSettingsPage.currency.minPayoutHint')}</p>
          </div>
          </div>
          <Separator />
          <p className="text-sm text-muted-foreground">
            {t('adminSettingsPage.currency.vndNote')}
          </p>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('adminSettingsPage.account.title')}
          </CardTitle>
          <CardDescription>{t('adminSettingsPage.account.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {profile && (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">{t('adminSettingsPage.account.role')}</p>
                  <p className="text-sm text-muted-foreground">{profile.role}</p>
                </div>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">{t('adminSettingsPage.account.status')}</p>
                  <p className="text-sm text-muted-foreground">{profile.status}</p>
                </div>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">{t('adminSettingsPage.account.created')}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(profile.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <Key className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {t('adminSettingsPage.security.title')}
          </CardTitle>
          <CardDescription>{t('adminSettingsPage.security.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t('adminSettingsPage.security.note')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
