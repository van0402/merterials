'use client';

import { useI18n } from '@/components/i18n-provider';
import AffiliateDashboard from '../page';
import AffiliateProgramsPage from '../programs/page';

export default function AffiliateProgramPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('affiliateProgramPage.header.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('affiliateProgramPage.header.description')}
          </p>
        </div>
        <AffiliateDashboard />
      </section>

      <section className="space-y-4 border-t pt-8">
        <AffiliateProgramsPage />
      </section>
    </div>
  );
}
