'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BrandLogo } from '@/components/brand-logo';
import { Check, FileText } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface Capability {
  id: string;
  name: string;
}

const SIDEBAR_STEPS = [
  { n: 1, label: 'Tài khoản', desc: 'Thông tin người đăng ký' },
  { n: 2, label: 'Doanh nghiệp', desc: 'Thông tin pháp lý & liên hệ' },
  { n: 3, label: 'Ngành & năng lực', desc: 'Lĩnh vực và capability' },
  { n: 4, label: 'Xác minh', desc: 'Hồ sơ & gửi yêu cầu duyệt' },
];

const BUSINESS_TYPE_OPTIONS = [
  { value: 'MANUFACTURER', label: 'Nhà sản xuất', desc: 'Trực tiếp sản xuất' },
  { value: 'DISTRIBUTOR', label: 'Nhà phân phối', desc: 'Phân phối sản phẩm' },
  { value: 'IMPORTER', label: 'Nhà nhập khẩu', desc: 'Nhập khẩu và cung ứng' },
  { value: 'OEM_ODM', label: 'Đơn vị gia công', desc: 'OEM / ODM' },
  { value: 'SYSTEM_INTEGRATOR', label: 'Tích hợp hệ thống', desc: 'Automation, robot...' },
  { value: 'TECHNICAL_SERVICE', label: 'Dịch vụ kỹ thuật', desc: 'Tư vấn, triển khai, bảo trì' },
];

const MAIN_MARKET_OPTIONS = [
  { value: 'NATIONWIDE', label: 'Toàn quốc' },
  { value: 'NORTH', label: 'Miền Bắc' },
  { value: 'CENTRAL', label: 'Miền Trung' },
  { value: 'SOUTH', label: 'Miền Nam' },
  { value: 'EXPORT', label: 'Xuất khẩu' },
];

const COMPANY_SIZE_OPTIONS = [
  { value: 'UNDER_10', label: 'Dưới 10 người' },
  { value: 'FROM_10_TO_50', label: '10 - 50 người' },
  { value: 'FROM_51_TO_200', label: '51 - 200 người' },
  { value: 'FROM_201_TO_500', label: '201 - 500 người' },
  { value: 'OVER_500', label: 'Trên 500 người' },
];

