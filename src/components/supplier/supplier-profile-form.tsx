'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { resolvePostSaveRedirect } from '@/lib/profile-redirect';

const BUSINESS_TYPES = [
  { value: 'MANUFACTURER', label: 'Nhà sản xuất', desc: 'Trực tiếp sản xuất' },
  { value: 'DISTRIBUTOR', label: 'Nhà phân phối', desc: 'Phân phối sản phẩm' },
  { value: 'IMPORTER', label: 'Nhà nhập khẩu', desc: 'Nhập khẩu và cung ứng' },
  { value: 'OEM_ODM', label: 'Đơn vị gia công', desc: 'OEM / ODM' },
  { value: 'SYSTEM_INTEGRATOR', label: 'Tích hợp hệ thống', desc: 'Automation, robot...' },
  { value: 'TECHNICAL_SERVICE', label: 'Dịch vụ kỹ thuật', desc: 'Tư vấn, bảo trì' },
];

const MAIN_MARKETS = [
  { value: 'NATIONWIDE', label: 'Toàn quốc' },
  { value: 'NORTH', label: 'Miền Bắc' },
  { value: 'CENTRAL', label: 'Miền Trung' },
  { value: 'SOUTH', label: 'Miền Nam' },
  { value: 'EXPORT', label: 'Xuất khẩu' },
];

const COMPANY_SIZES = [
  { value: 'UNDER_10', label: 'Dưới 10 người' },
  { value: 'FROM_10_TO_50', label: '10-50 người' },
  { value: 'FROM_51_TO_200', label: '51-200 người' },
  { value: 'FROM_201_TO_500', label: '201-500 người' },
  { value: 'OVER_500', label: 'Trên 500 người' },
];

const DOC_TYPE_LABELS: Record<string, string> = {
  BUSINESS_LICENSE: 'Giấy phép kinh doanh',
  QUALITY_CERT: 'Chứng nhận chất lượng',
  OTHER: 'Hồ sơ năng lực',
};

const DOC_STATUS: Record<string, { label: string; className: string }> = {
  APPROVED: { label: 'Đã duyệt', className: 'bg-emerald-50 text-emerald-700' },
  PENDING: { label: 'Chờ duyệt', className: 'bg-amber-50 text-amber-700' },
  REJECTED: { label: 'Bị từ chối', className: 'bg-red-50 text-red-700' },
};

interface ProfileData {
  id: string;
  companyName: string;
  tradingName: string | null;
  country: string;
  taxCode: string | null;
  foundedYear: number | null;
  businessType: string | null;
  contactName: string | null;
  contactEmail: string | null;
  phone: string;
  website: string | null;
  address: string | null;
  province: string | null;
  district: string | null;
  description: string | null;
  mainMarket: string | null;
  companySize: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  status: string;
  categoryIds: string[];
  capabilityIds: string[];
  documents: { id: string; type: string; fileUrl: string; status: string }[];
}

interface SupplierProfileFormProps {
  profile: ProfileData;
  allCategories: { id: string; name: string }[];
  allCapabilities: { id: string; name: string }[];
  apiEndpoint?: string;
  backHref?: string;
}

const SECTIONS = [
  { id: 'basic', label: 'Thông tin cơ bản' },
  { id: 'industry', label: 'Ngành nghề & năng lực' },
  { id: 'about', label: 'Giới thiệu' },
  { id: 'media', label: 'Hình ảnh' },
  { id: 'contact', label: 'Liên hệ' },
  { id: 'docs', label: 'Tài liệu' },
];

const FIELD_LABELS: Record<string, string> = {
  companyName: 'Tên công ty',
  tradingName: 'Tên giao dịch',
  country: 'Quốc gia',
  taxCode: 'Mã số thuế',
  foundedYear: 'Năm thành lập',
  businessType: 'Loại hình doanh nghiệp',
  contactName: 'Người liên hệ',
  phone: 'Số điện thoại',
  contactEmail: 'Email liên hệ',
  website: 'Website',
  address: 'Địa chỉ',
  province: 'Tỉnh/thành',
  district: 'Quận/huyện',
  description: 'Mô tả',
  mainMarket: 'Thị trường chính',
  companySize: 'Quy mô công ty',
  categoryIds: 'Ngành nghề',
  capabilityIds: 'Năng lực',
};

