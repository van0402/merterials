'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/components/i18n-provider';

interface Seller {
  id: string;
  businessName: string;
  productSummary: string;
  status: string;
  platformFeeBps: number;
  affiliate: { user: { name: string; email: string } };
}

export default function AdminSellersPage() {
  const { t } = useI18n();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [fees, setFees] = useState<Record<string, number>>({});

  const load = () => fetch('/api/admin/sellers')
    .then((response) => response.json())
    .then((data) => data.success && setSellers(data.sellers));
  useEffect(() => { void load(); }, []);

  async function review(seller: Seller, status: 'APPROVED' | 'REJECTED' | 'SUSPENDED') {
    await fetch('/api/admin/sellers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: seller.id,
        status,
        platformFeeBps: fees[seller.id] ?? seller.platformFeeBps,
      }),
    });
    void load();
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">{t('adminSellersPage.title')}</h1>
        <p className="text-muted-foreground">{t('adminSellersPage.description')}</p>
      </div>
      <div className="grid gap-4">
        {sellers.map((seller) => (
          <Card key={seller.id}>
            <CardHeader><CardTitle className="flex items-center gap-2">{seller.businessName}<Badge>{seller.status}</Badge></CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p>{seller.affiliate.user.name} — {seller.affiliate.user.email}</p>
              <p className="text-sm text-muted-foreground">{seller.productSummary}</p>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  className="w-32"
                  type="number"
                  min={15}
                  max={20}
                  value={(fees[seller.id] ?? seller.platformFeeBps) / 100}
                  onChange={(event) => setFees({ ...fees, [seller.id]: Number(event.target.value) * 100 })}
                />
                <span>{t('adminSellersPage.feeSuffix')}</span>
                <Button onClick={() => review(seller, 'APPROVED')}>{t('adminSellersPage.approve')}</Button>
                <Button variant="outline" onClick={() => review(seller, 'REJECTED')}>{t('adminSellersPage.reject')}</Button>
                <Button variant="destructive" onClick={() => review(seller, 'SUSPENDED')}>{t('adminSellersPage.suspend')}</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

