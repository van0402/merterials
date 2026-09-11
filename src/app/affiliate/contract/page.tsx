
'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Download,
  FileImage,
  FileSignature,
  Loader2,
  LockKeyhole,
  Save,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { SMEE_CONTRACT_COMPANY } from '@/lib/affiliate-contract';
import { buildAffiliateContractPdfDefinition } from '@/lib/contract-template-renderer';
import { useI18n } from '@/components/i18n-provider';

type ContractStatus = 'DRAFT' | 'GENERATED' | 'APPROVED';

interface ContractRecord {
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
}

interface ContractDefaults {
  fullName: string;
  phone: string;
  contractEmail: string;
  loginEmail: string;
  affiliateCode: string;
  creatorType: string;
  tier: string;
  referralRatePercent: number;
  cookieDurationDays: number;
  commissionHoldDays: number;
}

interface ContractForm {
  fullName: string;
  phone: string;
  contractEmail: string;
  address: string;
  position: string;
  citizenId: string;
  citizenIdIssuedAt: string;
  citizenIdIssuedBy: string;
  bankName: string;
  bankBranch: string;
  bankProvince: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  citizenIdFrontData: string;
  citizenIdBackData: string;
  signatureData: string;
}

const emptyForm: ContractForm = {
  fullName: '',
  phone: '',
  contractEmail: '',
  address: '',
  position: '',
  citizenId: '',
  citizenIdIssuedAt: '',
  citizenIdIssuedBy: '',
  bankName: '',
  bankBranch: '',
  bankProvince: '',
  bankAccountNumber: '',
  bankAccountHolder: '',
  citizenIdFrontData: '',
  citizenIdBackData: '',
  signatureData: '',
};

function dateInputValue(value: string) {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}

function displayDate(value: string | Date, locale: string) {
  return new Intl.DateTimeFormat(locale).format(new Date(value));
}

