'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  CheckCircle2,
  Download,
  Eye,
  FileSignature,
  Loader2,
  Printer,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { buildAffiliateContractPdfDefinition } from '@/lib/contract-template-renderer';
import { useI18n } from '@/components/i18n-provider';

type ContractStatus = 'DRAFT' | 'GENERATED' | 'APPROVED';

interface ContractDefaults {
  loginEmail: string;
  affiliateCode: string;
  creatorType: string;
  tier: string;
  referralRatePercent: number;
  cookieDurationDays: number;
  commissionHoldDays: number;
}

interface AdminContract {
  id: string;
  contractNumber: string;
  fullName: string;
  phone: string;
  contractEmail: string;
  address: string;
  position: string | null;
  citizenId: string;
  citizenIdIssuedAt: string;
  citizenIdIssuedBy: string;
  bankName: string;
  bankBranch: string | null;
  bankProvince: string | null;
  bankAccountNumber: string;
  bankAccountHolder: string;
  citizenIdFrontData: string;
  citizenIdBackData: string;
  signatureData: string;
  status: ContractStatus;
  generatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  defaults: ContractDefaults;
  affiliate: {
    id: string;
    referralCode: string;
    creatorType: string;
    tier: string;
    completedOrders: number;
    user: {
      id: string;
      name: string;
      email: string;
      status: string;
    };
  };
}

const statusConfig: Record<ContractStatus, { viLabel: string; enLabel: string; variant: 'default' | 'secondary' | 'outline' }> = {
  DRAFT: { viLabel: 'Bản nháp', enLabel: 'Draft', variant: 'secondary' },
  GENERATED: { viLabel: 'Chờ SMEE duyệt', enLabel: 'Pending SMEE approval', variant: 'outline' },
  APPROVED: { viLabel: 'Đã duyệt ký', enLabel: 'Approved for signing', variant: 'default' },
};

function displayDate(value: string | Date) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

async function getPdfMake() {
  const [pdfMakeModule, fontModule] = await Promise.all([
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts'),
  ]);
  const pdfMake = pdfMakeModule.default;
  pdfMake.addVirtualFileSystem(fontModule.default);
  return pdfMake;
}

function buildDefinition(contract: AdminContract) {
  return buildAffiliateContractPdfDefinition({
    contractNumber: contract.contractNumber,
    signedDate: displayDate(contract.generatedAt || contract.updatedAt || new Date()),
    fullName: contract.fullName,
    phone: contract.phone,
    loginEmail: contract.defaults.loginEmail,
    contractEmail: contract.contractEmail,
    affiliateCode: contract.defaults.affiliateCode,
    address: contract.address,
    position: contract.position,
    citizenId: contract.citizenId,
    citizenIdIssuedAt: displayDate(contract.citizenIdIssuedAt),
    citizenIdIssuedBy: contract.citizenIdIssuedBy,
    bankName: contract.bankName,
    bankBranch: contract.bankBranch,
    bankProvince: contract.bankProvince,
    bankAccountNumber: contract.bankAccountNumber,
    bankAccountHolder: contract.bankAccountHolder,
    signatureData: contract.signatureData,
    creatorType: contract.defaults.creatorType,
    tier: contract.defaults.tier,
    referralRatePercent: contract.defaults.referralRatePercent,
    cookieDurationDays: contract.defaults.cookieDurationDays,
    commissionHoldDays: contract.defaults.commissionHoldDays,
  });
}

function DetailItem({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-medium">{value || '—'}</p>
    </div>
  );
}

function ImagePreview({ label, src }: { label: string; src: string }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex h-44 items-center justify-center overflow-hidden rounded-lg border bg-muted/30">
        <img src={src} alt={label} className="h-full w-full object-contain p-2" />
      </div>
    </div>
  );
}

