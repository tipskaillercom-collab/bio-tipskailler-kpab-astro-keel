import type { APIRoute, GetStaticPaths } from 'astro';
import { locale as defaultLocale, locales } from '../../../../i18n';
import {
  getOgEntriesForLocale,
  type OgProps,
  renderOgImage,
} from '../../../../utils/generate-og.ts';

export const getStaticPaths = (async () => {
  const secondaryLocales = locales.filter((l) => l !== defaultLocale);

  const allPaths = await Promise.all(
    secondaryLocales.map(async (locale) => {
      const entries = await getOgEntriesForLocale(locale);
      return entries.map(({ collection, slug, props }) => ({
        params: { locale, collection, slug },
        props,
      }));
    }),
  );

  return allPaths.flat();
}) satisfies GetStaticPaths;

export const GET: APIRoute<OgProps> = async ({ props }) => renderOgImage(props);
