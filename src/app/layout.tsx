import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Web3Providers } from '@/components/Web3Providers';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';
import { Suspense } from 'react';
import { Toaster } from 'sonner';
import { ScreenshotGuard } from '@/components/ScreenshotGuard';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://atelier-blanc.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Atelier Blanc | 乙太線上藝廊',
    template: '%s | Atelier Blanc',
  },
  description: '精選實體與數位藝術品，支援安全購買與短期租賃雙軌制。信用卡與 Web3 錢包皆可結帳。',
  keywords: ['藝廊', '藝術品', '線上藝廊', '數位藝術', '台灣藝術', 'NFT', 'Web3', 'Atelier Blanc'],
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
};

function NavbarFallback() {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/50 h-16 lg:h-20">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6 lg:px-8">
        <span className="text-xl lg:text-2xl font-serif font-semibold tracking-tight text-foreground">
          Atelier Blanc
        </span>
        <div className="h-8 w-32 rounded-sm bg-secondary/50 animate-pulse" />
      </div>
    </header>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className="light">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground flex flex-col`}
      >
        <GoogleAnalytics />
        <Web3Providers>
          <Suspense fallback={<NavbarFallback />}>
            <Navbar />
          </Suspense>
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
      </body>
    </html>
  );
}
