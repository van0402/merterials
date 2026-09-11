'use client';

import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Ticket, Plus, Pencil, Trash2, Copy, Check,
} from 'lucide-react';
import { useI18n } from '@/components/i18n-provider';

interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: string;
  discountValue: number;
  maxUses?: number;
  usedCount: number;
  affiliateId?: string;
  isActive: boolean;
  startsAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export default function CouponsPage() {
  const { language, t } = useI18n();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: '', description: '', discountType: 'PERCENTAGE', discountValue: '',
    maxUses: '', affiliateId: '', expiresAt: '',
  });

  useEffect(() => { fetchCoupons(); }, []);

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/admin/coupons');
      const data = await res.json();
      if (data.success) setCoupons(data.coupons || []);
    } catch (error) {
      console.error('Failed to fetch coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = {
        code: form.code,
        description: form.description || null,
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue),
        maxUses: form.maxUses ? parseInt(form.maxUses) : null,
        affiliateId: form.affiliateId || null,
        expiresAt: form.expiresAt || null,
        ...(editing ? { id: editing.id } : {}),
      };
      const res = await fetch('/api/admin/coupons', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await fetchCoupons();
        closeDialog();
      }
    } catch (error) {
      console.error('Failed to save coupon:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await fetch('/api/admin/coupons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !isActive }),
      });
      setCoupons(prev => prev.map(c => c.id === id ? { ...c, isActive: !isActive } : c));
    } catch (error) {
      console.error('Failed to toggle:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('adminCouponsPage.confirmDelete'))) return;
    try {
      await fetch('/api/admin/coupons', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setCoupons(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code,
      description: c.description || '',
      discountType: c.discountType,
      discountValue: String(c.discountValue),
      maxUses: c.maxUses ? String(c.maxUses) : '',
      affiliateId: c.affiliateId || '',
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '',
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm({ code: '', description: '', discountType: 'PERCENTAGE', discountValue: '', maxUses: '', affiliateId: '', expiresAt: '' });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const stats = {
    total: coupons.length,
    active: coupons.filter(c => c.isActive).length,
    totalUses: coupons.reduce((s, c) => s + c.usedCount, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('adminCouponsPage.title')}</h1>
          <p className="text-muted-foreground">{t('adminCouponsPage.description')}</p>
        </div>
        <Button onClick={() => { closeDialog(); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          {t('adminCouponsPage.create')}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('adminCouponsPage.stats.total')}</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('adminCouponsPage.stats.active')}</CardTitle>
            <Ticket className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.active}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('adminCouponsPage.stats.usage')}</CardTitle>
            <Ticket className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.totalUses}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('adminCouponsPage.table.title')}</CardTitle>
          <CardDescription>{t('adminCouponsPage.table.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {coupons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Ticket className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">{t('adminCouponsPage.empty.title')}</h3>
              <p className="text-sm text-muted-foreground">{t('adminCouponsPage.empty.description')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('adminCouponsPage.table.code')}</TableHead>
                  <TableHead>{t('adminCouponsPage.table.discount')}</TableHead>
                  <TableHead>{t('adminCouponsPage.table.usage')}</TableHead>
                  <TableHead>KOL/KOC</TableHead>
                  <TableHead>{t('adminCouponsPage.table.expires')}</TableHead>
                  <TableHead>{t('adminCouponsPage.stats.active')}</TableHead>
                  <TableHead className="text-right">{t('adminCouponsPage.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map(c => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <code className="rounded bg-muted px-2 py-0.5 text-sm font-mono">{c.code}</code>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyCode(c.code)}>
                          {copied === c.code ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `₹${c.discountValue}`}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{c.usedCount}{c.maxUses ? `/${c.maxUses}` : ''}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{c.affiliateId ? c.affiliateId.slice(0, 8) + '...' : t('adminCouponsPage.table.programWide')}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.expiresAt ? formatDate(c.expiresAt) : t('adminCouponsPage.table.never')}</TableCell>
                    <TableCell>
                      <Switch checked={c.isActive} onCheckedChange={() => handleToggle(c.id, c.isActive)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? t('adminCouponsPage.dialog.editTitle') : t('adminCouponsPage.dialog.createTitle')}</DialogTitle>
            <DialogDescription>
              {editing ? t('adminCouponsPage.dialog.editDescription') : t('adminCouponsPage.dialog.createDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t('adminCouponsPage.title')} *</Label>
              <Input value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} placeholder="SAVE20" className="font-mono" />
            </div>
            <div className="grid gap-2">
              <Label>{t('adminCouponsPage.dialog.description')}</Label>
              <Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="20% off for new customers" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t('adminCouponsPage.dialog.discountType')}</Label>
                <Select value={form.discountType} onValueChange={v => setForm({...form, discountType: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                    <SelectItem value="FIXED">Fixed Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{t('adminCouponsPage.dialog.discountValue')} *</Label>
                <Input type="number" value={form.discountValue} onChange={e => setForm({...form, discountValue: e.target.value})} placeholder="20" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t('adminCouponsPage.dialog.maxUses')}</Label>
                <Input type="number" value={form.maxUses} onChange={e => setForm({...form, maxUses: e.target.value})} placeholder={t('adminCouponsPage.dialog.unlimited')} />
              </div>
              <div className="grid gap-2">
                <Label>{t('adminCouponsPage.dialog.expiresAt')}</Label>
                <Input type="date" value={form.expiresAt} onChange={e => setForm({...form, expiresAt: e.target.value})} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>{t('adminCouponsPage.dialog.affiliateId')} ({t('adminCouponsPage.dialog.optional')})</Label>
              <Input value={form.affiliateId} onChange={e => setForm({...form, affiliateId: e.target.value})} placeholder={t('adminCouponsPage.table.programWide')} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>{t('adminCouponsPage.dialog.cancel')}</Button>
            <Button onClick={handleSave} disabled={saving || !form.code || !form.discountValue}>
              {saving ? t('adminCouponsPage.dialog.saving') : editing ? t('common.update') : t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
