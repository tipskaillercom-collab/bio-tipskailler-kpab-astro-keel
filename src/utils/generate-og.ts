import { getCollection } from 'astro:content';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import satori from 'satori';
import sharp from 'sharp';
import { getSiteConfig } from '../consts';
import { type Locale, locale as defaultLocale, useTranslations, locales } from '../i18n';

export interface OgProps {
  title: string;
  description: string;
  kind: string;
  siteTitle: string;
}

// Satori has no oklch() support, so these are hex equivalents of the
// light-theme tokens in global.css.
const COLOR = {
  bg: '#fcfcfa',
  text: '#252831',
  muted: '#697080',
  line: '#dbd8d0',
  accent: '#a8492c',
};

const require = createRequire(import.meta.url);
const font = (pkgPath: string) => readFile(require.resolve(pkgPath));

// Latin subsets, to keep the build light. Satori draws any glyph these fonts
// lack as an empty box, which is why the `kind` labels above stay Latin rather
// than going through the UI dictionary — `SITE.locale = 'ja'` would otherwise
// render them as tofu in every share image. Post titles in a non-Latin script
// hit the same limit: install a face that covers them (e.g.
// `@fontsource/noto-sans-jp`) and point the paths below at it.
const [fraunces, publicSans, frauncesVN, notoSansJP] = await Promise.all([
  font('@fontsource/fraunces/files/fraunces-latin-600-normal.woff'),
  font('@fontsource/public-sans/files/public-sans-latin-400-normal.woff'),
  font('@fontsource/fraunces/files/fraunces-vietnamese-600-normal.woff'),
  font('@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-400-normal.woff'),
]);

const truncate = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;

type OgSourceItem = {
  id: string;
  title: string;
  description: string;
};

// Helper lọc đúng bài theo locale và làm sạch slug (bỏ tiền tố thư mục ngôn ngữ)
function mapEntriesByLocale(
  entries: OgSourceItem[],
  targetLocale: Locale,
  collection: 'blog' | 'works' | 'about',
  kind: string,
  siteTitle: string,
) {
  const otherLocales = locales.filter((l) => l !== defaultLocale);

  return entries
    .filter((entry) => {
      const firstSegment = entry.id.split('/')[0];
      // Nếu bài nằm trong thư mục ngôn ngữ phụ (vd: 'en/...') thì locale của nó là 'en'
      // Ngược lại thì thuộc về defaultLocale
      const entryLocale = otherLocales.includes(firstSegment as Locale)
        ? (firstSegment as Locale)
        : defaultLocale;

      return entryLocale === targetLocale;
    })
    .map((entry) => {
      // Cắt bỏ tiền tố 'en/' hoặc 'ja/' nếu có để lấy slug sạch không chứa dấu '/'
      const prefix = `${targetLocale}/`;
      const cleanSlug = entry.id.startsWith(prefix) ? entry.id.slice(prefix.length) : entry.id;

      return {
        collection,
        slug: cleanSlug,
        props: {
          title: entry.title,
          description: entry.description,
          kind,
          siteTitle,
        } satisfies OgProps,
      };
    });
}

// Hàm lấy danh sách entries và gắn sẵn props theo từng locale
export async function getOgEntriesForLocale(locale: Locale) {
  const SITE = getSiteConfig(locale);
  const { t } = useTranslations(locale);

  const blog = (await getCollection('blog', ({ data }) => !data.draft)).map((e) => ({
    id: e.id,
    title: e.data.title,
    description: e.data.description,
  }));

  const works = (await getCollection('works')).map((e) => ({
    id: e.id,
    title: e.data.title,
    description: e.data.description,
  }));

  const staticOgEntries = [
    {
      collection: 'blog' as const,
      slug: 'index',
      props: {
        title: t('blog.title'),
        description: t('blog.pageDescription'),
        kind: t('blog.title'),
        siteTitle: SITE.title,
      } satisfies OgProps,
    },
    {
      collection: 'works' as const,
      slug: 'index',
      props: {
        title: t('works.title'),
        description: t('works.description'),
        kind: t('works.title'),
        siteTitle: SITE.title,
      } satisfies OgProps,
    },
    {
      collection: 'about' as const,
      slug: 'index',
      props: {
        title: t('about.title'),
        description: t('about.description', { title: SITE.title }),
        kind: t('about.title'),
        siteTitle: SITE.title,
      } satisfies OgProps,
    },
  ];

  // const blockWorks: OgSourceItem[] = [
  //   {
  //     id: locale === defaultLocale ? 'index' : `${locale}/index`,
  //     title: t('works.title'),
  //     description: t('works.description', { title: SITE.title }),
  //   },
  // ];

  // const about: OgSourceItem[] = [
  //   {
  //     id: locale === defaultLocale ? 'index' : `${locale}/index`,
  //     title: t('about.title'),
  //     description: t('about.description', { title: SITE.title }),
  //   },
  // ];

  return [
    ...mapEntriesByLocale(blog, locale, 'blog', t('blog.title'), SITE.title),
    ...mapEntriesByLocale(works, locale, 'works', t('works.title'), SITE.title),
    ...staticOgEntries,
    // ...mapEntriesByLocale(blockWorks, locale, 'blockWorks', t('works.title'), SITE.title),
    // ...mapEntriesByLocale(about, locale, 'about', t('about.title'), SITE.title),
  ];
}

// Hàm render ảnh PNG từ OgProps (giữ nguyên bên dưới)
export async function renderOgImage({ title, description, kind, siteTitle }: OgProps) {
  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          backgroundColor: COLOR.bg,
          padding: 40,
          fontFamily: 'Public Sans',
        },
        children: {
          type: 'div',
          props: {
            style: {
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: `1px solid ${COLOR.line}`,
              padding: '52px 60px',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: { display: 'flex', alignItems: 'center', gap: 16 },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: { width: 22, height: 22, backgroundColor: COLOR.accent },
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: { fontFamily: 'Fraunces', fontSize: 30, color: COLOR.text },
                        children: siteTitle,
                      },
                    },
                  ],
                },
              },
              {
                type: 'div',
                props: {
                  style: { display: 'flex', flexDirection: 'column' },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          marginBottom: 28,
                          color: COLOR.accent,
                          fontFamily: 'Fraunces',
                          fontSize: 24,
                          textTransform: 'uppercase',
                          letterSpacing: 4,
                        },
                        children: [
                          {
                            type: 'div',
                            props: {
                              style: { width: 40, height: 1, backgroundColor: COLOR.accent },
                            },
                          },
                          { type: 'div', props: { children: kind } },
                        ],
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontFamily: 'Fraunces',
                          fontSize: title.length > 55 ? 54 : 64,
                          lineHeight: 1.15,
                          color: COLOR.text,
                        },
                        children: truncate(title, 90),
                      },
                    },
                  ],
                },
              },
              {
                type: 'div',
                props: {
                  style: { fontSize: 26, lineHeight: 1.4, color: COLOR.muted },
                  children: truncate(description, 120),
                },
              },
            ],
          },
        },
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Fraunces', data: fraunces, weight: 600, style: 'normal' },
        { name: 'Public Sans', data: publicSans, weight: 400, style: 'normal' },
        { name: 'Fraunces VN', data: frauncesVN, weight: 600, style: 'normal' },
        { name: 'Noto Sans JP', data: notoSansJP, weight: 400, style: 'normal' },
      ],
    },
  );

  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png' },
  });
}
