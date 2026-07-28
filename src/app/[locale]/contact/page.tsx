'use client';

import Link from 'next/link';
import { Mail, Clock, MapPin, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function ContactPage() {
  const t = useTranslations('Contact');
  return (
    <div className="marble-bg min-h-screen py-16 px-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-12 text-center">
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3">{t('support')}</p>
          <h1 className="font-serif text-4xl font-semibold text-foreground mb-4">{t('title')}</h1>
          <p className="text-muted-foreground font-light max-w-lg mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">

          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-white/70 backdrop-blur-sm border border-border/60 rounded-sm p-6 space-y-5">
              <h2 className="font-serif text-lg font-semibold text-foreground">{t('contactInfo')}</h2>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-4.5 w-4.5 text-foreground" />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground mb-1">{t('email')}</p>
                  <a href="mailto:richhong0122@gmail.com" className="text-sm text-foreground hover:underline">
                    richhong0122@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-4.5 w-4.5 text-foreground" />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground mb-1">{t('replyTime')}</p>
                  <p className="text-sm text-foreground">{t('workingHours')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('responseTime')}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-4.5 w-4.5 text-foreground" />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground mb-1">{t('location')}</p>
                  <p className="text-sm text-foreground">{t('locationTaipei')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('serviceArea')}</p>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white/70 backdrop-blur-sm border border-border/60 rounded-sm p-6">
              <h2 className="font-serif text-base font-semibold text-foreground mb-4">{t('quickLinks')}</h2>
              <div className="space-y-2">
                {[
                  { href: '/faq', label: t('faqLink') },
                  { href: '/shipping', label: t('shippingLink') },
                ].map(({ href, label }) => (
                  <Link key={href} href={href}
                    className="flex items-center justify-between px-3 py-2.5 rounded-sm hover:bg-secondary/50 transition-colors text-sm text-foreground group">
                    {label}
                    <span className="text-muted-foreground group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white/70 backdrop-blur-sm border border-border/60 rounded-sm p-6">
            <h2 className="font-serif text-lg font-semibold text-foreground mb-5">{t('sendMessage')}</h2>
            <form className="space-y-4" onSubmit={e => e.preventDefault()}>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">{t('name')}</label>
                <input type="text" placeholder={t('namePlaceholder')} required
                  className="w-full rounded-sm border border-border bg-white/80 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/40 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">{t('emailLabel')}</label>
                <input type="email" placeholder="your@email.com" required
                  className="w-full rounded-sm border border-border bg-white/80 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/40 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">{t('subject')}</label>
                <select className="w-full rounded-sm border border-border bg-white/80 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-foreground/40 transition-colors">
                  <option>{t('subjArtwork')}</option>
                  <option>{t('subjPurchase')}</option>
                  <option>{t('subjArtist')}</option>
                  <option>{t('subjTech')}</option>
                  <option>{t('subjOther')}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">{t('messageContent')}</label>
                <textarea rows={5} placeholder={t('messagePlaceholder')} required
                  className="w-full rounded-sm border border-border bg-white/80 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/40 transition-colors resize-none" />
              </div>
              <button type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-sm bg-primary text-primary-foreground py-3 text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm">
                <Send className="h-4 w-4" />
                {t('submitBtn')}
              </button>
              <p className="text-[10px] text-muted-foreground text-center">{t('submitNote')}</p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
