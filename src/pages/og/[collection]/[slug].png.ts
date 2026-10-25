import type { APIRoute, GetStaticPaths } from 'astro';
import { getOgStaticPaths, renderOgImage, type OgProps } from '../../utils/generate-og';
import { locale as defaultLocale } from '../../../i18n';

export const getStaticPaths = (async () => {
  const paths = await getOgStaticPaths();
  // Chỉ lọc ra các path thuộc bản ngôn ngữ mặc định (không có param locale)
  return paths
    .filter((p) => !p.params.locale || p.params.locale === defaultLocale)
    .map((p) => ({
      params: { collection: p.params.collection, slug: p.params.slug },
      props: p.props,
    }));
}) satisfies GetStaticPaths;

export const GET: APIRoute<OgProps> = async ({ props }) => {
  return renderOgImage(props);
};
