import type { Metadata } from 'next';
import Link from 'next/link';
import { Truck, RotateCcw, Package, ShieldCheck, Clock, AlertCircle } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'Shipping' });
  return {
    title: `${t('title')} — Atelier Blanc`,
    description: t('title'),
  };
}

const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
  <div className="bg-white/70 backdrop-blur-sm border border-border/60 rounded-sm p-6">
    <div className="flex items-center gap-3 mb-4">
      <div className="h-9 w-9 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-foreground" />
      </div>
      <h2 className="font-serif text-base font-semibold text-foreground">{title}</h2>
    </div>
    <div className="space-y-3 text-sm text-foreground/80 font-light leading-relaxed">
      {children}
    </div>
  </div>
);

export default async function ShippingPage() {
  const t = await getTranslations('Shipping');
  return (
    <div className="marble-bg min-h-screen py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-12 text-center">
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3">{t('support')}</p>
          <h1 className="font-serif text-4xl font-semibold text-foreground mb-4">{t('title')}</h1>
          <p className="text-muted-foreground font-light max-w-lg mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="space-y-5">
          <Section icon={Truck} title={t('physicalDelivery')}>
            <p>{t('physicalDeliveryContent1')}</p>
            <p>{t('physicalDeliveryContent2')}</p>
            <ul className="list-disc list-inside space-y-1 mt-2 text-foreground/80">
              <li>{t('physicalDeliveryList1')}</li>
              <li>{t('physicalDeliveryList2')}</li>
              <li>{t('physicalDeliveryList3')}</li>
            </ul>
          </Section>

          <Section icon={Package} title={t('digitalDelivery')}>
            <p>{t('digitalDeliveryContent1')}</p>
            <p>{t('digitalDeliveryContent2Pre')}<strong>{t('digitalDeliveryContent2Strong')}</strong>{t('digitalDeliveryContent2Post')}</p>
            <p>{t('digitalDeliveryContent3')}</p>
          </Section>

          <Section icon={Clock} title={t('rentalDelivery')}>
            <p>{t('rentalDeliveryContent1')}</p>
            <p>{t('rentalDeliveryContent2')}</p>
          </Section>

          <Section icon={RotateCcw} title={t('returnPolicy')}>
            <p><strong>{t('returnPolicyPhysicalStrong')}</strong>{t('returnPolicyPhysicalContent')}</p>
            <p><strong>{t('returnPolicyDigitalStrong')}</strong>{t('returnPolicyDigitalContent')}</p>
            <p><strong>{t('returnPolicyDepositStrong')}</strong>{t('returnPolicyDepositContent')}</p>
          </Section>

          <Section icon={ShieldCheck} title={t('insurance')}>
            <p>{t('insuranceContent')}</p>
          </Section>

          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-sm">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">{t('otherQuestions')}</p>
              <p className="text-xs text-amber-700 mt-0.5">
                {t('contactPre')}<Link href="/contact" className="underline font-medium">{t('contactLink')}</Link>{t('contactPost')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
