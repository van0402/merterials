'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mail,
  Plus,
  Send,
  Eye,
  Pencil,
  Trash2,
  MailCheck,
  MailX,
  Code,
  Variable,
  TestTube,
} from 'lucide-react';
import { useI18n } from '@/components/i18n-provider';

interface EmailTemplate {
  id: string;
  type: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  isActive: boolean;
  sentCount: number;
  lastSent: string | null;
  createdAt: string;
}

const AVAILABLE_VARIABLES = [
  { name: 'name', viDesc: 'Tên người nhận', enDesc: 'Recipient name' },
  { name: 'email', viDesc: 'Email người nhận', enDesc: 'Recipient email' },
  { name: 'code', viDesc: 'Mã giới thiệu', enDesc: 'Referral code' },
  { name: 'amount', viDesc: 'Số tiền thanh toán', enDesc: 'Payout amount' },
  { name: 'referralCode', viDesc: 'Mã giới thiệu', enDesc: 'Referral code' },
  { name: 'companyName', viDesc: 'Tên công ty', enDesc: 'Company name' },
  { name: 'dashboardUrl', viDesc: 'Liên kết bảng điều khiển', enDesc: 'Dashboard link' },
  { name: 'reason', viDesc: 'Lý do duyệt hoặc từ chối', enDesc: 'Approval or rejection reason' },
];

const typeColors: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  WELCOME: 'default',
  OTP: 'secondary',
  APPROVAL: 'default',
  REJECTION: 'destructive',
  PAYOUT: 'outline',
  NOTIFICATION: 'secondary',
};

const emailTypeLabels: Record<string, { vi: string; en: string }> = {
  WELCOME: { vi: 'Chào mừng', en: 'Welcome' },
  OTP: { vi: 'OTP', en: 'OTP' },
  APPROVAL: { vi: 'Phê duyệt', en: 'Approval' },
  REJECTION: { vi: 'Từ chối', en: 'Rejection' },
  PAYOUT: { vi: 'Thanh toán', en: 'Payout' },
  NOTIFICATION: { vi: 'Thông báo', en: 'Notification' },
};

