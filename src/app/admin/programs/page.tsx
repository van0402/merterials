'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Layers, Plus, Star, Percent, Clock, Globe, Edit, Trash2, Lock, UserPlus, Users, Upload, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { formatMinorUnits } from '@/lib/money';
import { useI18n } from '@/components/i18n-provider';

interface ProgramAssignment {
  id: string;
  affiliateId: string;
  status: string;
  affiliate: {
    user: { name: string; email: string; status: string };
  };
}

interface Program {
  id: string;
  name: string;
  slug: string;
  description?: string;
  commissionRate: number;
  commissionType: string;
  cookieDuration: number;
  currency: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  isActive: boolean;
  isDefault: boolean;
  autoApprove: boolean;
  minPayoutCents: number;
  payoutFrequency: string;
  termsUrl?: string;
  bannerUrl?: string;
  brandColor?: string;
  productDescription?: string;
  servicePrice?: string;
  estimatedCommission?: string;
  campaignAssets?: CampaignAsset[];
  contentSuggestions?: ContentSuggestion[];
  supportUrl?: string;
  supportLabel?: string;
  createdAt: string;
  affiliatePrograms?: ProgramAssignment[];
  _count?: { affiliatePrograms: number };
}

interface AffiliateOption {
  id: string;
  user: { name: string; email: string; status: string };
  referralCode: string;
}

interface CampaignAsset {
  type: 'video' | 'image' | 'file' | 'drive';
  title?: string | null;
  url?: string | null;
  note?: string | null;
}

interface ContentSuggestion {
  title?: string | null;
  body?: string | null;
  url?: string | null;
}

const emptyForm = {
  name: '', slug: '', description: '', commissionRate: '20', commissionType: 'PERCENTAGE',
  cookieDuration: '30', currency: 'VND', visibility: 'PUBLIC', autoApprove: false, minPayoutCents: '100000',
  payoutFrequency: 'MONTHLY', termsUrl: '', bannerUrl: '', brandColor: '#6366f1',
  productDescription: '', servicePrice: '', estimatedCommission: '', campaignAssets: [] as CampaignAsset[], contentSuggestionsText: '',
  supportUrl: '', supportLabel: '',
};

const emptyAssetForm: CampaignAsset = { title: '', url: '', note: '', type: 'drive' };

const visibilityLabel = (value: string) => value === 'PRIVATE' ? 'Riêng tư' : 'Public';

const isUrl = (value?: string) => /^https?:\/\//i.test((value || '').trim());

const normalizeExternalUrl = (url?: string | null) => {
  const value = (url || '').trim();
  if (!value) return '';
  if (/^(https?:\/\/|mailto:|tel:)/i.test(value)) return value;
  return `https://${value.replace(/^\/+/, '')}`;
};

const normalizeExistingAssets = (assets?: CampaignAsset[]) => (assets || []).map((asset) => ({
  type: asset.type || 'file',
  title: asset.title || '',
  url: asset.url || '',
  note: asset.note || '',
}));

const parseContentSuggestions = (value: string): ContentSuggestion[] => value
  .split('\n---\n')
  .map((block) => block.trim())
  .filter(Boolean)
  .map((block) => {
    const lines = block.split('\n');
    if (lines.length === 1) {
      return { title: 'Gợi ý content', url: null, body: lines[0] };
    }
    return { title: lines[0] || 'Gợi ý content', url: null, body: lines.slice(1).join('\n').trim() || null };
  });

const formatContentSuggestions = (items?: ContentSuggestion[]) => (items || [])
  .map((item) => `${item.title || 'Mẫu content'}${item.url ? ` | ${item.url}` : ''}${item.body ? `\n${item.body}` : ''}`)
  .join('\n---\n');

