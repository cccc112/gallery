import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';
 
export const locales = ['zh', 'en'];
export const defaultLocale = 'zh';

export default getRequestConfig(async (args) => {
  console.log('[i18n] getRequestConfig args:', args);
  
  // Fallback to older `locale` or newer `requestLocale`
  let locale = args.locale || (args as any).requestLocale;
  if (locale instanceof Promise) locale = await locale;
  if (!locale) locale = defaultLocale; // Fallback to avoid crash

  console.log('[i18n] using locale:', locale);
  
  if (!locales.includes(locale as any)) {
    locale = defaultLocale;
  }

  return {
    locale: locale as string,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
