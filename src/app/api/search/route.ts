import { NextRequest, NextResponse } from 'next/server';
import { searchMaterials, searchSuppliers } from '@/lib/search';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();
  const mode = searchParams.get('mode') === 'supplier' ? 'supplier' : 'product';
  const region = (searchParams.get('region') || '').trim();

  const results = mode === 'product' ? await searchMaterials(q, region) : await searchSuppliers(q, region);
  return NextResponse.json({ success: true, mode, results });
}