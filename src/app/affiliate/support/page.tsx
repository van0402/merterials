"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  ExternalLink,
  Headphones,
  Info,
  Loader2,
  MessageCircle,
  Phone,
  QrCode,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useI18n } from "@/components/i18n-provider";

interface ProgramSupport {
  id: string;
  name: string;
  supportUrl?: string | null;
  supportLabel?: string | null;
}

const normalizeExternalUrl = (url?: string | null) => {
  const value = (url || "").trim();
  if (!value) return "";
  if (/^(https?:\/\/|mailto:|tel:)/i.test(value)) return value;
  return `https://${value.replace(/^\/+/, "")}`;
};

const defaultSupportItems = [
  { titleKey: "fanpageTitle", descriptionKey: "fanpageDescription", icon: Building2, href: "https://www.facebook.com/", actionKey: "fanpageAction" },
  { titleKey: "hotlineTitle", descriptionKey: "hotlineDescription", icon: Phone, href: "tel:", actionKey: "hotlineAction", muted: true },
];

const quickSupportItems = ["item1", "item2", "item3"];

export default function SupportPage() {
  const { t } = useI18n();
  const [programs, setPrograms] = useState<ProgramSupport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/affiliate/programs");
      const data = await res.json();
      if (data.success) setPrograms(data.programs || []);
    } catch (error) {
      console.error("Failed to fetch program support:", error);
    } finally {
      setLoading(false);
    }
  };

  const programSupport = useMemo(
    () => programs.filter((program) => program.supportUrl || program.supportLabel),
    [programs],
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 rounded-3xl" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-40" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border bg-gradient-to-br from-slate-900 via-orange-700 to-amber-500 p-6 text-white shadow-xl shadow-orange-500/20">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-semibold backdrop-blur">
            <Headphones className="h-4 w-4" /> {t('affiliateSupportPage.hero.eyebrow')}
          </div>
          <h1 className="text-3xl font-black tracking-tight">{t('affiliateSupportPage.hero.title')}</h1>
          <p className="text-white/90">{t('affiliateSupportPage.hero.description')}</p>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>{t('affiliateSupportPage.alert')}</AlertDescription>
      </Alert>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircle className="h-4 w-4 text-orange-500" /> {t('affiliateSupportPage.programSupport.title')}
            </CardTitle>
            <CardDescription>{t('affiliateSupportPage.programSupport.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {programSupport.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
                {t('affiliateSupportPage.programSupport.empty')}
              </div>
            ) : (
              programSupport.map((program) => (
                <div key={program.id} className="flex flex-col gap-3 rounded-2xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold">{program.name}</p>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {program.supportLabel || program.supportUrl || t('affiliateSupportPage.programSupport.fallbackLabel')}
                    </p>
                  </div>
                  {program.supportUrl ? (
                    <Button asChild className="shrink-0 rounded-xl">
                      <a href={normalizeExternalUrl(program.supportUrl)} target="_blank" rel="noreferrer">
                        {t('affiliateSupportPage.programSupport.contact')}
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  ) : (
                    <Button disabled className="shrink-0 rounded-xl">{t('affiliateSupportPage.programSupport.noLink')}</Button>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-orange-100 bg-orange-50/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-orange-900">
              <QrCode className="h-4 w-4" /> {t('affiliateSupportPage.qr.title')}
            </CardTitle>
            <CardDescription className="text-orange-900/70">{t('affiliateSupportPage.qr.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex aspect-square items-center justify-center rounded-3xl border border-dashed border-orange-300 bg-white/70 text-center text-sm text-orange-900/70">
              <div className="space-y-2 px-5">
                <QrCode className="mx-auto h-12 w-12 text-orange-500" />
                <p className="font-semibold">{t('affiliateSupportPage.qr.emptyTitle')}</p>
                <p className="text-xs">{t('affiliateSupportPage.qr.emptyDescription')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {defaultSupportItems.map((item) => (
          <Card key={item.titleKey} className={item.muted ? "opacity-80" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <item.icon className="h-4 w-4 text-orange-500" /> {t(`affiliateSupportPage.defaultItems.${item.titleKey}`)}
              </CardTitle>
              <CardDescription>{t(`affiliateSupportPage.defaultItems.${item.descriptionKey}`)}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild={!item.muted} disabled={item.muted} variant="outline" className="w-full justify-between rounded-xl">
                {item.muted ? (
                  <span>{t('affiliateSupportPage.defaultItems.hotlineDisabled')}</span>
                ) : (
                  <a href={item.href} target="_blank" rel="noreferrer">
                    {t(`affiliateSupportPage.defaultItems.${item.actionKey}`)}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Loader2 className="h-4 w-4 text-emerald-600" /> {t('affiliateSupportPage.quickSupport.title')}
          </CardTitle>
          <CardDescription>{t('affiliateSupportPage.quickSupport.description')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {quickSupportItems.map((item) => (
            <div key={item} className="rounded-2xl border bg-muted/20 p-4 text-sm font-medium">
              {t(`affiliateSupportPage.quickSupport.${item}`)}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