export function SupplierApplyForm({
  categories,
  capabilities,
  initialCompanyName,
}: {
  categories: Category[];
  capabilities: Capability[];
  initialCompanyName?: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState<2 | 3 | 4>(2);
  const [form, setForm] = useState({
    companyName: initialCompanyName ?? '', tradingName: '', country: 'Việt Nam', taxCode: '', foundedYear: '',
    businessType: '', phone: '', contactEmail: '', website: '',
    address: '', province: '', district: '', description: '',
    mainMarket: '', companySize: '',
  });
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [capabilityIds, setCapabilityIds] = useState<string[]>([]);
  const [documents, setDocuments] = useState({
    businessLicense: '', otherProfile: '', qualityCert: '', logoUrl: '',
  });
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<Record<string, { url: string; isImage: boolean; name: string }>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleCategory(id: string) {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  function toggleCapability(id: string) {
    setCapabilityIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  function isVietnamCountry(country: string) {
    return ['việt nam', 'vietnam', 'vn'].includes(country.trim().toLowerCase());
  }

  function goToStep3() {
    if (!formRef.current?.reportValidity()) return;
    if (isVietnamCountry(form.country)) {
      if (!form.taxCode) {
        setError('Mã số thuế là bắt buộc với công ty Việt Nam');
        return;
      }
      if (!/^\d{10}(\d{3})?$/.test(form.taxCode)) {
        setError('Mã số thuế phải gồm 10 hoặc 13 chữ số');
        return;
      }
    }
    setError('');
    setStep(3);
  }

  function goToStep4() {
    if (categoryIds.length === 0) {
      setError('Chọn ít nhất 1 ngành nghề trước khi tiếp tục');
      return;
    }
    setError('');
    setStep(4);
  }

  async function handleFileUpload(field: keyof typeof documents, file: File, folder: string) {
    setFilePreview((prev) => ({
      ...prev,
      [field]: { url: URL.createObjectURL(file), isImage: file.type.startsWith('image/'), name: file.name },
    }));
    setUploadingField(field);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', folder);
      const res = await fetch('/api/supplier/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Tải file thất bại');
        return;
      }
      setDocuments((prev) => ({ ...prev, [field]: data.url }));
    } catch {
      setError('Không thể kết nối máy chủ khi tải file');
    } finally {
      setUploadingField(null);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/supplier/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          foundedYear: form.foundedYear ? Number(form.foundedYear) : undefined,
          businessType: form.businessType || undefined,
          mainMarket: form.mainMarket || undefined,
          companySize: form.companySize || undefined,
          categoryIds,
          capabilityIds,
          logoUrl: documents.logoUrl || undefined,
          documents: [
            documents.businessLicense && { type: 'BUSINESS_LICENSE', fileUrl: documents.businessLicense },
            documents.otherProfile && { type: 'OTHER', fileUrl: documents.otherProfile },
            documents.qualityCert && { type: 'QUALITY_CERT', fileUrl: documents.qualityCert },
          ].filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Có lỗi xảy ra');
        return;
      }
      setDone(true);
    } catch {
      setError('Không thể kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600">
          <Check className="h-9 w-9" />
        </div>
        <h2 className="mt-6 text-3xl font-black">Đã gửi đăng ký nhà cung cấp</h2>
        <p className="mt-3 leading-7 text-muted-foreground">
          Hồ sơ của bạn đang chờ admin xét duyệt. Bạn có thể bổ sung sản phẩm, chứng nhận và logo sau khi được duyệt, trong Supplier Dashboard.
        </p>
        <Button className="mt-6" onClick={() => router.push('/')}>Về trang chủ</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-[30px] border border-orange-100 bg-white shadow-2xl shadow-orange-950/5 lg:grid-cols-[320px_1fr]">
      {/* Sidebar */}
      <aside className="hidden flex-col bg-gradient-to-b from-orange-50 via-orange-50 to-amber-50 p-8 lg:flex">
        <div className="flex items-center gap-3">
          <BrandLogo className="h-11 w-11 rounded-2xl bg-white shadow" />
          <div>
            <p className="text-[15px] font-black leading-tight">Supply Merterial</p>
            <p className="text-[11px] text-slate-500">B2B Supplier Discovery Platform</p>
          </div>
        </div>

        <h2 className="mt-10 text-[26px] font-black leading-[1.1] tracking-[-0.03em]">
          Đăng ký<br />Nhà cung cấp
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Hoàn thiện hồ sơ cơ bản để đưa doanh nghiệp lên hệ thống và bắt đầu tiếp cận nhu cầu mua hàng.
        </p>

        <div className="mt-8 flex flex-col gap-2.5">
          {SIDEBAR_STEPS.map((item) => {
            const isDone = item.n < step;
            const isActive = item.n === step;
            return (
              <div
                key={item.n}
                className={`grid grid-cols-[38px_1fr] items-center gap-3 rounded-2xl p-2.5 ${
                  isActive ? 'border border-orange-200 bg-white/80' : ''
                }`}
              >
                <div
                  className={`flex h-[38px] w-[38px] items-center justify-center rounded-xl border text-sm font-black ${
                    isDone
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                      : isActive
                        ? 'border-orange-300 bg-orange-50 text-orange-600'
                        : 'border-orange-100/70 bg-white/60 text-slate-400'
                  }`}
                >
                  {isDone ? <Check className="h-4 w-4" /> : item.n}
                </div>
                <div>
                  <b className="block text-[13px]">{item.label}</b>
                  <span className="block text-[11px] text-slate-500">{item.desc}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl bg-white/70 p-4">
          <b className="block text-[13px]">Không cần hoàn thiện 100% ngay</b>
          <span className="mt-1.5 block text-xs leading-relaxed text-slate-500">
            Bạn có thể bổ sung logo, catalogue, chứng nhận và sản phẩm sau khi vào Supplier Dashboard.
          </span>
        </div>
      </aside>

      {/* Main */}
      <div className="p-6 sm:p-10">
        <div className="mb-6 h-[7px] overflow-hidden rounded-full bg-orange-50">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        <form ref={formRef} onSubmit={handleSubmit}>
          {error && <p className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          {step === 2 && (
            <>
              <p className="text-xs font-black uppercase tracking-wider text-orange-500">Bước 2 / 4</p>
              <h1 className="mt-2 text-[28px] font-black tracking-[-0.03em]">Thông tin doanh nghiệp</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Thông tin hiển thị trên trang hồ sơ doanh nghiệp và phục vụ quy trình xác minh.
              </p>

              <div className="mt-8 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Tên doanh nghiệp *</Label>
                    <Input required minLength={2} value={form.companyName} onChange={(e) => update('companyName', e.target.value)} placeholder="Công ty TNHH ABC" />
                  </div>
                  <div>
                    <Label>Tên tiếng Anh / giao dịch</Label>
                    <Input value={form.tradingName} onChange={(e) => update('tradingName', e.target.value)} placeholder="ABC Company Limited" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Quốc gia *</Label>
                    <Input
                      required
                      value={form.country}
                      onChange={(e) => update('country', e.target.value)}
                      placeholder="Việt Nam"
                    />
                  </div>
                  <div>
                    <Label>
                      Mã số thuế {isVietnamCountry(form.country) && <span className="text-orange-500">*</span>}
                    </Label>
                    <Input
                      value={form.taxCode}
                      onChange={(e) => update('taxCode', e.target.value.replace(/[\s-]/g, ''))}
                      placeholder={isVietnamCountry(form.country) ? '10 hoặc 13 chữ số' : 'Mã đăng ký kinh doanh (nếu có)'}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Năm thành lập</Label>
                    <Input type="number" value={form.foundedYear} onChange={(e) => update('foundedYear', e.target.value)} placeholder="2018" />
                  </div>
                </div>

                <div>
                  <Label>Loại hình doanh nghiệp *</Label>
                  <div className="mt-2 grid gap-3 sm:grid-cols-3">
                    {BUSINESS_TYPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => update('businessType', opt.value)}
                        className={`rounded-2xl border p-3.5 text-left transition ${
                          form.businessType === opt.value
                            ? 'border-orange-400 bg-orange-50 shadow-sm'
                            : 'border-border hover:border-orange-200'
                        }`}
                      >
                        <b className="block text-[13px]">{opt.label}</b>
                        <span className="mt-1 block text-[11px] text-muted-foreground">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                  <input type="hidden" required value={form.businessType} onChange={() => {}} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Email doanh nghiệp *</Label>
                    <Input required type="email" value={form.contactEmail} onChange={(e) => update('contactEmail', e.target.value)} placeholder="contact@company.com" />
                  </div>
                  <div>
                    <Label>Điện thoại doanh nghiệp *</Label>
                    <Input required minLength={8} value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="0222 xxx xxxx" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Website</Label>
                    <Input type="url" value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="https://company.com" />
                  </div>
                  <div>
                    <Label>Tỉnh / Thành phố *</Label>
                    <Input required minLength={2} value={form.province} onChange={(e) => update('province', e.target.value)} placeholder="Bắc Ninh" />
                  </div>
                </div>

                <div>
                  <Label>Địa chỉ doanh nghiệp *</Label>
                  <Input required minLength={5} value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Số nhà, đường, phường/xã, quận/huyện" />
                </div>
                <div>
                  <Label>Quận/Huyện (tuỳ chọn)</Label>
                  <Input value={form.district} onChange={(e) => update('district', e.target.value)} />
                </div>
                <div>
                  <Label>Giới thiệu ngắn *</Label>
                  <Textarea required rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Mô tả ngắn về doanh nghiệp, thế mạnh, thị trường và năng lực cung ứng..." />
                </div>
              </div>

              <div className="mt-9 flex items-center justify-between border-t pt-6">
                <span className="text-xs text-muted-foreground">Bước 2/4</span>
                <Button type="button" onClick={goToStep3}>Tiếp tục</Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <p className="text-xs font-black uppercase tracking-wider text-orange-500">Bước 3 / 4</p>
              <h1 className="mt-2 text-[28px] font-black tracking-[-0.03em]">Ngành nghề & năng lực</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Chọn đúng ngành và capability để khách hàng tìm thấy bạn chính xác hơn.
              </p>

              <div className="mt-8 space-y-6">
                <div>
                  <Label>Ngành nghề chính *</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={`rounded-full border px-3.5 py-2 text-sm font-medium ${
                          categoryIds.includes(cat.id)
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-200 text-gray-600'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Năng lực / Capability</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {capabilities.map((cap) => (
                      <button
                        key={cap.id}
                        type="button"
                        onClick={() => toggleCapability(cap.id)}
                        className={`rounded-full border px-3.5 py-2 text-sm font-medium ${
                          capabilityIds.includes(cap.id)
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-200 text-gray-600'
                        }`}
                      >
                        {cap.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Thị trường chính</Label>
                    <select
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={form.mainMarket}
                      onChange={(e) => update('mainMarket', e.target.value)}
                    >
                      <option value="">Toàn quốc</option>
                      {MAIN_MARKET_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Quy mô nhân sự</Label>
                    <select
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={form.companySize}
                      onChange={(e) => update('companySize', e.target.value)}
                    >
                      <option value="">Chọn quy mô</option>
                      {COMPANY_SIZE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-9 flex items-center justify-between border-t pt-6">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>Quay lại</Button>
                <Button type="button" onClick={goToStep4}>Tiếp tục</Button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <p className="text-xs font-black uppercase tracking-wider text-orange-500">Bước 4 / 4</p>
              <h1 className="mt-2 text-[28px] font-black tracking-[-0.03em]">Xác minh & hoàn tất</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Gửi hồ sơ để Admin kiểm tra và kích hoạt trạng thái nhà cung cấp.
              </p>
              <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-3.5 text-xs leading-relaxed text-orange-800">
                Bạn vẫn có thể gửi đăng ký ngay cả khi chưa có đầy đủ chứng nhận — bổ sung sau trong Supplier Dashboard.
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {([
  { field: 'businessLicense' as const, label: 'Giấy đăng ký kinh doanh', hint: 'PDF, JPG hoặc PNG', folder: 'supplier-documents' },
  { field: 'otherProfile' as const, label: 'Hồ sơ năng lực / Company Profile', hint: 'PDF, tối đa 10MB', folder: 'supplier-documents' },
  { field: 'qualityCert' as const, label: 'Chứng nhận (ISO, CE, RoHS...)', hint: 'PDF, JPG hoặc PNG', folder: 'supplier-documents' },
  { field: 'logoUrl' as const, label: 'Logo doanh nghiệp', hint: 'PNG / JPG nền sáng', folder: 'supplier-logos' },
]).map((item) => {
  const preview = filePreview[item.field];
  return (
    <div key={item.field} className="rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 p-5 text-center">
      {preview ? (
        preview.isImage ? (
          <img src={preview.url} alt={item.label} className="mx-auto h-20 w-20 rounded-lg border object-cover" />
        ) : (
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-lg border bg-white">
            <FileText className="h-8 w-8 text-orange-500" />
          </div>
        )
      ) : (
        <b className="block text-sm">{item.label}</b>
      )}

      <span className="mt-1.5 block truncate text-xs text-muted-foreground" title={preview?.name}>
        {preview ? preview.name : item.hint}
      </span>

      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        id={`upload-${item.field}`}
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFileUpload(item.field, e.target.files[0], item.folder)}
      />
      <label
        htmlFor={`upload-${item.field}`}
        className="mt-3 inline-block cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-gray-50"
      >
        {uploadingField === item.field
          ? 'Đang tải...'
          : documents[item.field]
            ? 'Đổi file khác'
            : 'Tải lên'}
      </label>

      {documents[item.field] && uploadingField !== item.field && (
        <a
          href={documents[item.field]}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block text-[11px] text-orange-600 underline"
        >
          Xem file đã tải lên
        </a>
      )}
    </div>
  );
})}
              </div>

              <div className="mt-9 flex items-center justify-between border-t pt-6">
                <Button type="button" variant="outline" onClick={() => setStep(3)}>Quay lại</Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Đang gửi...' : 'Gửi đăng ký'}
                </Button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}