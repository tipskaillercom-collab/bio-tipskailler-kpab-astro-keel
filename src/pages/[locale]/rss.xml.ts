import type { APIContext } from 'astro';
import { generateRss } from '../rss.xml';
import { alternateLocales, type Locale } from '../../i18n';

export function getStaticPaths() {
  return alternateLocales.map((locale) => ({
    params: { locale },
  }));
}

export async function GET(context: APIContext) {
  const currentLocale = context.params.locale as Locale;
  return generateRss(context, currentLocale);
}
