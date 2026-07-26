import type { Metadata } from 'next';
import localFont from 'next/font/local';
import '../globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Web3Providers } from '@/components/Web3Providers';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';
import { Suspense } from 'react';
import { Toaster } from 'sonner';
import { ScreenshotGuard } from '@/components/ScreenshotGuard';

const geistSans = localFont({
  src: '../fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: '../fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

const SITE_URL = 'https://atelier-blanc-gallery.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Atelier Blanc | 乙太線上藝廊',
    template: '%s | Atelier Blanc',
  },
  description: '精選實體與數位藝術品，支援安全購買與短期租賃雙軌制。PayPal、信用卡與 Web3 錢包皆可結帳。',
  keywords: ['藝廊', '藝術品', '線上藝廊', '數位藝術', '台灣藝術', 'NFT', 'Web3', 'Atelier Blanc', 'PayPal'],
  authors: [{ name: 'Atelier Blanc' }],
  creator: 'Atelier Blanc',
  openGraph: {
    type: 'website',
    locale: 'zh_TW',
    url: SITE_URL,
    siteName: 'Atelier Blanc',
    title: 'Atelier Blanc | 乙太線上藝廊',
    description: '精選實體與數位藝術品，支援安全購買與短期租賃雙軌制。',
    images: [
      {
        url: '/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Atelier Blanc 線上藝廊',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Atelier Blanc | 乙太線上藝廊',
    description: '精選實體與數位藝術品，支援安全購買與短期租賃雙軌制。',
    images: ['/og-default.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  verification: {
    google: 'XittMrCUot2riHhQdHe9Tr9RLR65DK-4jeAjrc9dqNs',
  },
};

import { GlobalProgressBar } from '@/components/ProgressBar';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();

  return (
    <html lang={locale} className="light">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen marble-bg text-foreground flex flex-col`}
      >
        <NextIntlClientProvider messages={messages}>
          <GoogleAnalytics />
          <Web3Providers>
            <Navbar />
            <main className="flex-1 flex flex-col">
              {children}
            </main>
            <Footer />
          </Web3Providers>
          <Toaster
            position="bottom-right"
            richColors
            toastOptions={{
              style: { fontFamily: 'var(--font-geist-sans)' },
            }}
          />
          <ScreenshotGuard />
          <GlobalProgressBar />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
