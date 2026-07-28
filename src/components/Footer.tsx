'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 4l16 16" />
    <path d="M4 20L20 4" />
  </svg>
);

function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const t = useTranslations('Footer');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(data.alreadySubscribed ? t('alreadySubscribed') : t('subscribeSuccess'));
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || t('subscribeError'));
      }
    } catch {
      setStatus('error');
      setMessage(t('networkError'));
    }
  }

  if (status === 'success') {
    return (
      <div className="flex items-center gap-3 py-2">
        <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
        <p className="text-sm text-primary-foreground/80">{message}</p>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
          required
          disabled={status === 'loading'}
          className="flex-1 px-4 py-2.5 bg-primary-foreground/10 border border-primary-foreground/20 rounded-sm text-sm placeholder:text-primary-foreground/45 focus:outline-none focus:border-primary-foreground/40 text-white disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-4 py-2.5 bg-primary-foreground text-primary text-sm font-semibold rounded-sm hover:bg-primary-foreground/90 transition-colors disabled:opacity-60 flex items-center gap-1.5 flex-shrink-0"
        >
          {status === 'loading' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : t('subscribeBtn')}
        </button>
      </form>
      {status === 'error' && (
        <p className="mt-2 text-xs text-rose-300">{message}</p>
      )}
    </>
  );
}

export default function Footer() {
  const t = useTranslations('Footer');

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-serif font-semibold tracking-tight">
                Atelier Blanc
              </span>
            </Link>
            <p className="mt-4 text-sm text-primary-foreground/70 leading-relaxed max-w-xs font-light">
              {t('brandDesc')}
            </p>
            <div className="flex flex-col gap-2 mt-6">
              <div className="flex items-center gap-4">
                <div className="text-primary-foreground/40 cursor-not-allowed" title={t('igComingSoon')}>
                  <InstagramIcon />
                  <span className="sr-only">Instagram</span>
                </div>
                <div className="text-primary-foreground/40 cursor-not-allowed" title={t('xComingSoon')}>
                  <XIcon />
                  <span className="sr-only">X (Twitter)</span>
                </div>
              </div>
              <span className="text-[10px] text-primary-foreground/50 tracking-widest uppercase">{t('socialsComingSoon')}</span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-medium tracking-widest uppercase mb-6 font-serif">
              Explore
            </h4>
            <ul className="space-y-3 font-light text-sm">
              <li>
                <Link href="/gallery" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  {t('exploreGallery')}
                </Link>
              </li>
              <li>
                <Link href="/gallery?type=digital" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  {t('digitalArt')}
                </Link>
              </li>
              <li>
                <Link href="/gallery?type=physical" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  {t('physicalArt')}
                </Link>
              </li>
              <li>
                <Link href="/generate" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  {t('aiGen')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-medium tracking-widest uppercase mb-6 font-serif">
              Support
            </h4>
            <ul className="space-y-3 font-light text-sm">
              <li>
                <Link href="/contact" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  {t('contact')}
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  {t('shipping')}
                </Link>
              </li>

              <li>
                <Link href="/faq" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  {t('faq')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-sm font-medium tracking-widest uppercase mb-6 font-serif">
              {t('stayInformed')}
            </h4>
            <p className="text-sm text-primary-foreground/70 mb-4 font-light">
              {t('newsletterDesc')}
            </p>
            <NewsletterForm />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-primary-foreground/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-primary-foreground/50">
            &copy; {new Date().getFullYear()} Atelier Blanc. All rights reserved. {t('copyrightSuffix')}
          </p>
          <div className="flex items-center gap-6 text-xs text-primary-foreground/50">
            <Link href="/faq#privacy" className="hover:text-primary-foreground/70 transition-colors">
              {t('privacy')}
            </Link>
            <Link href="/faq#terms" className="hover:text-primary-foreground/70 transition-colors">
              {t('terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
