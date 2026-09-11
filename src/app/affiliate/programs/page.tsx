'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/components/i18n-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Layers, Star, ExternalLink, Download, FileText, Image as ImageIcon, MessageSquare, Video, Headphones, Sparkles } from 'lucide-react';

interface CampaignAsset {
  type: 'video' | 'image' | 'file' | 'drive';
  title?: string | null;
  url?: string | null;
  note?: string | null;
}

interface ContentSuggestion {
  title?: string | null;
  body?: string | null;
  url?: string | null;
}

interface Program {
  id: string;
  name: string;
  slug: string;
  description?: string;
  commissionRate: number;
  commissionType: string;
  cookieDuration: number;
  currency: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  isDefault: boolean;
  autoApprove: boolean;
  minPayoutCents: number;
  payoutFrequency: string;
  termsUrl?: string;
  logoUrl?: string;
  bannerUrl?: string;
  brandColor?: string;
  productDescription?: string;
  servicePrice?: string;
  estimatedCommission?: string;
  campaignAssets?: CampaignAsset[];
  contentSuggestions?: ContentSuggestion[];
  supportUrl?: string;
  supportLabel?: string;
  assignmentStatus?: string | null;
  assignedByAdmin?: boolean;
}

const getAssetIcon = (type?: string) => {
  if (type === 'video') return Video;
  if (type === 'image') return ImageIcon;
  return FileText;
};

const safeAssets = (program?: Program | null) => Array.isArray(program?.campaignAssets) ? program!.campaignAssets! : [];
const safeContentSuggestions = (program?: Program | null) => Array.isArray(program?.contentSuggestions) ? program!.contentSuggestions! : [];

const normalizeExternalUrl = (url?: string | null) => {
  const value = (url || '').trim();
  if (!value) return '';
  if (/^(https?:\/\/|mailto:|tel:)/i.test(value)) return value;
  return `https://${value.replace(/^\/+/, '')}`;
};

const formatCommission = (program: Program) => {
  if (program.commissionType === 'FIXED') {
    return `${program.commissionRate.toLocaleString('vi-VN')}đ / đơn`;
  }
  if (program.commissionType === 'TIERED') {
    return `Theo cấp bậc, từ ${program.commissionRate}%`;
  }
  return `${program.commissionRate}%`;
};

const formatPrice = (value?: string) => {
  if (!value) return 'Liên hệ để biết giá';
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) {
    return `${Number(trimmed).toLocaleString('vi-VN')} VND`;
  }
  return trimmed;
};