function ImageField({
  id,
  label,
  value,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint: string;
}) {
  const { t } = useI18n();
  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      toast.error(t('affiliateContractPage.errors.invalidImageType'));
      event.target.value = '';
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error(t('affiliateContractPage.errors.imageTooLarge'));
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label} <span className="text-destructive">*</span>
      </Label>
      <label
        htmlFor={id}
        className="group flex min-h-36 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted/30 transition hover:border-primary hover:bg-primary/5"
      >
        {value ? (
          <img src={value} alt={label} className="h-36 w-full object-contain p-2" />
        ) : (
          <span className="flex flex-col items-center gap-2 px-4 text-center text-sm text-muted-foreground">
            <span className="rounded-full bg-background p-3 shadow-sm">
              <Upload className="h-5 w-5 text-primary" />
            </span>
            {t('affiliateContractPage.imageField.upload')}
          </span>
        )}
      </label>
      <Input id={id} type="file" required={!value} accept="image/png,image/jpeg,image/webp" onChange={handleFile} className="hidden" />
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export default function AffiliateContractPage() {
  const { language, t } = useI18n();
  const locale = language === 'vi' ? 'vi-VN' : 'en-US';
  const [form, setForm] = useState<ContractForm>(emptyForm);
  const [defaults, setDefaults] = useState<ContractDefaults | null>(null);
  const [contract, setContract] = useState<ContractRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<'save' | 'generate' | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/affiliate/contract');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || t('affiliateContractPage.errors.loadContract'));
        const saved = data.contract as ContractRecord | null;
        const initial = data.defaults as ContractDefaults;
        setDefaults(initial);
        setContract(saved);
        setForm(saved ? {
          fullName: saved.fullName,
          phone: saved.phone,
          contractEmail: saved.contractEmail,
          address: saved.address,
          position: saved.position || '',
          citizenId: saved.citizenId,
          citizenIdIssuedAt: dateInputValue(saved.citizenIdIssuedAt),
          citizenIdIssuedBy: saved.citizenIdIssuedBy,
          bankName: saved.bankName,
          bankBranch: saved.bankBranch || '',
          bankProvince: saved.bankProvince || '',
          bankAccountNumber: saved.bankAccountNumber,
          bankAccountHolder: saved.bankAccountHolder,
          citizenIdFrontData: saved.citizenIdFrontData,
          citizenIdBackData: saved.citizenIdBackData,
          signatureData: saved.signatureData,
        } : {
          ...emptyForm,
          fullName: initial.fullName || '',
          phone: initial.phone || '',
          contractEmail: initial.contractEmail || '',
        });
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : t('affiliateContractPage.errors.loadContract'));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const updateField = (field: keyof ContractForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const saveContract = async (action: 'save' | 'generate') => {
    if (!defaults) return;
    setSaving(action);
    try {
      const response = await fetch('/api/affiliate/contract', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, action }),
      });
      const data = await response.json();
      if (!response.ok) {
        const detail = data.details?.[0]?.message;
        throw new Error(detail || data.error || t('affiliateContractPage.errors.saveContract'));
      }
      const saved = data.contract as ContractRecord;
      setContract(saved);
      toast.success(action === 'generate' ? t('affiliateContractPage.toast.generated') : t('affiliateContractPage.toast.draftSaved'));

      if (action === 'generate') {
        const [pdfMakeModule, fontModule] = await Promise.all([
          import('pdfmake/build/pdfmake'),
          import('pdfmake/build/vfs_fonts'),
        ]);
        const pdfMake = pdfMakeModule.default;
        pdfMake.addVirtualFileSystem(fontModule.default);
        const definition = buildAffiliateContractPdfDefinition({
          contractNumber: saved.contractNumber,
          signedDate: displayDate(saved.generatedAt || new Date(), locale),
          fullName: saved.fullName,
          phone: saved.phone,
          loginEmail: defaults.loginEmail,
          contractEmail: saved.contractEmail,
          affiliateCode: defaults.affiliateCode,
          address: saved.address,
          position: saved.position,
          citizenId: saved.citizenId,
          citizenIdIssuedAt: displayDate(saved.citizenIdIssuedAt, locale),
          citizenIdIssuedBy: saved.citizenIdIssuedBy,
          bankName: saved.bankName,
          bankBranch: saved.bankBranch,
          bankProvince: saved.bankProvince,
          bankAccountNumber: saved.bankAccountNumber,
          bankAccountHolder: saved.bankAccountHolder,
          signatureData: saved.signatureData,
          creatorType: defaults.creatorType,
          tier: defaults.tier,
          referralRatePercent: defaults.referralRatePercent,
          cookieDurationDays: defaults.cookieDurationDays,
          commissionHoldDays: defaults.commissionHoldDays,
        });
        pdfMake.createPdf(definition).download(`hop-dong-${saved.contractNumber}.pdf`);
        // gate ở affiliate/layout.tsx đá ngược về /affiliate/contract vì cache cũ.
        window.setTimeout(() => {
          window.location.href = '/affiliate/affiliate-program';
        }, 800);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('affiliateContractPage.errors.generic'));
    } finally {
      setSaving(null);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    void saveContract(submitter?.value === 'save' ? 'save' : 'generate');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-[620px] w-full" />
      </div>
    );
  }

  if (loadError || !defaults) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{loadError || t('affiliateContractPage.errors.noKolData')}</AlertDescription>
      </Alert>
    );
  }

  return (
    <form className="mx-auto max-w-6xl space-y-6" onSubmit={handleSubmit}>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <FileSignature className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">{t('affiliateContractPage.header.title')}</h1>
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground">
            {t('affiliateContractPage.header.description')}
          </p>
        </div>
        {contract && (
          <Badge variant={contract.status === 'DRAFT' ? 'secondary' : 'default'} className="w-fit">
            {contract.status === 'APPROVED'
              ? t('affiliateContractPage.status.approved')
              : contract.status === 'GENERATED'
                ? t('affiliateContractPage.status.generated')
                : t('affiliateContractPage.status.draft')}
          </Badge>
        )}
      </div>

      {contract?.generatedAt && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            {t('affiliateContractPage.generatedAlert.prefix')} <strong>{contract.contractNumber}</strong> {t('affiliateContractPage.generatedAlert.middle')} {displayDate(contract.generatedAt, locale)}.
            {t('affiliateContractPage.generatedAlert.suffix')}
          </AlertDescription>
        </Alert>
      )}

      <Card className="overflow-hidden border-primary/20">
        <div className="h-1 bg-primary" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5" />
            {t('affiliateContractPage.smeeInfo.title')}
          </CardTitle>
          <CardDescription>{t('affiliateContractPage.smeeInfo.description')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-x-8 gap-y-4 text-sm md:grid-cols-2">
          <div>
            <p className="text-muted-foreground">{t('affiliateContractPage.smeeInfo.internationalName')}</p>
            <p className="font-medium">{SMEE_CONTRACT_COMPANY.internationalName}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t('affiliateContractPage.smeeInfo.taxCode')}</p>
            <p className="font-medium">{SMEE_CONTRACT_COMPANY.taxCode}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t('affiliateContractPage.smeeInfo.taxAddress')}</p>
            <p className="font-medium">{SMEE_CONTRACT_COMPANY.taxAddress}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t('affiliateContractPage.smeeInfo.phone')}</p>
            <p className="font-medium">{SMEE_CONTRACT_COMPANY.phone}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('affiliateContractPage.signerInfo.title')}</CardTitle>
          <CardDescription>{t('affiliateContractPage.signerInfo.description')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="fullName">{t('affiliateContractPage.signerInfo.fullName')} <span className="text-destructive">*</span></Label>
            <Input id="fullName" required value={form.fullName} onChange={(e) => updateField('fullName', e.target.value)} placeholder={t('affiliateContractPage.signerInfo.fullNamePlaceholder')} />
            <p className="text-xs text-muted-foreground">{t('affiliateContractPage.signerInfo.fullNameHint')}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{t('affiliateContractPage.signerInfo.phone')} <span className="text-destructive">*</span></Label>
            <Input id="phone" required inputMode="tel" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder={t('affiliateContractPage.signerInfo.phonePlaceholder')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="loginEmail">{t('affiliateContractPage.signerInfo.loginEmail')}</Label>
            <Input id="loginEmail" readOnly value={defaults.loginEmail} className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contractEmail">{t('affiliateContractPage.signerInfo.contractEmail')} <span className="text-destructive">*</span></Label>
            <Input id="contractEmail" required type="email" value={form.contractEmail} onChange={(e) => updateField('contractEmail', e.target.value)} />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="address">{t('affiliateContractPage.signerInfo.address')} <span className="text-destructive">*</span></Label>
            <Input id="address" required value={form.address} onChange={(e) => updateField('address', e.target.value)} placeholder={t('affiliateContractPage.signerInfo.addressPlaceholder')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="position">{t('affiliateContractPage.signerInfo.position')}</Label>
            <Input id="position" value={form.position} onChange={(e) => updateField('position', e.target.value)} placeholder={t('affiliateContractPage.signerInfo.optionalPlaceholder')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="citizenId">{t('affiliateContractPage.signerInfo.citizenId')} <span className="text-destructive">*</span></Label>
            <Input id="citizenId" required inputMode="numeric" pattern="[0-9]{9,12}" value={form.citizenId} onChange={(e) => updateField('citizenId', e.target.value.replace(/\D/g, ''))} placeholder={t('affiliateContractPage.signerInfo.citizenIdPlaceholder')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="citizenIdIssuedAt">{t('affiliateContractPage.signerInfo.citizenIdIssuedAt')} <span className="text-destructive">*</span></Label>
            <Input id="citizenIdIssuedAt" required type="date" max={new Date().toISOString().slice(0, 10)} value={form.citizenIdIssuedAt} onChange={(e) => updateField('citizenIdIssuedAt', e.target.value)} />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="citizenIdIssuedBy">{t('affiliateContractPage.signerInfo.citizenIdIssuedBy')} <span className="text-destructive">*</span></Label>
            <Input id="citizenIdIssuedBy" required value={form.citizenIdIssuedBy} onChange={(e) => updateField('citizenIdIssuedBy', e.target.value)} placeholder={t('affiliateContractPage.signerInfo.citizenIdIssuedByPlaceholder')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="verification">{t('affiliateContractPage.signerInfo.verification')}</Label>
            <div id="verification" className="flex h-10 items-center gap-2 rounded-md border bg-muted px-3 text-sm">
              <LockKeyhole className="h-4 w-4 text-primary" />
              {t('affiliateContractPage.signerInfo.passwordLogin')}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileImage className="h-5 w-5" />
            {t('affiliateContractPage.verificationFiles.title')}
          </CardTitle>
          <CardDescription>{t('affiliateContractPage.verificationFiles.description')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          <ImageField id="citizen-front" label={t('affiliateContractPage.verificationFiles.citizenFront')} value={form.citizenIdFrontData} onChange={(value) => updateField('citizenIdFrontData', value)} hint={t('affiliateContractPage.verificationFiles.citizenFrontHint')} />
          <ImageField id="citizen-back" label={t('affiliateContractPage.verificationFiles.citizenBack')} value={form.citizenIdBackData} onChange={(value) => updateField('citizenIdBackData', value)} hint={t('affiliateContractPage.verificationFiles.citizenBackHint')} />
          <ImageField id="signature" label={t('affiliateContractPage.verificationFiles.signature')} value={form.signatureData} onChange={(value) => updateField('signatureData', value)} hint={t('affiliateContractPage.verificationFiles.signatureHint')} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('affiliateContractPage.paymentInfo.title')}</CardTitle>
          <CardDescription>{t('affiliateContractPage.paymentInfo.description')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="bankName">{t('affiliateContractPage.paymentInfo.bankName')} <span className="text-destructive">*</span></Label>
            <Input id="bankName" required value={form.bankName} onChange={(e) => updateField('bankName', e.target.value)} placeholder={t('affiliateContractPage.paymentInfo.bankNamePlaceholder')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankBranch">{t('affiliateContractPage.paymentInfo.bankBranch')}</Label>
            <Input id="bankBranch" value={form.bankBranch} onChange={(e) => updateField('bankBranch', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankProvince">{t('affiliateContractPage.paymentInfo.bankProvince')}</Label>
            <Input id="bankProvince" value={form.bankProvince} onChange={(e) => updateField('bankProvince', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankAccountNumber">{t('affiliateContractPage.paymentInfo.bankAccountNumber')} <span className="text-destructive">*</span></Label>
            <Input id="bankAccountNumber" required inputMode="numeric" value={form.bankAccountNumber} onChange={(e) => updateField('bankAccountNumber', e.target.value.replace(/\D/g, ''))} />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="bankAccountHolder">{t('affiliateContractPage.paymentInfo.bankAccountHolder')} <span className="text-destructive">*</span></Label>
            <Input id="bankAccountHolder" required value={form.bankAccountHolder} onChange={(e) => updateField('bankAccountHolder', e.target.value.toLocaleUpperCase('vi-VN'))} placeholder={t('affiliateContractPage.paymentInfo.bankAccountHolderPlaceholder')} />
            <p className="text-xs text-muted-foreground">{t('affiliateContractPage.paymentInfo.bankAccountHolderHint')}</p>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertDescription>
          {t('affiliateContractPage.consent')}
        </AlertDescription>
      </Alert>

      <div className="sticky bottom-4 flex flex-col justify-end gap-3 rounded-xl border bg-background/95 p-4 shadow-lg backdrop-blur sm:flex-row">
        <Button type="submit" name="contractAction" value="save" variant="outline" disabled={saving !== null}>
          {saving === 'save' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {t('affiliateContractPage.actions.saveDraft')}
        </Button>
        <Button type="submit" name="contractAction" value="generate" disabled={saving !== null}>
          {saving === 'generate' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          {t('affiliateContractPage.actions.generatePdf')}
        </Button>
      </div>
    </form>
  );
}