export default function EmailsPage() {
  const { language, tx } = useI18n();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [testEmailOpen, setTestEmailOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testTemplateId, setTestTemplateId] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [showSourceView, setShowSourceView] = useState(false);
  const [form, setForm] = useState({ type: '', name: '', subject: '', body: '', variables: '' });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/admin/emails');
      const data = await res.json();
      if (data.success) {
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await fetch('/api/admin/emails', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !isActive }),
      });
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isActive: !isActive } : t))
      );
    } catch (error) {
      console.error('Failed to toggle template:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(tx('Xóa mẫu email này?', 'Delete this email template?'))) return;
    try {
      await fetch('/api/admin/emails', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        variables: form.variables.split(',').map((v) => v.trim()).filter(Boolean),
        ...(editing ? { id: editing.id } : {}),
      };
      const res = await fetch('/api/admin/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await fetchTemplates();
        setDialogOpen(false);
        setEditing(null);
        setForm({ type: '', name: '', subject: '', body: '', variables: '' });
      }
    } catch (error) {
      console.error('Failed to save template:', error);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (t: EmailTemplate) => {
    setEditing(t);
    setForm({
      type: t.type,
      name: t.name,
      subject: t.subject,
      body: t.body,
      variables: t.variables.join(', '),
    });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ type: '', name: '', subject: '', body: '', variables: '' });
    setShowSourceView(false);
    setDialogOpen(true);
  };

  const insertVariable = (varName: string) => {
    const tag = `{{${varName}}}`;
    setForm(prev => ({ ...prev, body: prev.body + tag }));
    // Also add to variables list if not present
    const vars = prev_variables_from(form.variables);
    if (!vars.includes(varName)) {
      setForm(prev => ({ ...prev, variables: vars.concat(varName).join(', ') }));
    }
  };

  function prev_variables_from(v: string) {
    return v.split(',').map(s => s.trim()).filter(Boolean);
  }

  const openPreview = (t: EmailTemplate) => {
    setPreviewTemplate(t);
    setPreviewOpen(true);
  };

  const openTestSend = (id: string) => {
    setTestTemplateId(id);
    setTestEmail('');
    setTestEmailOpen(true);
  };

  const handleTestSend = async () => {
    if (!testEmail || !testTemplateId) return;
    setSendingTest(true);
    try {
      const res = await fetch('/api/admin/emails/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: testTemplateId, email: testEmail }),
      });
      const data = await res.json();
      if (data.success) {
        alert(tx('Đã gửi email thử!', 'Test email sent!'));
        setTestEmailOpen(false);
      } else {
        alert(data.error || tx('Không thể gửi email thử', 'Unable to send test email'));
      }
    } catch (error) {
      alert(tx('Không thể gửi email thử', 'Unable to send test email'));
    } finally {
      setSendingTest(false);
    }
  };

  const stats = {
    total: templates.length,
    active: templates.filter((t) => t.isActive).length,
    totalSent: templates.reduce((s, t) => s + t.sentCount, 0),
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Email</h1>
          <p className="text-muted-foreground">{tx('Quản lý mẫu email và thông báo', 'Manage email templates and notifications')}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {tx('Mẫu mới', 'New template')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? tx('Sửa mẫu', 'Edit template') : tx('Mẫu email mới', 'New email template')}</DialogTitle>
              <DialogDescription>
                {editing ? tx('Cập nhật nội dung mẫu email', 'Update email template content') : tx('Tạo mẫu email thông báo mới', 'Create a new notification email template')}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="type">{tx('Loại', 'Type')}</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder={tx('Chọn loại', 'Choose type')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WELCOME">{tx('Chào mừng', 'Welcome')}</SelectItem>
                    <SelectItem value="OTP">OTP</SelectItem>
                    <SelectItem value="APPROVAL">{tx('Phê duyệt', 'Approval')}</SelectItem>
                    <SelectItem value="REJECTION">{tx('Từ chối', 'Rejection')}</SelectItem>
                    <SelectItem value="PAYOUT">{tx('Thanh toán', 'Payout')}</SelectItem>
                    <SelectItem value="NOTIFICATION">{tx('Thông báo', 'Notification')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">{tx('Tên', 'Name')}</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={tx('VD: Email chào mừng', 'e.g., Welcome Email')}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="subject">{tx('Tiêu đề email', 'Email subject')}</Label>
                <Input
                  id="subject"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder={tx('Tiêu đề email', 'Email subject')}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="body">{tx('Nội dung', 'Content')}</Label>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowSourceView(!showSourceView)}>
                      {showSourceView ? <Eye className="h-3 w-3" /> : <Code className="h-3 w-3" />}
                      {showSourceView ? tx('Xem trước', 'Preview') : tx('Mã nguồn', 'Source')}
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-1">
                  <span className="text-xs text-muted-foreground mr-1 py-1">{tx('Chèn:', 'Insert:')}</span>
                  {AVAILABLE_VARIABLES.map(v => (
                    <Button
                      key={v.name}
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] px-2 font-mono"
                      onClick={() => insertVariable(v.name)}
                      title={tx(v.viDesc, v.enDesc)}
                    >
                      {'{{' + v.name + '}}'}
                    </Button>
                  ))}
                </div>
                {showSourceView ? (
                  <div className="border rounded-md p-3 text-sm max-h-48 overflow-auto bg-muted/50">
                    <div dangerouslySetInnerHTML={{ __html: form.body || `<p class="text-muted-foreground">${tx('Chưa có nội dung để xem trước', 'No content to preview')}</p>` }} />
                  </div>
                ) : (
                  <Textarea
                    id="body"
                    value={form.body}
                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                    placeholder={tx('Nội dung email (hỗ trợ HTML). Dùng {{variable}} cho nội dung động.', 'Email body (HTML supported). Use {{variable}} for dynamic content.')}
                    rows={8}
                    className="font-mono text-sm"
                  />
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="variables">{tx('Biến (phân cách bằng dấu phẩy)', 'Variables (comma-separated)')}</Label>
                <Input
                  id="variables"
                  value={form.variables}
                  onChange={(e) => setForm({ ...form, variables: e.target.value })}
                  placeholder={tx('VD: name, email, code', 'e.g., name, email, code')}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                {tx('Hủy', 'Cancel')}
              </Button>
              <Button onClick={handleSave} disabled={saving || !form.type || !form.name || !form.subject}>
                {saving ? tx('Đang lưu...', 'Saving...') : editing ? tx('Cập nhật', 'Update') : tx('Tạo', 'Create')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{tx('Tổng mẫu', 'Total templates')}</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{tx('Đang hoạt động', 'Active')}</CardTitle>
            <MailCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{tx('Tổng đã gửi', 'Total sent')}</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSent.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{tx('Mẫu email', 'Email templates')}</CardTitle>
          <CardDescription>{tx('Cấu hình thông báo email tự động', 'Configure automated email notifications')}</CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MailX className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">{tx('Chưa có mẫu email', 'No email templates yet')}</h3>
              <p className="text-sm text-muted-foreground">{tx('Tạo mẫu email đầu tiên', 'Create your first email template')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tx('Tên', 'Name')}</TableHead>
                  <TableHead>{tx('Loại', 'Type')}</TableHead>
                  <TableHead>{tx('Tiêu đề email', 'Email subject')}</TableHead>
                  <TableHead>{tx('Đã gửi', 'Sent')}</TableHead>
                  <TableHead>{tx('Lần gửi cuối', 'Last sent')}</TableHead>
                  <TableHead>{tx('Đang hoạt động', 'Active')}</TableHead>
                  <TableHead className="text-right">{tx('Thao tác', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>
                      <Badge variant={typeColors[t.type] || 'outline'}>
                        {emailTypeLabels[t.type] ? tx(emailTypeLabels[t.type].vi, emailTypeLabels[t.type].en) : t.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">{t.subject}</TableCell>
                    <TableCell className="text-sm">{t.sentCount}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {t.lastSent
                        ? new Date(t.lastSent).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
                            day: 'numeric',
                            month: 'short',
                          })
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Switch checked={t.isActive} onCheckedChange={() => handleToggle(t.id, t.isActive)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" title={tx('Xem trước', 'Preview')} onClick={() => openPreview(t)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title={tx('Gửi thử', 'Send test')} onClick={() => openTestSend(t.id)}>
                          <TestTube className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tx('Xem trước email', 'Email preview')}: {previewTemplate?.name}</DialogTitle>
            <DialogDescription>{tx('Tiêu đề', 'Subject')}: {previewTemplate?.subject}</DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-muted-foreground">{tx('Biến', 'Variables')}:</span>
                {previewTemplate.variables.map(v => (
                  <Badge key={v} variant="outline" className="text-xs font-mono">{'{{' + v + '}}'}</Badge>
                ))}
              </div>
              <div className="border rounded-lg p-4 bg-white">
                <div dangerouslySetInnerHTML={{ __html: previewTemplate.body }} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Test Send Dialog */}
      <Dialog open={testEmailOpen} onOpenChange={setTestEmailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tx('Gửi email thử', 'Send test email')}</DialogTitle>
            <DialogDescription>{tx('Gửi email thử để kiểm tra mẫu', 'Send a test email to verify the template')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{tx('Email người nhận', 'Recipient email')}</Label>
              <Input
                type="email"
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {tx('Các biến sẽ được thay bằng dữ liệu mẫu khi kiểm tra.', 'Variables will be replaced with sample data during testing.')}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestEmailOpen(false)}>{tx('Hủy', 'Cancel')}</Button>
            <Button onClick={handleTestSend} disabled={sendingTest || !testEmail}>
              <Send className="mr-2 h-4 w-4" />
              {sendingTest ? tx('Đang gửi...', 'Sending...') : tx('Gửi thử', 'Send test')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