export default function AffiliateProgramsPage() {
  const { t } = useI18n();
  const { loading: authLoading } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailProgram, setDetailProgram] = useState<Program | null>(null);

  useEffect(() => {
    if (!authLoading) fetchPrograms();
  }, [authLoading]);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/affiliate/programs');
      const data = await res.json();
      if (data.success) setPrograms(data.programs || []);
    } catch (error) {
      console.error('Failed to fetch affiliate programs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-52" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3].map((item) => <Skeleton key={item} className="h-72" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('affiliateProgramsPage.header.title')}</h1>
        <p className="text-muted-foreground">{t('affiliateProgramsPage.header.description')}</p>
      </div>

      {programs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Layers className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="font-medium">{t('affiliateProgramsPage.emptyState.title')}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t('affiliateProgramsPage.emptyState.description')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {programs.map((program) => (
            <Card key={program.id} className="overflow-hidden">
              {program.bannerUrl ? (
                <img src={program.bannerUrl} alt={program.name} className="aspect-[16/9] w-full object-cover" />
              ) : (
                <div className="aspect-[16/9] w-full" style={{ background: `linear-gradient(135deg, ${program.brandColor || '#10b981'}, #f59e0b)` }} />
              )}
              <CardContent className="space-y-1.5 pt-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-700">{program.name}</p>
                  {program.isDefault && <Star className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />}
                </div>

                <p className={program.servicePrice ? 'text-2xl font-black leading-tight text-rose-600' : 'text-sm italic text-muted-foreground'}>
                  {formatPrice(program.servicePrice)}
                </p>

                <span className="inline-block rounded-full bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-600">
                  Hoa hồng {formatCommission(program)}
                </span>

                {program.description && (
                  <p className="line-clamp-2 pt-1 text-xs text-muted-foreground/80">{program.description}</p>
                )}

                <Button variant="outline" size="sm" className="w-full !mt-3" onClick={() => setDetailProgram(program)}>
                  {t('affiliateProgramsPage.card.details')}
                </Button>
              </CardContent>
            </Card>

          ))}
        </div>
      )}

      <Dialog open={!!detailProgram} onOpenChange={(open) => !open && setDetailProgram(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{detailProgram?.name}</DialogTitle>
            <DialogDescription>{detailProgram?.description || t('affiliateProgramsPage.detailDialog.fallbackDescription')}</DialogDescription>
          </DialogHeader>
          {detailProgram && (
            <div className="space-y-5 text-sm">
              {detailProgram.bannerUrl && (
                <img src={detailProgram.bannerUrl} alt={detailProgram.name} className="aspect-[16/9] w-full rounded-2xl object-cover" />
              )}

              <section className="space-y-3">
                <h3 className="flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-amber-500" /> {t('affiliateProgramsPage.detailDialog.campaignDetails.title')}</h3>
                {detailProgram.productDescription && <p className="whitespace-pre-line rounded-lg border bg-muted/30 p-3 text-muted-foreground">{detailProgram.productDescription}</p>}
              </section>

              <section className="space-y-3">
                <h3 className="flex items-center gap-2 font-semibold"><Download className="h-4 w-4 text-blue-500" /> {t('affiliateProgramsPage.detailDialog.campaignAssets.title')}</h3>
                {safeAssets(detailProgram).length === 0 ? (
                  <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">{t('affiliateProgramsPage.detailDialog.campaignAssets.empty')}</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {safeAssets(detailProgram).map((asset, index) => {
                      const AssetIcon = getAssetIcon(asset.type);
                      return (
                        <div key={`${asset.url || asset.title}-${index}`} className="rounded-lg border p-3">
                          <div className="flex items-start gap-3">
                            <div className="rounded-full bg-muted p-2"><AssetIcon className="h-4 w-4" /></div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium">{asset.title || `${t('affiliateProgramsPage.detailDialog.campaignAssets.fallbackTitle')} ${index + 1}`}</p>
                              {asset.note && <p className="mt-1 text-xs text-muted-foreground">{asset.note}</p>}
                              {asset.url && (
                                <Button variant="outline" size="sm" className="mt-3" onClick={() => window.open(normalizeExternalUrl(asset.url), '_blank', 'noopener,noreferrer')}>
                                  <Download className="mr-2 h-4 w-4" /> {t('affiliateProgramsPage.detailDialog.campaignAssets.open')}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <h3 className="flex items-center gap-2 font-semibold"><MessageSquare className="h-4 w-4 text-green-500" /> {t('affiliateProgramsPage.detailDialog.contentSuggestions.title')}</h3>
                {safeContentSuggestions(detailProgram).length === 0 ? (
                  <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">{t('affiliateProgramsPage.detailDialog.contentSuggestions.empty')}</p>
                ) : (
                  <div className="space-y-3">
                    {safeContentSuggestions(detailProgram).map((item, index) => (
                      <div key={`${item.title}-${index}`} className="rounded-lg border bg-muted/20 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-medium">{item.title || `${t('affiliateProgramsPage.detailDialog.contentSuggestions.fallbackTitle')} ${index + 1}`}</p>
                          {item.url && <Button variant="ghost" size="sm" onClick={() => window.open(normalizeExternalUrl(item.url), '_blank', 'noopener,noreferrer')}><ExternalLink className="mr-2 h-4 w-4" />{t('affiliateProgramsPage.detailDialog.contentSuggestions.openLink')}</Button>}
                        </div>
                        {item.body && <p className="mt-2 whitespace-pre-line text-muted-foreground">{item.body}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {(detailProgram.supportUrl || detailProgram.supportLabel) && (
                <section className="rounded-xl border bg-emerald-50 p-4 text-emerald-950">
                  <h3 className="flex items-center gap-2 font-semibold"><Headphones className="h-4 w-4" /> {t('affiliateProgramsPage.detailDialog.support.title')}</h3>
                  <p className="mt-1 text-sm opacity-80">{t('affiliateProgramsPage.detailDialog.support.description')}</p>
                  {detailProgram.supportUrl && (
                    <Button className="mt-3" size="sm" onClick={() => window.open(normalizeExternalUrl(detailProgram.supportUrl), '_blank', 'noopener,noreferrer')}>
                      <ExternalLink className="mr-2 h-4 w-4" />{detailProgram.supportLabel || t('affiliateProgramsPage.detailDialog.support.contact')}
                    </Button>
                  )}
                </section>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
