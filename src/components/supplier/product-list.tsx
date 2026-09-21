'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface ProductItem {
  id: string;
  name: string;
  categoryName: string | null;
  priceMinCents: number | null;
  priceMaxCents: number | null;
  currency: string;
  images: string[];
  isActive: boolean;
}

function formatPrice(minCents: number | null, maxCents: number | null, currency: string) {
  if (minCents == null && maxCents == null) return null;
  const fmt = (c: number) => (c / 100).toLocaleString('vi-VN') + (currency === 'VND' ? 'đ' : ` ${currency}`);
  if (minCents != null && maxCents != null && minCents !== maxCents) return `${fmt(minCents)} – ${fmt(maxCents)}`;
  return fmt((minCents ?? maxCents)!);
}

export function ProductList({ initialMaterials }: { initialMaterials: ProductItem[] }) {
  const [materials, setMaterials] = useState(initialMaterials);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Xoá sản phẩm "${name}"? Không thể hoàn tác.`)) return;
    const res = await fetch(`/api/supplier/products/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      setMaterials((prev) => prev.filter((m) => m.id !== id));
      toast.success('Đã xoá sản phẩm');
    } else {
      toast.error(data.error || 'Xoá thất bại');
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Sản phẩm của tôi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {materials.length > 0 ? `${materials.length} sản phẩm.` : 'Chưa có sản phẩm nào.'}
          </p>
        </div>
        <Link href="/supplier/dashboard/products/new">
          <Button>+ Thêm sản phẩm mới</Button>
        </Link>
      </div>

      {materials.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white p-14 text-center text-sm text-muted-foreground">
          Chưa có sản phẩm nào — bấm "Thêm sản phẩm mới" để bắt đầu.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {materials.map((m) => {
            const price = formatPrice(m.priceMinCents, m.priceMaxCents, m.currency);
            return (
              <div key={m.id} className="overflow-hidden rounded-2xl border bg-white">
                <div className="relative flex h-[110px] items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                  {m.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.images[0]} alt={m.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl opacity-40">📦</span>
                  )}
                  <span
                    className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                      m.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {m.isActive ? 'Đang hiển thị' : 'Tạm ẩn'}
                  </span>
                </div>
                <div className="p-3">
                  <div className="line-clamp-2 min-h-[32px] text-[12px] font-extrabold leading-tight">{m.name}</div>
                  {m.categoryName && (
                    <span className="mt-1.5 inline-block rounded-full bg-orange-50 px-2 py-0.5 text-[9.5px] font-bold text-orange-700">
                      {m.categoryName}
                    </span>
                  )}
                  <div className={`mt-1.5 text-[12px] font-black ${price ? '' : 'italic text-muted-foreground'}`}>
                    {price || 'Liên hệ báo giá'}
                  </div>
                  <div className="mt-2.5 flex gap-1.5">
                    <Link href={`/supplier/dashboard/products/${m.id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">Sửa</Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(m.id, m.name)}
                    >
                      Xoá
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}