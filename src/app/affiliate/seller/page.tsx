'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/components/i18n-provider';

interface Seller {
  id: string;
  businessName: string;
  contactName: string;
  contactPhone?: string;
  websiteUrl?: string;
  contactEmail: string;
  businessService: string;
  productSummary: string;
  description?: string;
  status: string;
  platformFeeBps: number;
  reviewNotes?: string;
  products: Array<{ id: string; sku: string; name: string; priceCents: number }>;
}

const normalizeExternalUrl = (url?: string) => {
  const value = (url || '').trim();
  if (!value) return '';
  if (/^(https?:\/\/|mailto:|tel:)/i.test(value)) return value;
  return `https://${value.replace(/^\/+/, '')}`;
};

export default function SellerPage() {
  const { t } = useI18n();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    businessName: '',
    contactName: '',
    contactPhone: '',
    websiteUrl: '',
    contactEmail: '',
    businessService: '',
    description: '',
  });
  const [product, setProduct] = useState({ sku: '', name: '', priceCents: '' });

  const load = () => fetch('/api/affiliate/seller')
    .then((response) => response.json())
    .then((data) => data.success && setSeller(data.seller));

  useEffect(() => { void load(); }, []);

  async function submitApplication(event: FormEvent) {
    event.preventDefault();
    const response = await fetch('/api/affiliate/seller', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, websiteUrl: normalizeExternalUrl(form.websiteUrl) || undefined }),
    });
    const data = await response.json();
    setMessage(response.ok ? t('affiliateSellerPage.messages.applicationSubmitted') : data.error);
    if (response.ok) void load();
  }

  async function addProduct(event: FormEvent) {
    event.preventDefault();
    const response = await fetch('/api/affiliate/seller/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...product, priceCents: Number(product.priceCents), currency: 'VND' }),
    });
    const data = await response.json();
    setMessage(response.ok ? t('affiliateSellerPage.messages.productAdded') : data.error);
    if (response.ok) {
      setProduct({ sku: '', name: '', priceCents: '' });
      void load();
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">{t('affiliateSellerPage.header.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('affiliateSellerPage.header.description')}</p>
      </div>
      {message && <p className="rounded-md bg-muted p-3 text-sm">{message}</p>}
      {seller && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2">{t('affiliateSellerPage.sellerStatus.title')} <Badge>{seller.status}</Badge></CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="font-semibold">{seller.businessName}</p>
            <p className="text-sm text-muted-foreground">{t('affiliateSellerPage.sellerStatus.contactPerson')} {seller.contactName || t('affiliateSellerPage.sellerStatus.notUpdated')}</p>
            <p className="text-sm text-muted-foreground">{t('affiliateSellerPage.sellerStatus.service')} {seller.businessService || seller.productSummary}</p>
            <p>{t('affiliateSellerPage.sellerStatus.currentFee')} {(seller.platformFeeBps / 100).toFixed(0)}%</p>
            {seller.reviewNotes && <p className="text-sm text-muted-foreground">{seller.reviewNotes}</p>}
          </CardContent>
        </Card>
      )}
      {(!seller || seller.status !== 'APPROVED') && (
        <Card>
          <CardHeader><CardTitle>{t('affiliateSellerPage.applicationForm.title')}</CardTitle></CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submitApplication}>
              <div>
                <Label>{t('affiliateSellerPage.applicationForm.brandName')}</Label>
                <Input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} required />
              </div>
              <div>
                <Label>{t('affiliateSellerPage.applicationForm.contactName')}</Label>
                <Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} required />
              </div>
              <div>
                <Label>{t('affiliateSellerPage.applicationForm.phone')}</Label>
                <Input type="tel" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} required />
              </div>
              <div>
                <Label>{t('affiliateSellerPage.applicationForm.website')} <span className="text-muted-foreground">({t('affiliateSellerPage.applicationForm.optional')})</span></Label>
                <Input type="text" value={form.websiteUrl} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} placeholder={t('affiliateSellerPage.applicationForm.websitePlaceholder')} />
                <p className="mt-1 text-xs text-muted-foreground">{t('affiliateSellerPage.applicationForm.websiteHint')}</p>
              </div>
              <div>
                <Label>{t('affiliateSellerPage.applicationForm.email')}</Label>
                <Input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} required />
              </div>
              <div>
                <Label>{t('affiliateSellerPage.applicationForm.businessService')}</Label>
                <Input value={form.businessService} onChange={(e) => setForm({ ...form, businessService: e.target.value })} required />
              </div>
              <div>
                <Label>{t('affiliateSellerPage.applicationForm.cooperationDescription')}</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
              </div>
              <Button type="submit">{t('affiliateSellerPage.applicationForm.submit')}</Button>
            </form>
          </CardContent>
        </Card>
      )}
      {seller?.status === 'APPROVED' && (
        <Card>
          <CardHeader><CardTitle>{t('affiliateSellerPage.products.title')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <form className="grid gap-3 md:grid-cols-4" onSubmit={addProduct}>
              <Input placeholder="SKU" value={product.sku} onChange={(e) => setProduct({ ...product, sku: e.target.value })} required />
              <Input placeholder={t('affiliateSellerPage.products.namePlaceholder')} value={product.name} onChange={(e) => setProduct({ ...product, name: e.target.value })} required />
              <Input type="number" placeholder={t('affiliateSellerPage.products.pricePlaceholder')} value={product.priceCents} onChange={(e) => setProduct({ ...product, priceCents: e.target.value })} required />
              <Button type="submit">{t('affiliateSellerPage.products.add')}</Button>
            </form>
            {seller.products.map((item) => <div key={item.id} className="rounded-md border p-3">{item.sku} — {item.name}</div>)}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
