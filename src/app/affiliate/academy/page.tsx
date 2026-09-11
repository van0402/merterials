"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  ChartNoAxesCombined,
  CheckCircle2,
  Copy,
  Megaphone,
  MousePointerClick,
  Share2,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";

const academySteps = [
  { key: "step1", icon: BadgeCheck, href: "/affiliate/settings" },
  { key: "step2", icon: Copy, href: "/affiliate" },
  { key: "step3", icon: Share2, href: "/affiliate/programs" },
  { key: "step4", icon: MousePointerClick, href: "/affiliate/reports" },
  { key: "step5", icon: Wallet, href: "/affiliate/payouts" },
];

const tips = ["item1", "item2", "item3", "item4"];

export default function AcademyPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border bg-gradient-to-br from-orange-600 via-amber-500 to-yellow-400 p-6 text-white shadow-xl shadow-orange-500/20">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-semibold backdrop-blur">
            <BookOpenCheck className="h-4 w-4" /> {t('affiliateAcademyPage.hero.eyebrow')}
          </div>
          <h1 className="text-3xl font-black tracking-tight">{t('affiliateAcademyPage.hero.title')}</h1>
          <p className="text-white/90">{t('affiliateAcademyPage.hero.description')}</p>
        </div>
      </div>

      <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-5">
        {academySteps.map((item, index) => (
          <Card key={item.key} className="relative flex h-full min-h-[320px] flex-col overflow-hidden border-orange-100 bg-white/90 shadow-sm">
            <div className="absolute right-4 top-4 text-5xl font-black text-orange-100">{index + 1}</div>
            <CardHeader className="relative min-h-[150px] space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <CardDescription className="font-bold uppercase tracking-widest text-orange-600">{t(`affiliateAcademyPage.steps.${item.key}.step`)}</CardDescription>
                <CardTitle className="mt-1 text-base leading-snug">{t(`affiliateAcademyPage.steps.${item.key}.title`)}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="relative flex flex-1 flex-col space-y-4">
              <p className="flex-1 text-sm leading-6 text-muted-foreground">{t(`affiliateAcademyPage.steps.${item.key}.description`)}</p>
              <Button asChild variant="outline" size="sm" className="mt-auto w-full justify-between rounded-xl">
                <Link href={item.href}>
                  {t(`affiliateAcademyPage.steps.${item.key}.action`)}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Megaphone className="h-4 w-4 text-orange-500" /> {t('affiliateAcademyPage.tips.title')}
            </CardTitle>
            <CardDescription>{t('affiliateAcademyPage.tips.description')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {tips.map((tip) => (
              <div key={tip} className="flex gap-3 rounded-2xl border bg-muted/20 p-4 text-sm leading-6">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{t(`affiliateAcademyPage.tips.${tip}`)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-emerald-100 bg-emerald-50/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-emerald-900">
              <ChartNoAxesCombined className="h-4 w-4" /> {t('affiliateAcademyPage.performance.title')}
            </CardTitle>
            <CardDescription className="text-emerald-800/70">{t('affiliateAcademyPage.performance.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700">
              <Link href="/affiliate/reports">
                {t('affiliateAcademyPage.performance.action')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