export function SupplierProfileForm({ profile, allCategories, allCapabilities, apiEndpoint = '/api/supplier/profile', backHref }: SupplierProfileFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    companyName: profile.companyName,
    tradingName: profile.tradingName ?? '',
    country: profile.country,
    taxCode: profile.taxCode ?? '',
    foundedYear: profile.foundedYear ? String(profile.foundedYear) : '',
    businessType: profile.businessType ?? '',
    contactName: profile.contactName ?? '',
    contactEmail: profile.contactEmail ?? '',
    phone: profile.phone,
    website: profile.website ?? '',
    address: profile.address ?? '',
    province: profile.province ?? '',
    district: profile.district ?? '',
    description: profile.description ?? '',
    mainMarket: profile.mainMarket ?? '',
    companySize: profile.companySize ?? '',
    logoUrl: profile.logoUrl ?? '',
    coverImageUrl: profile.coverImageUrl ?? '',
  });
  const [categoryIds, setCategoryIds] = useState<string[]>(profile.categoryIds);
  const [capabilityIds, setCapabilityIds] = useState<string[]>(profile.capabilityIds);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const completion = useMemo(() => {
    const fields = [
      form.companyName,
      form.businessType,
      form.description,
      form.contactEmail || form.phone,
      form.province,
      form.address,
      form.foundedYear,
      form.companySize,
      form.mainMarket,
      form.logoUrl,
      categoryIds.length > 0 ? 'x' : '',
      capabilityIds.length > 0 ? 'x' : '',
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }, [form, categoryIds, capabilityIds]);

  function toggleCategory(id: string) {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }
  function toggleCapability(id: string) {
    setCapabilityIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  async function uploadFile(file: File, folder: 'supplier-logos' | 'supplier-covers') {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', folder);
    const res = await fetch('/api/supplier/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Tải ảnh thất bại');
    return data.url as string;
  }

  async function deleteOldFile(url: string) {
    try {
      await fetch('/api/supplier/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
    } catch {
      // Xoá file cũ thất bại thì bỏ qua, không chặn việc thay ảnh mới
    }
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const url = await uploadFile(file, 'supplier-logos');
      if (form.logoUrl) await deleteOldFile(form.logoUrl);
      setField('logoUrl', url);
      toast.success('Đã tải logo mới');
    } catch (err: any) {
      toast.error(err.message || 'Tải logo thất bại');
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const url = await uploadFile(file, 'supplier-covers');
      if (form.coverImageUrl) await deleteOldFile(form.coverImageUrl);
      setField('coverImageUrl', url);
      toast.success('Đã tải ảnh bìa mới');
    } catch (err: any) {
      toast.error(err.message || 'Tải ảnh bìa thất bại');
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleSave() {
    if (categoryIds.length === 0) {
      toast.error('Chọn ít nhất 1 ngành nghề');
      return;
    }
    setSaving(true);
    try {
            const res = await fetch(apiEndpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          foundedYear: form.foundedYear ? Number(form.foundedYear) : undefined,
          businessType: form.businessType || undefined,
          mainMarket: form.mainMarket || undefined,
          companySize: form.companySize || undefined,
          categoryIds,
          capabilityIds,
        }),
      });
            const data = await res.json();
      if (data.success) {
        toast.success('Đã lưu thay đổi');
        const redirectUrl = resolvePostSaveRedirect(backHref);
        router.push(redirectUrl);
      } else if (data.details?.length) {
        const issue = data.details[0];
        const fieldName = issue.path?.[0];
        const fieldLabel = FIELD_LABELS[fieldName] || fieldName || 'Dữ liệu';
        toast.error(`${fieldLabel}: ${issue.message}`);
      } else {
        toast.error(data.error || 'Lưu thất bại');
      }
    } catch {
      toast.error('Không thể kết nối máy chủ');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b bg-white px-7">
        <div>
          <b className="block text-[15px] font-bold">Hồ sơ doanh nghiệp</b>
          <span className="block text-[11.5px] text-muted-foreground">Cập nhật thông tin hiển thị trên trang nhà cung cấp</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/suppliers/${profile.id}`} target="_blank">
            <Button variant="outline" size="sm">Xem trang công khai ↗</Button>
          </Link>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-6 px-6 py-7 lg:grid-cols-[200px_1fr]">
        <nav className="hidden h-max lg:block lg:sticky lg:top-[92px]">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="mb-0.5 block rounded-lg px-2.5 py-2 text-[12.5px] font-semibold text-muted-foreground hover:bg-white hover:text-foreground">
              {s.label}
            </a>
          ))}
          <div className="mt-3.5 rounded-xl border bg-white p-3">
            <b className="text-[12.5px] font-bold">Hồ sơ hoàn thiện {completion}%</b>
            <div className="mt-2 h-[5px] overflow-hidden rounded-full bg-slate-100">
              <span className="block h-full rounded-full bg-orange-500" style={{ width: `${completion}%` }} />
            </div>
            <p className="mt-2 text-[10.5px] leading-relaxed text-muted-foreground">
              Bổ sung các mục còn để trống để hồ sơ hiển thị đầy đủ hơn với người mua.
            </p>
          </div>
        </nav>

        <div className="min-w-0 space-y-4">
          <section id="basic" className="rounded-xl border bg-white">
            <div className="border-b p-4">
              <h2 className="text-[16px] font-bold">Thông tin cơ bản</h2>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">Thông tin pháp lý và nhận diện chính của doanh nghiệp.</p>
            </div>
            <div className="space-y-3.5 p-4">
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <Field label="Tên công ty" required>
                  <input className="input" value={form.companyName} onChange={(e) => setField('companyName', e.target.value)} />
                </Field>
                <Field label="Tên giao dịch" hint="không bắt buộc">
                  <input className="input" value={form.tradingName} onChange={(e) => setField('tradingName', e.target.value)} placeholder="Chưa có" />
                </Field>
              </div>

              <Field label="Loại hình doanh nghiệp">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {BUSINESS_TYPES.map((bt) => (
                    <button
                      type="button"
                      key={bt.value}
                      onClick={() => setField('businessType', bt.value)}
                      className={`rounded-lg border px-3 py-2.5 text-left text-[12.5px] ${
                        form.businessType === bt.value ? 'border-orange-400 bg-orange-50' : 'border-line'
                      }`}
                    >
                      <b className="block font-bold">{bt.label}</b>
                      <span className="block text-[10.5px] text-muted-foreground">{bt.desc}</span>
                    </button>
                  ))}
                </div>
              </Field>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                <Field label="Quốc gia">
                  <input className="input" value={form.country} onChange={(e) => setField('country', e.target.value)} />
                </Field>
                <Field label="Mã số thuế" hint="bắt buộc nếu ở VN">
                  <input className="input" value={form.taxCode} onChange={(e) => setField('taxCode', e.target.value)} placeholder="Chưa có" />
                </Field>
                <Field label="Năm thành lập" hint="không bắt buộc">
                  <input className="input" type="number" value={form.foundedYear} onChange={(e) => setField('foundedYear', e.target.value)} placeholder="VD: 2014" />
                </Field>
              </div>
            </div>
          </section>

          <section id="industry" className="rounded-xl border bg-white">
            <div className="border-b p-4">
              <h2 className="text-[16px] font-bold">Ngành nghề & năng lực</h2>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">Giúp người mua tìm đúng công ty theo nhu cầu.</p>
            </div>
            <div className="space-y-3.5 p-4">
              <Field label="Ngành nghề" required>
                <div className="flex flex-wrap gap-2">
                  {allCategories.map((c) => (
                    <Chip key={c.id} active={categoryIds.includes(c.id)} onClick={() => toggleCategory(c.id)}>
                      {c.name}
                    </Chip>
                  ))}
                  {allCategories.length === 0 && <span className="text-[12.5px] text-muted-foreground">Chưa có danh mục ngành nghề nào trong hệ thống.</span>}
                </div>
              </Field>

              <Field label="Năng lực" hint="không bắt buộc">
                <div className="flex flex-wrap gap-2">
                  {allCapabilities.map((c) => (
                    <Chip key={c.id} active={capabilityIds.includes(c.id)} onClick={() => toggleCapability(c.id)}>
                      {c.name}
                    </Chip>
                  ))}
                  {allCapabilities.length === 0 && <span className="text-[12.5px] text-muted-foreground">Chưa có năng lực nào trong hệ thống.</span>}
                </div>
              </Field>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <Field label="Thị trường chính" hint="không bắt buộc">
                  <select className="input" value={form.mainMarket} onChange={(e) => setField('mainMarket', e.target.value)}>
                    <option value="">-- Chưa chọn --</option>
                    {MAIN_MARKETS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Quy mô công ty" hint="không bắt buộc">
                  <select className="input" value={form.companySize} onChange={(e) => setField('companySize', e.target.value)}>
                    <option value="">-- Chưa chọn --</option>
                    {COMPANY_SIZES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>
          </section>

          <section id="about" className="rounded-xl border bg-white">
            <div className="border-b p-4">
              <h2 className="text-[16px] font-bold">Giới thiệu doanh nghiệp</h2>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">Nội dung hiển thị trên trang profile công khai.</p>
            </div>
            <div className="p-4">
              <Field label="Mô tả">
                <textarea
                  className="input min-h-[110px] resize-y"
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  placeholder="Giới thiệu ngắn về công ty, sản phẩm chính, thế mạnh..."
                />
                <div className="mt-1 text-right text-[11.5px] text-muted-foreground">{form.description.length} / 2000 ký tự</div>
              </Field>
            </div>
          </section>

          <section id="media" className="rounded-xl border bg-white">
            <div className="border-b p-4">
              <h2 className="text-[16px] font-bold">Hình ảnh doanh nghiệp</h2>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">Logo và ảnh bìa hiển thị ở đầu trang công khai.</p>
            </div>
            <div className="divide-y p-4 pt-0">
              <UploadRow
                label="Logo doanh nghiệp"
                value={form.logoUrl}
                uploading={uploadingLogo}
                onPick={() => logoInputRef.current?.click()}
              />
              <UploadRow
                label="Ảnh bìa hồ sơ"
                value={form.coverImageUrl}
                uploading={uploadingCover}
                onPick={() => coverInputRef.current?.click()}
              />
              <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleLogoChange} />
              <input ref={coverInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleCoverChange} />
            </div>
          </section>

          <section id="contact" className="rounded-xl border bg-white">
            <div className="border-b p-4">
              <h2 className="text-[16px] font-bold">Thông tin liên hệ</h2>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">Thông tin để người mua liên hệ trực tiếp.</p>
            </div>
            <div className="space-y-3.5 p-4">
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <Field label="Người liên hệ" hint="không bắt buộc">
                  <input className="input" value={form.contactName} onChange={(e) => setField('contactName', e.target.value)} placeholder="Chưa có" />
                </Field>
                <Field label="Email liên hệ">
                  <input className="input" type="email" value={form.contactEmail} onChange={(e) => setField('contactEmail', e.target.value)} placeholder="Chưa có" />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <Field label="Số điện thoại">
                  <input className="input" value={form.phone} onChange={(e) => setField('phone', e.target.value)} />
                </Field>
                <Field label="Website" hint="không bắt buộc">
                  <input className="input" value={form.website} onChange={(e) => setField('website', e.target.value)} placeholder="https://..." />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <Field label="Tỉnh / Thành phố">
                  <input className="input" value={form.province} onChange={(e) => setField('province', e.target.value)} placeholder="Chưa có" />
                </Field>
                <Field label="Quận / Huyện" hint="không bắt buộc">
                  <input className="input" value={form.district} onChange={(e) => setField('district', e.target.value)} placeholder="Chưa có" />
                </Field>
              </div>
              <Field label="Địa chỉ chi tiết" hint="không bắt buộc">
                <input className="input" value={form.address} onChange={(e) => setField('address', e.target.value)} placeholder="Chưa có" />
              </Field>
            </div>
          </section>

          <section id="docs" className="rounded-xl border bg-white">
            <div className="border-b p-4">
              <h2 className="text-[16px] font-bold">Tài liệu & xác minh</h2>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">Tài liệu đã tải lên lúc đăng ký và trạng thái duyệt.</p>
            </div>
            {profile.documents.length === 0 ? (
              <p className="p-4 text-[12.5px] text-muted-foreground">Chưa có tài liệu nào.</p>
            ) : (
              <table className="w-full border-collapse text-[12.5px]">
                <thead>
                  <tr className="bg-[#fafafa] text-left">
                    <th className="border-b p-3 text-[10.5px] font-bold uppercase text-muted-foreground">Loại tài liệu</th>
                    <th className="border-b p-3 text-[10.5px] font-bold uppercase text-muted-foreground">Trạng thái</th>
                    <th className="border-b p-3 text-[10.5px] font-bold uppercase text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {profile.documents.map((doc) => {
                    const st = DOC_STATUS[doc.status] ?? DOC_STATUS.PENDING;
                    return (
                      <tr key={doc.id}>
                        <td className="border-b p-3">{DOC_TYPE_LABELS[doc.type] ?? doc.type}</td>
                        <td className="border-b p-3">
                          <span className={`rounded-full px-2 py-1 text-[11.5px] font-bold ${st.className}`}>{st.label}</span>
                        </td>
                        <td className="border-b p-3 text-right">
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-orange-600">
                            Xem file →
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>

                              <div className="flex items-center justify-between rounded-xl border bg-white p-3 shadow-sm">
            <span className="text-[12.5px] text-muted-foreground">Nhớ bấm lưu sau khi chỉnh sửa.</span>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 9px;
          padding: 9px 11px;
          font-size: 13px;
          background: #fff;
          outline: none;
        }
        .input:focus {
          border-color: #f97316;
          box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.08);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12.5px] font-bold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
        {hint && <span className="font-normal text-muted-foreground"> ({hint})</span>}
      </label>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-2 text-[13px] font-bold ${
        active ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-line text-slate-600'
      }`}
    >
      {children}
    </button>
  );
}

function UploadRow({
  label,
  value,
  uploading,
  onPick,
}: {
  label: string;
  value: string;
  uploading: boolean;
  onPick: () => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex h-[54px] w-[74px] flex-none items-center justify-center overflow-hidden rounded-lg border bg-slate-50">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span className="text-[10.5px] text-muted-foreground">Chưa có</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <b className="block text-[12.5px] font-bold">{label}</b>
        <span className="block truncate text-[11.5px] text-muted-foreground">{value || 'Chưa tải lên'}</span>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onPick} disabled={uploading}>
        {uploading ? 'Đang tải...' : value ? 'Thay ảnh' : 'Tải lên'}
      </Button>
    </div>
  );
}
