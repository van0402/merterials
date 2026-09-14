'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Category {
  id: string;
  name: string;
}

export function SupplierApplyForm({
  categories,
  initialCompanyName,
}: {
  categories: Category[];
  initialCompanyName?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    companyName: initialCompanyName ?? '', taxCode: '', phone: '', contactEmail: '',
    address: '', province: '', district: '', description: '',
  });
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleCategory(id: string) {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/supplier/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, categoryIds }),
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
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="font-bold text-emerald-800">Đã gửi đăng ký thành công!</p>
        <p className="mt-1 text-sm text-emerald-700">Chờ admin xét duyệt, mày sẽ nhận thông báo khi có kết quả.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div>
        <Label>Tên công ty</Label>
        <Input required value={form.companyName} onChange={(e) => update('companyName', e.target.value)} />
      </div>
      <div>
        <Label>Mã số thuế</Label>
        <Input required value={form.taxCode} onChange={(e) => update('taxCode', e.target.value)} placeholder="10 hoặc 13 chữ số" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Số điện thoại</Label>
          <Input required value={form.phone} onChange={(e) => update('phone', e.target.value)} />
        </div>
        <div>
          <Label>Email liên hệ</Label>
          <Input required type="email" value={form.contactEmail} onChange={(e) => update('contactEmail', e.target.value)} />
        </div>
      </div>
      <div>
        <Label>Địa chỉ</Label>
        <Input required value={form.address} onChange={(e) => update('address', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Tỉnh/Thành phố</Label>
          <Input required value={form.province} onChange={(e) => update('province', e.target.value)} />
        </div>
        <div>
          <Label>Quận/Huyện (tuỳ chọn)</Label>
          <Input value={form.district} onChange={(e) => update('district', e.target.value)} />
        </div>
      </div>
      <div>
        <Label>Mô tả ngắn về công ty (tuỳ chọn)</Label>
        <Textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={3} />
      </div>

      <div>
        <Label>Ngành nghề cung cấp</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggleCategory(cat.id)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
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

      <Button type="submit" disabled={loading || categoryIds.length === 0} className="w-full">
        {loading ? 'Đang gửi...' : 'Gửi đăng ký'}
      </Button>
    </form>
  );
}