export default function ProgramsPage() {
  const { tx } = useI18n();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [affiliates, setAffiliates] = useState<AffiliateOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);
  const [assigningProgram, setAssigningProgram] = useState<Program | null>(null);
  const [selectedAffiliateId, setSelectedAffiliateId] = useState('');
  const [saving, setSaving] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [editingAssetIndex, setEditingAssetIndex] = useState<number | null>(null);
  const [assetForm, setAssetForm] = useState<CampaignAsset>(emptyAssetForm);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([fetchPrograms(), fetchAffiliates()]);
    setLoading(false);
  };

  const fetchPrograms = async () => {
    try {
      const res = await fetch('/api/admin/programs');
      const data = await res.json();
      if (data.success) {
        const nextPrograms = data.programs || [];
        setPrograms(nextPrograms);
        setAssigningProgram((current) => current ? nextPrograms.find((program: Program) => program.id === current.id) || current : current);
      }
    } catch (error) {
      console.error('Failed to fetch programs:', error);
    }
  };

  const fetchAffiliates = async () => {
    try {
      const res = await fetch('/api/admin/affiliates');
      const data = await res.json();
      if (data.success) setAffiliates(data.affiliates || []);
    } catch (error) {
      console.error('Failed to fetch affiliates:', error);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (p: Program) => {
    setEditing(p);
    setForm({
      name: p.name, slug: p.slug, description: p.description || '',
      commissionRate: String(p.commissionRate), commissionType: p.commissionType,
      cookieDuration: String(p.cookieDuration), currency: p.currency,
      visibility: p.visibility || 'PUBLIC', autoApprove: p.autoApprove, minPayoutCents: String(p.minPayoutCents),
      payoutFrequency: p.payoutFrequency, termsUrl: p.termsUrl || '',
      bannerUrl: p.bannerUrl || '', brandColor: p.brandColor || '#6366f1',
      productDescription: p.productDescription || '', servicePrice: p.servicePrice || '',
      estimatedCommission: p.estimatedCommission || '', campaignAssets: normalizeExistingAssets(p.campaignAssets),
      contentSuggestionsText: formatContentSuggestions(p.contentSuggestions), supportUrl: p.supportUrl || '',
      supportLabel: p.supportLabel || '',
    });
    setDialogOpen(true);
  };

  const openAssign = (program: Program) => {
    setAssigningProgram(program);
    setSelectedAffiliateId('');
    setAssignDialogOpen(true);
  };

  const openCreateAsset = () => {
    setEditingAssetIndex(null);
    setAssetForm(emptyAssetForm);
    setAssetDialogOpen(true);
  };

  const openEditAsset = (asset: CampaignAsset, index: number) => {
    setEditingAssetIndex(index);
    setAssetForm({
      title: asset.title || '',
      url: asset.url || '',
      note: asset.note || '',
      type: asset.type || 'file',
    });
    setAssetDialogOpen(true);
  };

  const saveAsset = () => {
    const title = (assetForm.title || '').trim();
    const url = normalizeExternalUrl(assetForm.url);
    const note = (assetForm.note || '').trim();
    if (!title) {
      alert(tx('Nhập tiêu đề tài nguyên nhé', 'Please enter a resource title'));
      return;
    }

    const nextAsset: CampaignAsset = { title, url: url || null, note: note || null, type: assetForm.type || 'file' };
    setForm((current) => {
      const assets = [...current.campaignAssets];
      if (editingAssetIndex === null) assets.push(nextAsset);
      else assets[editingAssetIndex] = nextAsset;
      return { ...current, campaignAssets: assets };
    });
    setAssetDialogOpen(false);
  };

  const removeAsset = (index: number) => {
    setForm((current) => ({ ...current, campaignAssets: current.campaignAssets.filter((_, itemIndex) => itemIndex !== index) }));
  };

  const handleBannerUpload = async (file?: File) => {
    if (!file) return;
    setUploadingBanner(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/programs/banner', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setForm((current) => ({ ...current, bannerUrl: data.url }));
      } else {
        alert(data.error || tx('Không thể upload ảnh banner', 'Unable to upload banner image'));
      }
    } catch (error) {
      console.error('Failed to upload banner:', error);
      alert(tx('Không thể upload ảnh banner', 'Unable to upload banner image'));
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: any = {
        name: form.name, slug: form.slug || form.name, description: form.description || null,
        commissionRate: parseFloat(form.commissionRate), commissionType: form.commissionType,
        cookieDuration: parseInt(form.cookieDuration), currency: form.currency,
        visibility: form.visibility,
        autoApprove: form.autoApprove, minPayoutCents: parseInt(form.minPayoutCents),
        payoutFrequency: form.payoutFrequency,
        termsUrl: form.termsUrl || null,
        bannerUrl: form.bannerUrl || null,
        brandColor: form.brandColor || null,
        productDescription: form.productDescription || null,
        servicePrice: form.servicePrice || null,
        estimatedCommission: form.estimatedCommission || null,
        campaignAssets: form.campaignAssets.map((asset) => ({
          type: asset.type || 'file',
          title: asset.title || null,
          url: asset.url || null,
          note: asset.note || null,
        })),
        contentSuggestions: parseContentSuggestions(form.contentSuggestionsText),
        supportUrl: form.supportUrl || null,
        supportLabel: form.supportLabel || null,
      };
      if (editing) body.id = editing.id;

      const res = await fetch('/api/admin/programs', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        await fetchPrograms();
        setDialogOpen(false);
      } else {
        alert(data.error || tx('Không thể lưu chương trình', 'Unable to save program'));
      }
    } catch (error) {
      console.error('Failed to save program:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async () => {
    if (!assigningProgram || !selectedAffiliateId) return;
    setAssigning(true);
    try {
      const res = await fetch('/api/admin/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign', programId: assigningProgram.id, affiliateId: selectedAffiliateId, status: 'ACTIVE' }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchPrograms();
        setSelectedAffiliateId('');
      } else {
        alert(data.error || tx('Không thể assign KOC', 'Unable to assign KOC'));
      }
    } catch (error) {
      console.error('Failed to assign affiliate:', error);
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async (programId: string, affiliateId: string) => {
    if (!confirm(tx('Gỡ KOC khỏi chương trình này?', 'Remove this KOC from the program?'))) return;
    try {
      const res = await fetch('/api/admin/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unassign', programId, affiliateId }),
      });
      const data = await res.json();
      if (data.success) await fetchPrograms();
      else alert(data.error || tx('Không thể gỡ KOC', 'Unable to remove KOC'));
    } catch (error) { console.error('Failed to unassign affiliate:', error); }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await fetch('/api/admin/programs', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, isActive }),
      });
      await fetchPrograms();
    } catch (error) { console.error('Failed to toggle program:', error); }
  };

  const setDefault = async (id: string) => {
    try {
      await fetch('/api/admin/programs', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, isDefault: true }),
      });
      await fetchPrograms();
    } catch (error) { console.error('Failed to set default:', error); }
  };

  const deleteProgram = async (id: string) => {
    if (!confirm(tx('Xóa chương trình này? Thao tác không thể hoàn tác.', 'Delete this program? This action cannot be undone.'))) return;
    try {
      const res = await fetch(`/api/admin/programs?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) await fetchPrograms();
      else alert(data.error || tx('Không thể xóa chương trình', 'Unable to delete program'));
    } catch (error) { console.error('Failed to delete program:', error); }
  };

  const formatCurrency = (minorUnits: number, currency: string = 'VND') => formatMinorUnits(minorUnits, currency);
  const assignedAffiliateIds = new Set(assigningProgram?.affiliatePrograms?.map((assignment) => assignment.affiliateId) || []);
  const assignableAffiliates = affiliates.filter((affiliate) => !assignedAffiliateIds.has(affiliate.id));
  const stats = {
    total: programs.length,
    active: programs.filter(p => p.isActive).length,
    privateCount: programs.filter(p => p.visibility === 'PRIVATE').length,
    defaultProgram: programs.find(p => p.isDefault),
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{tx('Chương trình', 'Programs')}</h1>
          <p className="text-muted-foreground">{tx('Quản lý chương trình public và chương trình riêng được chỉ định cho KOC', 'Manage public programs and private programs assigned to KOC creators')}</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />{tx('Tạo chương trình', 'Create program')}</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">{tx('Tổng chương trình', 'Total programs')}</CardTitle><Layers className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">{tx('Đang hoạt động', 'Active')}</CardTitle><Globe className="h-4 w-4 text-green-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.active}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">{tx('Chương trình riêng', 'Private programs')}</CardTitle><Lock className="h-4 w-4 text-violet-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.privateCount}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">{tx('Mặc định', 'Default')}</CardTitle><Star className="h-4 w-4 text-amber-500" /></CardHeader><CardContent><div className="text-lg font-bold truncate">{stats.defaultProgram?.name || 'Chưa thiết lập'}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{tx('Tất cả chương trình', 'All programs')}</CardTitle>
          <CardDescription>{tx('Public: mọi KOC thấy. Riêng tư: chỉ KOC được gán thấy.', 'Public: visible to every KOC. Private: visible only to assigned KOC creators.')}</CardDescription>
        </CardHeader>
        <CardContent>
          {programs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center"><Layers className="h-12 w-12 text-muted-foreground/50" /><h3 className="mt-4 text-lg font-semibold">{tx('Chưa có chương trình', 'No programs yet')}</h3><p className="text-sm text-muted-foreground">{tx('Tạo chương trình đầu tiên', 'Create your first program')}</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tx('Chương trình', 'Program')}</TableHead><TableHead>{tx('Hiển thị', 'Visibility')}</TableHead><TableHead>{tx('Hoa hồng', 'Commission')}</TableHead><TableHead>Cookie</TableHead><TableHead>{tx('Thanh toán tối thiểu', 'Minimum payout')}</TableHead><TableHead>{tx('KOC được gán', 'Assigned KOC')}</TableHead><TableHead>{tx('Trạng thái', 'Status')}</TableHead><TableHead className="text-right">{tx('Thao tác', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programs.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {p.brandColor && <div className="h-3 w-3 rounded-full" style={{ backgroundColor: p.brandColor }} />}
                        <div><p className="font-medium">{p.name}</p></div>
                        {p.isDefault && <Badge variant="secondary" className="text-xs">{tx('Mặc định', 'Default')}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant={p.visibility === 'PRIVATE' ? 'outline' : 'secondary'} className="gap-1">{p.visibility === 'PRIVATE' ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}{visibilityLabel(p.visibility)}</Badge></TableCell>
                    <TableCell><div className="flex items-center gap-1"><Percent className="h-3 w-3 text-muted-foreground" /><span className="font-semibold">{p.commissionRate}%</span><span className="text-xs text-muted-foreground">{p.commissionType}</span></div></TableCell>
                    <TableCell><div className="flex items-center gap-1 text-sm"><Clock className="h-3 w-3 text-muted-foreground" />{p.cookieDuration}d</div></TableCell>
                    <TableCell>{formatCurrency(p.minPayoutCents, p.currency)}</TableCell>
                    <TableCell><Badge variant="outline" className="gap-1"><Users className="h-3 w-3" />{p._count?.affiliatePrograms || 0}</Badge></TableCell>
                    <TableCell><Switch checked={p.isActive} onCheckedChange={v => toggleActive(p.id, v)} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {!p.isDefault && <Button variant="ghost" size="sm" onClick={() => setDefault(p.id)}><Star className="h-3 w-3 mr-1" />{tx('Mặc định', 'Default')}</Button>}
                        <Button variant="ghost" size="icon" onClick={() => openAssign(p)}><UserPlus className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Edit className="h-4 w-4" /></Button>
                        {!p.isDefault && <Button variant="ghost" size="icon" onClick={() => deleteProgram(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
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
        <DialogContent className="max-h-[85vh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          <DialogHeader><DialogTitle>{editing ? tx('Sửa chương trình', 'Edit program') : tx('Tạo chương trình', 'Create program')}</DialogTitle><DialogDescription>{editing ? tx('Cập nhật cấu hình chương trình', 'Update program settings') : tx('Thiết lập chương trình tiếp thị liên kết mới', 'Set up a new affiliate program')}</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>{tx('Tên chương trình *', 'Program name *')}</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder={tx('Đối tác cao cấp', 'Premium partners')} /></div>
            <div className="grid gap-2"><Label>{tx('Mô tả', 'Description')}</Label><Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder={tx('Mô tả chương trình...', 'Program description...')} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid min-w-0 gap-2"><Label>{tx('Hiển thị', 'Visibility')}</Label><Select value={form.visibility} onValueChange={v => setForm({...form, visibility: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PUBLIC">Public - mọi KOC</SelectItem><SelectItem value="PRIVATE">Riêng tư - chỉ định</SelectItem></SelectContent></Select></div>
              <div className="grid min-w-0 gap-2"><Label>{tx('Tỷ lệ hoa hồng (%)', 'Commission rate (%)')}</Label><Input type="number" value={form.commissionRate} onChange={e => setForm({...form, commissionRate: e.target.value})} /></div>
              <div className="grid min-w-0 gap-2"><Label>{tx('Loại hoa hồng', 'Commission type')}</Label><Select value={form.commissionType} onValueChange={v => setForm({...form, commissionType: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PERCENTAGE">Phần trăm</SelectItem><SelectItem value="FIXED">Số tiền cố định</SelectItem><SelectItem value="TIERED">Theo cấp bậc</SelectItem></SelectContent></Select></div>
              <div className="grid min-w-0 gap-2"><Label>{tx('Cookie (ngày)', 'Cookie (days)')}</Label><Input type="number" value={form.cookieDuration} onChange={e => setForm({...form, cookieDuration: e.target.value})} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid min-w-0 gap-2"><Label>{tx('Tiền tệ', 'Currency')}</Label><Select value={form.currency} onValueChange={v => setForm({...form, currency: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="VND">VND (₫)</SelectItem><SelectItem value="INR">INR (₹)</SelectItem><SelectItem value="USD">USD ($)</SelectItem><SelectItem value="EUR">EUR (€)</SelectItem><SelectItem value="GBP">GBP (£)</SelectItem></SelectContent></Select></div>
              <div className="grid min-w-0 gap-2"><Label>{tx('Thanh toán tối thiểu', 'Minimum payout')}</Label><Input type="number" value={form.minPayoutCents} onChange={e => setForm({...form, minPayoutCents: e.target.value})} /></div>
              <div className="grid min-w-0 gap-2 sm:col-span-2"><Label>{tx('Tần suất thanh toán', 'Payout frequency')}</Label><Select value={form.payoutFrequency} onValueChange={v => setForm({...form, payoutFrequency: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="WEEKLY">Hàng tuần</SelectItem><SelectItem value="BIWEEKLY">Hai tuần một lần</SelectItem><SelectItem value="MONTHLY">Hàng tháng</SelectItem><SelectItem value="QUARTERLY">Hàng quý</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid gap-2"><Label>{tx('Màu thương hiệu', 'Brand color')}</Label><div className="flex gap-2"><Input type="color" value={form.brandColor} onChange={e => setForm({...form, brandColor: e.target.value})} className="w-14 h-10 p-1" /><Input value={form.brandColor} onChange={e => setForm({...form, brandColor: e.target.value})} className="flex-1 font-mono" /></div></div>
            <div className="grid gap-2">
              <Label>{tx('Ảnh banner chương trình', 'Program banner image')}</Label>
              <div className="overflow-hidden rounded-2xl border bg-muted/30">
                {form.bannerUrl ? (
                  <img src={form.bannerUrl} alt={tx('Banner chương trình', 'Program banner')} className="aspect-[16/9] w-full object-cover" />
                ) : (
                  <div className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ImageIcon className="h-8 w-8" />
                    <p className="text-sm">{tx('Chưa có ảnh banner', 'No banner image yet')}</p>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" disabled={uploadingBanner} onClick={() => document.getElementById('program-banner-upload')?.click()}>
                  <Upload className="mr-2 h-4 w-4" />{uploadingBanner ? tx('Đang upload...', 'Uploading...') : tx('Thêm ảnh banner', 'Add banner image')}
                </Button>
                {form.bannerUrl && <Button type="button" variant="ghost" onClick={() => setForm({...form, bannerUrl: ''})}>{tx('Gỡ ảnh', 'Remove image')}</Button>}
                <Input id="program-banner-upload" type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={e => handleBannerUpload(e.target.files?.[0])} />
              </div>
              <p className="text-xs text-muted-foreground">{tx('Khuyên dùng ảnh ngang 16:9, tối thiểu 1200×675px. Portal sẽ crop bằng object-cover để vừa khung và giữ ảnh nét.', 'Recommended: horizontal 16:9 image, at least 1200×675px. The portal will crop with object-cover to fit the frame and keep the image sharp.')}</p>
            </div>
            <div className="grid gap-2">
              <Label>{tx('Chi tiết chiến dịch / mô tả sản phẩm', 'Campaign details / product description')}</Label>
              <Textarea value={form.productDescription} onChange={e => setForm({...form, productDescription: e.target.value})} placeholder={tx('Mô tả sản phẩm/dịch vụ, điểm bán hàng, đối tượng khách hàng...', 'Describe the product/service, selling points, target customers...')} rows={4} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid min-w-0 gap-2"><Label>{tx('Giá dịch vụ', 'Service price')}</Label><Input value={form.servicePrice} onChange={e => setForm({...form, servicePrice: e.target.value})} placeholder="VD: 2.990.000đ / gói" /></div>
              <div className="grid min-w-0 gap-2"><Label>{tx('Hoa hồng dự tính', 'Estimated commission')}</Label><Input value={form.estimatedCommission} onChange={e => setForm({...form, estimatedCommission: e.target.value})} placeholder="VD: 20% ~ 598.000đ/đơn" /></div>
            </div>
            <div className="grid gap-3 rounded-2xl border p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label>{tx('Tài nguyên chiến dịch', 'Campaign resources')}</Label>
                  <p className="text-xs text-muted-foreground">{tx('Thêm link Drive/file/video/ảnh để KOC thấy ở mục Tài nguyên chương trình.', 'Add Drive/file/video/image links for KOC creators to see in Program resources.')}</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={openCreateAsset}>
                  <Plus className="mr-2 h-4 w-4" />{tx('Thêm tài nguyên', 'Add resource')}
                </Button>
              </div>
              {form.campaignAssets.length === 0 ? (
                <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">{tx('Chưa có tài nguyên chiến dịch.', 'No campaign resources yet.')}</div>
              ) : (
                <div className="space-y-2">
                  {form.campaignAssets.map((asset, index) => (
                    <div key={`${asset.url || asset.title}-${index}`} className="flex min-w-0 items-start justify-between gap-3 rounded-xl border bg-muted/20 p-3">
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{asset.title || `${tx('Tài nguyên', 'Resource')} ${index + 1}`}</p>
                          <Badge variant="secondary" className="uppercase">{asset.type || 'file'}</Badge>
                        </div>
                        {asset.url && <p className="mt-1 break-all text-xs text-muted-foreground">{asset.url}</p>}
                        {asset.note && <p className="mt-1 text-xs text-muted-foreground">{asset.note}</p>}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        {asset.url && <Button type="button" variant="ghost" size="icon" onClick={() => window.open(normalizeExternalUrl(asset.url), '_blank', 'noopener,noreferrer')}><ExternalLink className="h-4 w-4" /></Button>}
                        <Button type="button" variant="ghost" size="icon" onClick={() => openEditAsset(asset, index)}><Edit className="h-4 w-4" /></Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeAsset(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label>{tx('Gợi ý content triển khai', 'Content suggestions')}</Label>
              <Textarea value={form.contentSuggestionsText} onChange={e => setForm({...form, contentSuggestionsText: e.target.value})} placeholder={tx('Mẫu post Facebook\nHook: ...\nCTA: ...\n---\nKịch bản video ngắn\nMở đầu: ...', 'Facebook post template\nHook: ...\nCTA: ...\n---\nShort video script\nOpening: ...')} rows={6} />
              <p className="text-xs text-muted-foreground">{tx('Nhập text gợi ý content. Ngăn cách nhiều mẫu bằng một dòng chỉ có --- . Dòng đầu là tiêu đề.', 'Enter content suggestions. Separate templates with a line containing only --- . The first line is the title.')}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid min-w-0 gap-2"><Label>Link support</Label><Input value={form.supportUrl} onChange={e => setForm({...form, supportUrl: e.target.value})} placeholder="https://zalo.me/..." /></div>
              <div className="grid min-w-0 gap-2"><Label>{tx('Nhãn support', 'Support label')}</Label><Input value={form.supportLabel} onChange={e => setForm({...form, supportLabel: e.target.value})} placeholder="Liên hệ Zalo support" /></div>
            </div>
            <div className="grid gap-2"><Label>{tx('URL điều khoản', 'Terms URL')}</Label><Input value={form.termsUrl} onChange={e => setForm({...form, termsUrl: e.target.value})} placeholder="https://yoursite.com/terms" /></div>
            <div className="flex items-center gap-2"><Switch checked={form.autoApprove as boolean} onCheckedChange={v => setForm({...form, autoApprove: v})} /><Label>{tx('Tự động duyệt KOL/KOC mới', 'Auto-approve new KOL/KOC creators')}</Label></div>
          </div>
          <DialogFooter className="sticky bottom-0 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6"><Button variant="outline" onClick={() => setDialogOpen(false)}>{tx('Hủy', 'Cancel')}</Button><Button onClick={handleSave} disabled={saving || !form.name}>{saving ? 'Saving...' : editing ? 'Cập nhật chương trình' : 'Tạo chương trình'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assetDialogOpen} onOpenChange={setAssetDialogOpen}>
        <DialogContent className="max-h-[85vh] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>{editingAssetIndex === null ? tx('Thêm tài nguyên chiến dịch', 'Add campaign resource') : tx('Sửa tài nguyên chiến dịch', 'Edit campaign resource')}</DialogTitle>
            <DialogDescription>{tx('Nhập tài nguyên để KOC xem ở mục Tài nguyên chương trình.', 'Enter a resource for KOC creators to view in Program resources.')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{tx('Tiêu đề *', 'Title *')}</Label>
              <Input value={assetForm.title || ''} onChange={e => setAssetForm({...assetForm, title: e.target.value})} placeholder={tx('VD: Bộ ảnh campaign', 'E.g., Campaign image set')} />
            </div>
            <div className="grid gap-2">
              <Label>URL <span className="text-muted-foreground">({tx('không bắt buộc', 'optional')})</span></Label>
              <Input value={assetForm.url || ''} onChange={e => setAssetForm({...assetForm, url: e.target.value})} placeholder={tx('drive.google.com/drive/folders/... hoặc https://...', 'drive.google.com/drive/folders/... or https://...')} />
              <p className="text-xs text-muted-foreground">{tx('Nếu nhập thiếu https://, hệ thống sẽ tự thêm giúp bạn.', 'If https:// is missing, the system will add it automatically.')}</p>
            </div>
            <div className="grid gap-2">
              <Label>Note</Label>
              <Textarea value={assetForm.note || ''} onChange={e => setAssetForm({...assetForm, note: e.target.value})} placeholder={tx('Ghi chú ngắn cho KOC...', 'Short note for KOC...')} rows={3} />
            </div>
            <div className="grid gap-2">
              <Label>{tx('Loại tài nguyên', 'Resource type')}</Label>
              <Select value={assetForm.type || 'file'} onValueChange={v => setAssetForm({...assetForm, type: v as CampaignAsset['type']})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="drive">Link Drive</SelectItem>
                  <SelectItem value="file">{tx('File/Tài liệu', 'File/Document')}</SelectItem>
                  <SelectItem value="image">{tx('Ảnh', 'Image')}</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssetDialogOpen(false)}>{tx('Hủy', 'Cancel')}</Button>
            <Button onClick={saveAsset}>{editingAssetIndex === null ? tx('Thêm tài nguyên', 'Add resource') : tx('Lưu thay đổi', 'Save changes')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{tx('Gán KOC vào chương trình', 'Assign KOC to program')}</DialogTitle><DialogDescription>{assigningProgram?.name} — {tx('KOC được gán sẽ thấy chương trình riêng tư trong portal.', 'Assigned KOC creators will see the private program in the portal.')}</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2"><Label>{tx('Chọn KOC', 'Choose KOC')}</Label><Select value={selectedAffiliateId} onValueChange={setSelectedAffiliateId}><SelectTrigger><SelectValue placeholder={tx('Chọn KOC/affiliate', 'Choose KOC/affiliate')} /></SelectTrigger><SelectContent>{assignableAffiliates.map((affiliate) => <SelectItem key={affiliate.id} value={affiliate.id}>{affiliate.user.name} — {affiliate.user.email}</SelectItem>)}</SelectContent></Select></div>
            <Button onClick={handleAssign} disabled={assigning || !selectedAffiliateId} className="w-full"><UserPlus className="mr-2 h-4 w-4" />{assigning ? tx('Đang gán...', 'Assigning...') : tx('Gán vào chương trình', 'Assign to program')}</Button>
            <div className="rounded-lg border">
              <div className="border-b px-3 py-2 text-sm font-medium">{tx('Đã gán', 'Assigned')}</div>
              <div className="max-h-64 overflow-y-auto divide-y">
                {(assigningProgram?.affiliatePrograms || []).length === 0 ? <p className="p-3 text-sm text-muted-foreground">{tx('Chưa gán KOC nào.', 'No KOC assigned yet.')}</p> : assigningProgram?.affiliatePrograms?.map((assignment) => <div key={assignment.id} className="flex items-center justify-between gap-3 p-3"><div><p className="text-sm font-medium">{assignment.affiliate.user.name}</p><p className="text-xs text-muted-foreground">{assignment.affiliate.user.email}</p></div><Button variant="ghost" size="sm" onClick={() => handleUnassign(assigningProgram.id, assignment.affiliateId)}>Gỡ</Button></div>)}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
