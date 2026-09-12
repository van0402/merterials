import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface SupplierCardProps {
  id: string;
  companyName: string;
  province: string;
  categoryNames: string[];
  materialsCount: number;
}

function initialsOf(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

export function SupplierCard({ id, companyName, province, categoryNames, materialsCount }: SupplierCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-xs font-black text-white">
            {initialsOf(companyName)}
          </div>
          <div>
            <CardTitle className="text-base">{companyName}</CardTitle>
            <p className="text-xs text-muted-foreground">{province}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {categoryNames.map((name) => (
            <Badge key={name} variant="outline">{name}</Badge>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-orange-100 pt-3 text-sm">
          <span className="text-muted-foreground">{materialsCount} sản phẩm</span>
          <Link href={`/suppliers/${id}`} className="font-bold text-orange-600 hover:underline">
            Xem hồ sơ →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}