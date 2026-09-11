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
import { Textarea } from '@/components/ui/textarea';
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
  Image, FileText, Video, Layers, Plus, Pencil, Trash2, Download, ExternalLink,
} from 'lucide-react';
import { useI18n } from '@/components/i18n-provider';

interface Resource {
  id: string;
  title: string;
  description?: string;
  type: string;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  category?: string;
  downloads: number;
  isActive: boolean;
  createdAt: string;
}

const typeIcons: Record<string, React.ElementType> = {
  BANNER: Image, LOGO: Image, SOCIAL_POST: Image,
  EMAIL_TEMPLATE: FileText, DOCUMENT: FileText,
  VIDEO: Video, OTHER: Layers,
};

export default function ResourcesPage() {
  const { t } = useI18n();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', type: 'BANNER', fileUrl: '', fileName: '', fileSize: '', category: '',
  });

  useEffect(() => { fetchResources(); }, []);

  const fetchResources = async () => {
    try {
      const res = await fetch('/api/admin/resources');
      const data = await res.json();
      if (data.success) setResources(data.resources || []);
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = {
        ...form,
        fileSize: form.fileSize ? parseInt(form.fileSize) : null,
        ...(editing ? { id: editing.id } : {}),
      };
      const res = await fetch('/api/admin/resources', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await fetchResources();
        closeDialog();
      }
    } catch (error) {
      console.error('Failed to save resource:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await fetch('/api/admin/resources', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !isActive }),
      });
      setResources(prev => prev.map(r => r.id === id ? { ...r, isActive: !isActive } : r));
    } catch (error) {
      console.error('Failed to toggle:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('adminResourcesPage.confirmDelete'))) return;
    try {
      await fetch('/api/admin/resources', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setResources(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const openEdit = (r: Resource) => {
    setEditing(r);
    setForm({
      title: r.title, description: r.description || '', type: r.type,
      fileUrl: r.fileUrl, fileName: r.fileName,
      fileSize: r.fileSize ? String(r.fileSize) : '', category: r.category || '',
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm({ title: '', description: '', type: 'BANNER', fileUrl: '', fileName: '', fileSize: '', category: '' });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('adminResourcesPage.title')}</h1>
          <p className="text-muted-foreground">{t('adminResourcesPage.description')}</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm({ title: '', description: '', type: 'BANNER', fileUrl: '', fileName: '', fileSize: '', category: '' }); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          {t('adminResourcesPage.add')}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('adminResourcesPage.stats.total')}</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{resources.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('adminResourcesPage.stats.active')}</CardTitle>
            <Image className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{resources.filter(r => r.isActive).length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('adminResourcesPage.stats.downloads')}</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{resources.reduce((s, r) => s + r.downloads, 0)}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('adminResourcesPage.table.title')}</CardTitle>
          <CardDescription>{t('adminResourcesPage.table.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {resources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Layers className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">{t('adminResourcesPage.empty.title')}</h3>
              <p className="text-sm text-muted-foreground">{t('adminResourcesPage.empty.description')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('adminResourcesPage.table.name')}</TableHead>
                  <TableHead>{t('adminResourcesPage.table.type')}</TableHead>
                  <TableHead>{t('adminResourcesPage.table.downloads')}</TableHead>
                  <TableHead>{t('adminResourcesPage.stats.active')}</TableHead>
                  <TableHead className="text-right">{t('adminResourcesPage.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.map(r => {
                  const Icon = typeIcons[r.type] || Layers;
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{r.title}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{r.type}</Badge></TableCell>
                      <TableCell>{r.downloads}</TableCell>
                      <TableCell>
                        <Switch checked={r.isActive} onCheckedChange={() => handleToggle(r.id, r.isActive)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => window.open(r.fileUrl, '_blank')}>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? t('adminResourcesPage.dialog.editTitle') : t('adminResourcesPage.dialog.addTitle')}</DialogTitle>
            <DialogDescription>
              {editing ? t('adminResourcesPage.dialog.editDescription') : t('adminResourcesPage.dialog.addDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t('adminResourcesPage.dialog.title')}</Label>
              <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Banner 728x90" />
            </div>
            <div className="grid gap-2">
              <Label>{t('adminResourcesPage.dialog.description')}</Label>
              <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t('adminResourcesPage.dialog.category')}</Label>
                <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BANNER">Banner</SelectItem>
                    <SelectItem value="SOCIAL_POST">{t('adminResourcesPage.dialog.socialPost')}</SelectItem>
                    <SelectItem value="VIDEO">Video</SelectItem>
                    <SelectItem value="OTHER">{t('adminResourcesPage.dialog.other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{t('adminResourcesPage.dialog.link')}</Label>
                <Input value={form.fileUrl} onChange={e => setForm({...form, fileUrl: e.target.value})} placeholder="https://..." />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>{t('adminResourcesPage.dialog.cancel')}</Button>
            <Button onClick={handleSave} disabled={saving || !form.title || !form.fileUrl}>
              {saving ? t('adminResourcesPage.dialog.saving') : editing ? t('adminResourcesPage.dialog.update') : t('adminResourcesPage.dialog.add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