export default function AdminContractsPage() {
  const { language, tx } = useI18n();
  const [contracts, setContracts] = useState<AdminContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<AdminContract | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchContracts = async () => {
    try {
      const response = await fetch('/api/admin/contracts');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || tx('Không thể tải hợp đồng', 'Unable to load contracts'));
      setContracts(data.contracts || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tx('Không thể tải hợp đồng', 'Unable to load contracts'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchContracts();
  }, []);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return contracts.filter((contract) => {
      const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
      const haystack = [
        contract.contractNumber,
        contract.fullName,
        contract.contractEmail,
        contract.affiliate.user.email,
        contract.affiliate.referralCode,
      ].join(' ').toLowerCase();
      return matchesStatus && (!keyword || haystack.includes(keyword));
    });
  }, [contracts, search, statusFilter]);

  const stats = {
    total: contracts.length,
    waiting: contracts.filter((item) => item.status === 'GENERATED').length,
    approved: contracts.filter((item) => item.status === 'APPROVED').length,
    draft: contracts.filter((item) => item.status === 'DRAFT').length,
  };

  const approveContract = async (contract: AdminContract) => {
    setActionLoading(contract.id);
    try {
      const response = await fetch('/api/admin/contracts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: contract.id, action: 'approve' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || tx('Không thể duyệt hợp đồng', 'Unable to approve contract'));
      toast.success(tx('Đã duyệt hợp đồng KOL/KOC.', 'KOL/KOC contract approved.'));
      await fetchContracts();
      setSelected((current) => (current?.id === contract.id ? { ...current, status: 'APPROVED' } : current));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tx('Không thể duyệt hợp đồng', 'Unable to approve contract'));
    } finally {
      setActionLoading(null);
    }
  };

  const downloadContract = async (contract: AdminContract) => {
    const pdfMake = await getPdfMake();
    pdfMake.createPdf(buildDefinition(contract)).download(`hop-dong-${contract.contractNumber}.pdf`);
  };

  const printContract = async (contract: AdminContract) => {
    const pdfMake = await getPdfMake();
    pdfMake.createPdf(buildDefinition(contract)).print();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24" />)}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <FileSignature className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">{tx('Hợp đồng KOL/KOC', 'KOL/KOC Contracts')}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {tx('Quản lý hợp đồng được tạo từ tài khoản KOL/KOC, kiểm tra hồ sơ, duyệt ký, tải PDF hoặc in hợp đồng.', 'Manage contracts created from KOL/KOC accounts, review profiles, approve signing, download PDF, or print contracts.')}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{tx('Tổng hợp đồng', 'Total contracts')}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats.total}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{tx('Chờ duyệt', 'Pending approval')}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-amber-600">{stats.waiting}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{tx('Đã duyệt ký', 'Approved for signing')}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-emerald-600">{stats.approved}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{tx('Bản nháp', 'Draft')}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-muted-foreground">{stats.draft}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>{tx('Danh sách hợp đồng', 'Contract list')}</CardTitle>
              <CardDescription>{tx('Hợp đồng đồng bộ từ màn hình “Hợp đồng hợp tác” của KOL/KOC.', 'Contracts synced from the KOL/KOC Partnership Contract screen.')}</CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={tx('Tìm tên, email, mã...', 'Search name, email, code...')}
                  className="pl-8 sm:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="sm:w-44">
                  <SelectValue placeholder={tx('Trạng thái', 'Status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tx('Tất cả trạng thái', 'All statuses')}</SelectItem>
                  <SelectItem value="GENERATED">{tx('Chờ duyệt', 'Pending approval')}</SelectItem>
                  <SelectItem value="APPROVED">{tx('Đã duyệt ký', 'Approved for signing')}</SelectItem>
                  <SelectItem value="DRAFT">{tx('Bản nháp', 'Draft')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <FileSignature className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">{tx('Chưa có hợp đồng phù hợp', 'No matching contracts')}</h3>
              <p className="text-sm text-muted-foreground">{tx('Khi KOL/KOC tạo hợp đồng, hồ sơ sẽ xuất hiện tại đây.', 'When KOL/KOC creators generate contracts, their profiles will appear here.')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tx('Số hợp đồng', 'Contract no.')}</TableHead>
                  <TableHead>KOL/KOC</TableHead>
                  <TableHead>{tx('Liên hệ', 'Contact')}</TableHead>
                  <TableHead>{tx('Ngân hàng', 'Bank')}</TableHead>
                  <TableHead>{tx('Trạng thái', 'Status')}</TableHead>
                  <TableHead>{tx('Cập nhật', 'Updated')}</TableHead>
                  <TableHead className="text-right">{tx('Thao tác', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell>
                      <p className="font-mono text-sm font-medium">{contract.contractNumber}</p>
                      <p className="text-xs text-muted-foreground">{contract.affiliate.referralCode}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{contract.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {contract.affiliate.creatorType} · {contract.affiliate.tier}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{contract.contractEmail}</p>
                      <p className="text-xs text-muted-foreground">{contract.phone}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{contract.bankName}</p>
                      <p className="text-xs text-muted-foreground">{contract.bankAccountNumber}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig[contract.status].variant}>
                        {tx(statusConfig[contract.status].viLabel, statusConfig[contract.status].enLabel)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{displayDate(contract.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setSelected(contract)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => void downloadContract(contract)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => void printContract(contract)}>
                          <Printer className="h-4 w-4" />
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

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileSignature className="h-5 w-5" />
                  {selected.contractNumber}
                </DialogTitle>
                <DialogDescription>
                  {tx('Hồ sơ hợp đồng từ', 'Contract profile from')} {selected.affiliate.user.email}. {tx('Kiểm tra thông tin, ảnh xác minh và chữ ký trước khi duyệt.', 'Review information, verification images, and signature before approval.')}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={statusConfig[selected.status].variant}>{tx(statusConfig[selected.status].viLabel, statusConfig[selected.status].enLabel)}</Badge>
                  <Badge variant="outline">{selected.affiliate.creatorType}</Badge>
                  <Badge variant="outline">{selected.affiliate.tier}</Badge>
                  {selected.status === 'APPROVED' && (
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600">
                      <BadgeCheck className="h-4 w-4" />
                      {tx('SMEE đã duyệt ký', 'SMEE approved signing')}
                    </span>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <DetailItem label={tx('Họ tên', 'Full name')} value={selected.fullName} />
                  <DetailItem label={tx('Email nhận hợp đồng', 'Contract email')} value={selected.contractEmail} />
                  <DetailItem label={tx('Email đăng nhập', 'Login email')} value={selected.defaults.loginEmail} />
                  <DetailItem label={tx('Điện thoại', 'Phone')} value={selected.phone} />
                  <DetailItem label={tx('Mã KOL/KOC', 'KOL/KOC code')} value={selected.defaults.affiliateCode} />
                  <DetailItem label={tx('Tỷ lệ hoa hồng', 'Commission rate')} value={`${selected.defaults.referralRatePercent}%`} />
                  <DetailItem label="CCCD" value={selected.citizenId} />
                  <DetailItem label={tx('Ngày cấp CCCD', 'Citizen ID issue date')} value={displayDate(selected.citizenIdIssuedAt)} />
                  <DetailItem label={tx('Nơi cấp CCCD', 'Citizen ID issue place')} value={selected.citizenIdIssuedBy} />
                  <DetailItem label={tx('Địa chỉ', 'Address')} value={selected.address} />
                  <DetailItem label={tx('Chức danh', 'Position')} value={selected.position || tx('Không áp dụng', 'Not applicable')} />
                  <DetailItem label={tx('Ngày tạo PDF', 'PDF generated date')} value={selected.generatedAt ? displayDate(selected.generatedAt) : tx('Chưa tạo PDF', 'PDF not generated yet')} />
                </div>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{tx('Thông tin thanh toán', 'Payment information')}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-3">
                    <DetailItem label={tx('Ngân hàng', 'Bank')} value={selected.bankName} />
                    <DetailItem label={tx('Chi nhánh', 'Branch')} value={selected.bankBranch} />
                    <DetailItem label={tx('Tỉnh/Thành phố', 'Province/City')} value={selected.bankProvince} />
                    <DetailItem label={tx('Số tài khoản', 'Account number')} value={selected.bankAccountNumber} />
                    <DetailItem label={tx('Chủ tài khoản', 'Account holder')} value={selected.bankAccountHolder} />
                  </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-3">
                  <ImagePreview label="{tx('CCCD mặt trước', 'Citizen ID front')}" src={selected.citizenIdFrontData} />
                  <ImagePreview label="{tx('CCCD mặt sau', 'Citizen ID back')}" src={selected.citizenIdBackData} />
                  <ImagePreview label="{tx('Chữ ký tay', 'Handwritten signature')}" src={selected.signatureData} />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => void printContract(selected)}>
                  <Printer className="mr-2 h-4 w-4" />
                  {tx('In hợp đồng', 'Print contract')}
                </Button>
                <Button variant="outline" onClick={() => void downloadContract(selected)}>
                  <Download className="mr-2 h-4 w-4" />
                  {tx('Tải PDF', 'Download PDF')}
                </Button>
                <Button
                  onClick={() => void approveContract(selected)}
                  disabled={selected.status === 'DRAFT' || selected.status === 'APPROVED' || actionLoading === selected.id}
                >
                  {actionLoading === selected.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : selected.status === 'APPROVED' ? (
                    <ShieldCheck className="mr-2 h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  {selected.status === 'APPROVED' ? tx('Đã duyệt', 'Approved') : tx('Duyệt ký', 'Approve signing')}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
