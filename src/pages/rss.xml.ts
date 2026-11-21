import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { useWithBaseWithLocale } from '../lib/url';
import { getSiteConfig } from '../consts';
import { locale as defaultLocale, type Locale } from '../i18n';
import { toCollectionSlug } from '../helpers/commons';

// Hàm xử lý RSS dùng chung cho mọi ngôn ngữ
export async function generateRss(context: APIContext, targetLocale: Locale = defaultLocale) {
  const SITE = getSiteConfig(targetLocale);
  const { withBase } = useWithBaseWithLocale(targetLocale);

  // Lọc bài viết không nháp VÀ thuộc đúng thư mục ngôn ngữ
  const posts = (
    await getCollection('blog', ({ id, data }) => !data.draft && id.startsWith(`${targetLocale}/`))
  )
    .sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf())
    .map((post) => ({
      ...post,
      slug: toCollectionSlug(post.id, targetLocale),
    }));

  return rss({
    title: SITE.title,
    description: SITE.rssDescription,
    site: context.site ?? context.url.origin,
    customData: `<language>${targetLocale}</language>`,
    items: posts.map((post) => {
      return {
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.publishDate,
        link: withBase(`/blog/${post.slug}/`),
        categories: post.data.tags,
      };
    }),
  });
}

// Endpoint mặc định cho /rss.xml (ngôn ngữ gốc 'en')
export async function GET(context: APIContext) {
  return generateRss(context, defaultLocale);
}
