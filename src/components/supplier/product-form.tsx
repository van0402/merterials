'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface InitialProduct {
  id: string;
  name: string;
  categoryId: string | null;
  description: string | null;
  unit: string | null;
  priceMinCents: number | null;
  priceMaxCents: number | null;
  images: string[];
  specifications: Record<string, string>;
  isActive: boolean;
}

interface ProductFormProps {
  allCategories: { id: string; name: string }[];
  initialProduct?: InitialProduct;
}

export function ProductForm({ allCategories, initialProduct }: ProductFormProps) {
  const router = useRouter();
  const isEditing = !!initialProduct;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initialProduct?.name ?? '');
  const [categoryId, setCategoryId] = useState(initialProduct?.categoryId ?? '');
  const [description, setDescription] = useState(initialProduct?.description ?? '');
  const [unit, setUnit] = useState(initialProduct?.unit ?? '');
  const [priceMin, setPriceMin] = useState(
    initialProduct?.priceMinCents != null ? String(initialProduct.priceMinCents) : '',
  );
  const [priceMax, setPriceMax] = useState(
    initialProduct?.priceMaxCents != null ? String(initialProduct.priceMaxCents) : '',
  );
  const [images, setImages] = useState<string[]>(initialProduct?.images ?? []);
  const [specRows, setSpecRows] = useState<{ key: string; value: string }[]>(
    initialProduct?.specifications
      ? Object.entries(initialProduct.specifications).map(([key, value]) => ({ key, value }))
      : [],
  );
  const [isActive, setIsActive] = useState(initialProduct?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  function addSpecRow() {
    setSpecRows((prev) => [...prev, { key: '', value: '' }]);
  }
  function removeSpecRow(index: number) {
    setSpecRows((prev) => prev.filter((_, i) => i !== index));
  }
  function updateSpecRow(index: number, field: 'key' | 'value', value: string) {
    setSpecRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (images.length >= 10) {
      toast.error('Tối đa 10 ảnh mỗi sản phẩm');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'material-images');
      const res = await fetch('/api/supplier/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Tải ảnh thất bại');
      setImages((prev) => [...prev, data.url]);
    } catch (err: any) {
      toast.error(err.message || 'Tải ảnh thất bại');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error('Tên sản phẩm là bắt buộc');
      return;
    }
    setSaving(true);
    try {
      const specifications = Object.fromEntries(
        specRows.filter((r) => r.key.trim()).map((r) => [r.key.trim(), r.value.trim()]),
      );
      const payload = {
        name: name.trim(),
        categoryId: categoryId || undefined,
        description: description.trim() || undefined,
        unit: unit.trim() || undefined,
        priceMinCents: priceMin ? Math.round(Number(priceMin)) : null,
        priceMaxCents: priceMax ? Math.round(Number(priceMax)) : null,
        currency: 'VND',
        images,
        specifications,
        isActive,
      };

      const url = isEditing ? `/api/supplier/products/${initialProduct.id}` : '/api/supplier/products';
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(isEditing ? 'Đã cập nhật sản phẩm' : 'Đã thêm sản phẩm mới');
        router.push('/supplier/dashboard/products');
        router.refresh();
      } else if (data.details?.length) {
        toast.error(data.details[0].message || 'Thông tin không hợp lệ');
      } else {
        toast.error(data.error || 'Lưu thất bại');
      }
    } catch {
      toast.error('Không thể kết nối máy chủ');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!initialProduct) return;
    if (!confirm(`Xoá sản phẩm "${initialProduct.name}"? Không thể hoàn tác.`)) return;
    const res = await fetch(`/api/supplier/products/${initialProduct.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      toast.success('Đã xoá sản phẩm');
      router.push('/supplier/dashboard/products');
      router.refresh();
    } else {
      toast.error(data.error || 'Xoá thất bại');
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight">
          {isEditing ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Điền thông tin sản phẩm để hiển thị trên trang công khai của công ty.
        </p>
      </div>

      <div className="space-y-4">
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-[15px] font-bold">Thông tin cơ bản</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Chỉ tên sản phẩm là bắt buộc.</p>
          <div className="mt-4 space-y-3.5">
            <div>
              <label className="mb-1.5 block text-[12px] font-bold">
                Tên sản phẩm <span className="text-red-500">*</span>
              </label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Hạt nhựa TPE chống trượt độ cứng 70A"
              />
            </div>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[12px] font-bold">Danh mục <span className="font-normal text-muted-foreground">(không bắt buộc)</span></label>
                <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="">-- Chưa chọn --</option>
                  {allCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-bold">Đơn vị tính <span className="font-normal text-muted-foreground">(không bắt buộc)</span></label>
                <input className="input" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="VD: kg, tấn, cái..." />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-bold">Mô tả <span className="font-normal text-muted-foreground">(không bắt buộc)</span></label>
              <textarea
                className="input min-h-[80px] resize-y"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Giới thiệu ngắn về sản phẩm..."
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-[15px] font-bold">Giá bán</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Để trống cả 2 ô nếu muốn hiện "Liên hệ báo giá".
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[12px] font-bold">Giá từ (VNĐ)</label>
              <input className="input" type="number" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} placeholder="VD: 450000" />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-bold">Giá đến (VNĐ) <span className="font-normal text-muted-foreground">(để trống nếu giá cố định)</span></label>
              <input className="input" type="number" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="VD: 520000" />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-[15px] font-bold">Ảnh sản phẩm</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Ảnh đầu tiên sẽ là ảnh đại diện.</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="mt-4 w-full rounded-2xl border-2 border-dashed p-6 text-center text-xs text-muted-foreground hover:border-orange-300"
          >
            {uploading ? 'Đang tải ảnh...' : '📷 Bấm để chọn ảnh (PNG, JPG, tối đa 10MB)'}
          </button>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleImageChange} />
          {images.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2.5">
              {images.map((url, i) => (
                <div key={url} className="relative h-[74px] w-[74px] overflow-hidden rounded-xl border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] shadow"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-[15px] font-bold">Thông số kỹ thuật</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Tự thêm các thông số quan trọng, không giới hạn số dòng.</p>
          <div className="mt-4 space-y-2">
            {specRows.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <input
                  className="input"
                  placeholder="Tên thông số"
                  value={row.key}
                  onChange={(e) => updateSpecRow(i, 'key', e.target.value)}
                />
                <input
                  className="input"
                  placeholder="Giá trị"
                  value={row.value}
                  onChange={(e) => updateSpecRow(i, 'value', e.target.value)}
                />
                <button type="button" onClick={() => removeSpecRow(i)} className="rounded-lg bg-red-50 px-3 text-red-600">✕</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addSpecRow} className="mt-3 text-xs font-bold text-orange-600">
            + Thêm thông số
          </button>
        </section>

        <section className="flex items-center justify-between rounded-2xl border bg-white p-6 shadow-sm">
          <div>
            <b className="text-[13px] font-bold">Hiển thị công khai</b>
            <p className="mt-0.5 text-xs text-muted-foreground">Tắt để tạm ẩn sản phẩm mà không cần xoá.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsActive((v) => !v)}
            className={`flex h-6 w-11 items-center rounded-full p-0.5 transition ${isActive ? 'bg-orange-500 justify-end' : 'bg-slate-300 justify-start'}`}
          >
            <span className="h-5 w-5 rounded-full bg-white" />
          </button>
        </section>

        <div className="flex items-center justify-between rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/supplier/dashboard/products')}>Huỷ</Button>
            {isEditing && (
              <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={handleDelete}>
                Xoá sản phẩm
              </Button>
            )}
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Đang lưu...' : isEditing ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
          </Button>
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