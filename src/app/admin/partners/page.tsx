'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useI18n } from '@/components/i18n-provider';
import {
  Search,
  Plus,
  Mail,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  Download,
  Upload,
  Users,
  CheckCircle2,
  XCircle,
  Trash2,
  UserPlus,
  ArrowUpDown,
} from 'lucide-react';

interface Partner {
  id: string;
  userId: string;
  name: string;
  email: string;
  referralCode: string;
  status: string;
  createdAt: string;
  clicks: number;
  leads: number;
  customers: number;
  revenue: number;
  earnings: number;
  groupName?: string;
}

export default function PartnersPage() {
  const router = useRouter();
  const { tx } = useI18n();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [sortField, setSortField] = useState<keyof Partner>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [newPartner, setNewPartner] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    partnerGroup: 'Mặc định',
    country: 'N/A',
    payoutMethod: 'PayPal',
    paypalEmail: '',
    sendWelcomeEmail: true,
    trackingParameter: 'ref',
  });

  const [invitePartner, setInvitePartner] = useState({
    email: '',
    partnerGroup: 'Mặc định',
    inviteType: 'single',
  });

  useEffect(() => {
    fetchPartners();
  }, []);

  useEffect(() => {
    filterPartners();
  }, [partners, activeTab, searchQuery, sortField, sortDirection]);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/affiliates');
      const data = await response.json();

      if (data.success) {
        const formattedPartners = data.affiliates.map((aff: any) => ({
          id: aff.id,
          userId: aff.userId,
          name: aff.user.name,
          email: aff.user.email,
          referralCode: aff.referralCode,
          status: aff.user.status,
          createdAt: aff.createdAt,
          clicks: 0,
          leads: aff._count?.referrals || 0,
          customers: aff._count?.referrals || 0,
          revenue: 0,
          earnings: aff.balanceCents || 0,
          groupName: '',
        }));
        setPartners(formattedPartners);
        setCurrencySymbol(data.currencySymbol || '₹');
      }
    } catch (error) {
      console.error('Failed to fetch partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPartners = () => {
    let filtered = partners;

    if (activeTab === 'active') {
      filtered = filtered.filter((p: Partner) => p.status === 'ACTIVE');
    } else if (activeTab === 'pending') {
      filtered = filtered.filter((p: Partner) => p.status === 'PENDING');
    } else if (activeTab === 'invited') {
      filtered = filtered.filter((p: Partner) => p.status === 'INVITED');
    } else {
      filtered = filtered.filter((p: Partner) => !['ACTIVE', 'PENDING', 'INVITED'].includes(p.status));
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (p: Partner) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.referralCode.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    filtered.sort((a: Partner, b: Partner) => {
      const aValue = (a as any)[sortField];
      const bValue = (b as any)[sortField];
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });

    setFilteredPartners(filtered);
  };

  const handleSort = (field: keyof Partner) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${newPartner.firstName} ${newPartner.lastName}`.trim(),
          email: newPartner.email,
          company: newPartner.company,
          payoutMethod: newPartner.payoutMethod,
          paypalEmail: newPartner.paypalEmail || newPartner.email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(
          `Partner created successfully!\n\nName: ${data.affiliate.name}\nEmail: ${data.affiliate.email}\nReferral Code: ${data.affiliate.referralCode}\nPassword: ${data.password}\n\nPlease save and share this with the partner.`
        );
        setShowCreateModal(false);
        setNewPartner({
          firstName: '', lastName: '', email: '', company: '',
          partnerGroup: 'Mặc định', country: 'N/A', payoutMethod: 'PayPal',
          paypalEmail: '', sendWelcomeEmail: true, trackingParameter: 'ref',
        });
        fetchPartners();
      } else {
        alert(data.message || tx('Không thể tạo đối tác', 'Unable to create partner'));
      }
    } catch (error) {
      console.error('Failed to create partner:', error);
      alert('Không thể tạo đối tác');
    }
  };

  const handleSelectPartner = (partnerId: string) => {
    setSelectedPartners((prev: string[]) =>
      prev.includes(partnerId) ? prev.filter((id: string) => id !== partnerId) : [...prev, partnerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPartners.length === filteredPartners.length) {
      setSelectedPartners([]);
    } else {
      setSelectedPartners(filteredPartners.map((p: Partner) => p.id));
    }
  };

  const handleExportPartners = (exportType: 'all' | 'selected' = 'all') => {
    const partnersToExport =
      exportType === 'all'
        ? filteredPartners
        : filteredPartners.filter((p: Partner) => selectedPartners.includes(p.id));

    if (partnersToExport.length === 0) {
      alert('Không có đối tác để xuất');
      return;
    }

    const csv = [
      [tx('Tên', 'Name'), 'Email', tx('Mã giới thiệu', 'Referral code'), tx('Trạng thái', 'Status'), tx('Ngày đăng ký', 'Signup date'), tx('Lượt nhấp', 'Clicks'), tx('Khách hàng tiềm năng', 'Leads'), tx('Khách hàng', 'Customers'), tx('Doanh thu', 'Revenue'), tx('Thu nhập', 'Earnings')].join(','),
      ...partnersToExport.map((p: Partner) =>
        [
          `"${p.name}"`, p.email, p.referralCode, p.status,
          new Date(p.createdAt).toLocaleDateString(), p.clicks, p.leads,
          p.customers, (p.revenue / 100).toFixed(2), (p.earnings / 100).toFixed(2),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `partners-${exportType}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleBulkAction = async (action: string, status?: string) => {
    if (selectedPartners.length === 0) {
      alert(tx('Vui lòng chọn đối tác trước', 'Please select partners first'));
      return;
    }

    if (action === 'delete') {
      if (!confirm(`Delete ${selectedPartners.length} partner(s)? This cannot be undone.`)) return;
    } else {
      if (!confirm(`${action} ${selectedPartners.length} partner(s)?`)) return;
    }

    try {
      const response = await fetch('/api/admin/affiliates/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affiliateIds: selectedPartners,
          action: action === 'delete' ? 'delete' : 'changeStatus',
          status: status,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(tx('Thao tác thành công', 'Action completed successfully'));
        setSelectedPartners([]);
        fetchPartners();
      } else {
        alert(data.error || tx('Thao tác thất bại', 'Action failed'));
      }
    } catch (error) {
      console.error('Bulk action failed:', error);
      alert('Thao tác thất bại');
    }
  };

  const tabCounts = {
    active: partners.filter((p: Partner) => p.status === 'ACTIVE').length,
    pending: partners.filter((p: Partner) => p.status === 'PENDING').length,
    invited: partners.filter((p: Partner) => p.status === 'INVITED').length,
    other: partners.filter((p: Partner) => !['ACTIVE', 'PENDING', 'INVITED'].includes(p.status)).length,
  };

  const SortIcon = ({ field }: { field: keyof Partner }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
    return sortDirection === 'asc' ? (
      <ChevronUp className="ml-1 h-3 w-3" />
    ) : (
      <ChevronDown className="ml-1 h-3 w-3" />
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
        <Skeleton className="h-10 w-full" />
        <Card>
          <CardContent className="pt-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{tx('Đối tác', 'Partners')}</h2>
          <p className="text-muted-foreground">{tx('Quản lý đối tác KOL/KOC', 'Manage KOL/KOC partners')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowInviteModal(true)}>
            <Mail className="mr-2 h-4 w-4" />
            {tx('Mời', 'Invite')}
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {tx('Tạo đối tác', 'Create partner')}
          </Button>
        </div>
      </div>

      {/* Tabs + Search + Actions */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="active">{tx('Hoạt động', 'Active')} ({tabCounts.active})</TabsTrigger>
            <TabsTrigger value="pending">{tx('Đang chờ', 'Pending')} ({tabCounts.pending})</TabsTrigger>
            <TabsTrigger value="invited">{tx('Đã mời', 'Invited')} ({tabCounts.invited})</TabsTrigger>
            <TabsTrigger value="other">{tx('Khác', 'Other')} ({tabCounts.other})</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={tx('Tìm đối tác...', 'Search partners...')}
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            {selectedPartners.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {tx('Thao tác', 'Actions')} ({selectedPartners.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleBulkAction('approve', 'ACTIVE')}>
                    <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
                    {tx('Duyệt mục đã chọn', 'Approve selected')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction('reject', 'INACTIVE')}>
                    <XCircle className="mr-2 h-4 w-4 text-amber-600" />
                    {tx('Từ chối mục đã chọn', 'Reject selected')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleBulkAction('delete')} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    {tx('Xóa mục đã chọn', 'Delete selected')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExportPartners('all')}>
                  <Download className="mr-2 h-4 w-4" />
                  {tx('Xuất tất cả (CSV)', 'Export all (CSV)')}
                </DropdownMenuItem>
                {selectedPartners.length > 0 && (
                  <DropdownMenuItem onClick={() => handleExportPartners('selected')}>
                    <Download className="mr-2 h-4 w-4" />
                    {tx('Xuất mục đã chọn (CSV)', 'Export selected (CSV)')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Upload className="mr-2 h-4 w-4" />
                  {tx('Nhập đối tác từ CSV', 'Import partners from CSV')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Table Content (same for all tabs) */}
        <Card className="mt-4">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedPartners.length === filteredPartners.length && filteredPartners.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                    <div className="flex items-center">
                      {tx('Đối tác', 'Partner')} <SortIcon field="name" />
                    </div>
                  </TableHead>
                  <TableHead>{tx('Mã giới thiệu', 'Referral code')}</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('leads')}>
                    <div className="flex items-center">
                      {tx('Khách hàng tiềm năng', 'Leads')} <SortIcon field="leads" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('customers')}>
                    <div className="flex items-center">
                      {tx('Khách hàng', 'Customers')} <SortIcon field="customers" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer text-right" onClick={() => handleSort('revenue')}>
                    <div className="flex items-center justify-end">
                      {tx('Doanh thu', 'Revenue')} <SortIcon field="revenue" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer text-right" onClick={() => handleSort('earnings')}>
                    <div className="flex items-center justify-end">
                      {tx('Thu nhập', 'Earnings')} <SortIcon field="earnings" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('createdAt')}>
                    <div className="flex items-center">
                      {tx('Ngày đăng ký', 'Signup date')} <SortIcon field="createdAt" />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPartners.length > 0 ? (
                  filteredPartners.map((partner: Partner) => (
                    <TableRow
                      key={partner.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/admin/partners/${partner.id}`)}
                    >
                      <TableCell onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedPartners.includes(partner.id)}
                          onCheckedChange={() => handleSelectPartner(partner.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {partner.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{partner.name}</p>
                            <p className="text-xs text-muted-foreground">{partner.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{partner.referralCode}</code>
                      </TableCell>
                      <TableCell>{partner.leads}</TableCell>
                      <TableCell>{partner.customers}</TableCell>
                      <TableCell className="text-right font-medium">
                        {currencySymbol}{(partner.revenue / 100).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {currencySymbol}{(partner.earnings / 100).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(partner.createdAt).toLocaleDateString('vi-VN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Users className="h-10 w-10 text-muted-foreground/50 mb-3" />
                        <p className="text-sm font-medium text-muted-foreground">{tx('Không tìm thấy đối tác', 'No partners found')}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {searchQuery ? tx('Hãy thử từ khóa khác', 'Try another keyword') : tx('Tạo hoặc mời đối tác để bắt đầu', 'Create or invite partners to get started')}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Tabs>

      {/* Create Partner Dialog */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{tx('Tạo đối tác', 'Create partner')}</DialogTitle>
            <DialogDescription>{tx('Thêm KOL/KOC thủ công', 'Add a KOL/KOC manually')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreatePartner}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{tx('Tên', 'First name')}</Label>
                  <Input
                    id="firstName"
                    value={newPartner.firstName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPartner({ ...newPartner, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{tx('Họ', 'Last name')}</Label>
                  <Input
                    id="lastName"
                    value={newPartner.lastName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPartner({ ...newPartner, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newPartner.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPartner({ ...newPartner, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">{tx('Công ty (không bắt buộc)', 'Company (optional)')}</Label>
                <Input
                  id="company"
                  value={newPartner.company}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPartner({ ...newPartner, company: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{tx('Nhóm đối tác', 'Partner group')}</Label>
                  <Select
                    value={newPartner.partnerGroup}
                    onValueChange={(value: string) => setNewPartner({ ...newPartner, partnerGroup: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mặc định">{tx('Mặc định', 'Default')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{tx('Phương thức thanh toán', 'Payout method')}</Label>
                  <Select
                    value={newPartner.payoutMethod}
                    onValueChange={(value: string) => setNewPartner({ ...newPartner, payoutMethod: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PayPal">PayPal</SelectItem>
                      <SelectItem value="Wise">Wise</SelectItem>
                      <SelectItem value="Bank">Bank Transfer</SelectItem>
                      <SelectItem value="Crypto">Crypto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paypalEmail">PayPal Email (Optional)</Label>
                <Input
                  id="paypalEmail"
                  type="email"
                  value={newPartner.paypalEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPartner({ ...newPartner, paypalEmail: e.target.value })}
                  placeholder="defaults to partner email"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="sendWelcomeEmail"
                  checked={newPartner.sendWelcomeEmail}
                  onCheckedChange={(checked: boolean) => setNewPartner({ ...newPartner, sendWelcomeEmail: checked })}
                />
                <Label htmlFor="sendWelcomeEmail">{tx('Gửi email chào mừng', 'Send welcome email')}</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                {tx('Hủy', 'Cancel')}
              </Button>
              <Button type="submit">
                <UserPlus className="mr-2 h-4 w-4" />
                {tx('Tạo đối tác', 'Create partner')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invite Partner Dialog */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{tx('Mời đối tác', 'Invite partner')}</DialogTitle>
            <DialogDescription>{tx('Gửi lời mời email tới KOL/KOC mới', 'Send an email invitation to a new KOL/KOC')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">{tx('Địa chỉ email', 'Email address')}</Label>
              <Input
                id="inviteEmail"
                type="email"
                value={invitePartner.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInvitePartner({ ...invitePartner, email: e.target.value })}
                placeholder="partner@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{tx('Nhóm đối tác', 'Partner group')}</Label>
              <Select
                value={invitePartner.partnerGroup}
                onValueChange={(value: string) => setInvitePartner({ ...invitePartner, partnerGroup: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mặc định">{tx('Mặc định', 'Default')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowInviteModal(false)}>
              {tx('Hủy', 'Cancel')}
            </Button>
            <Button
              onClick={() => {
                alert(tx('Hệ thống sẽ gửi email mời tới đối tác.', 'The system will send an invitation email to the partner.'));
                setShowInviteModal(false);
              }}
            >
              <Mail className="mr-2 h-4 w-4" />
              {tx('Gửi lời mời', 'Send invitation')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
