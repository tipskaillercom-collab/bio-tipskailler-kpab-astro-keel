import type { APIRoute, GetStaticPaths } from 'astro';
import { locale as defaultLocale } from '../../../i18n';
import { getOgEntriesForLocale, type OgProps, renderOgImage } from '../../../utils/generate-og.ts';

export const getStaticPaths = (async () => {
  const entries = await getOgEntriesForLocale(defaultLocale);

  return entries.map(({ collection, slug, props }) => ({
    params: { collection, slug },
    props,
  }));
}) satisfies GetStaticPaths;

export const GET: APIRoute<OgProps> = async ({ props }) => renderOgImage(props);
