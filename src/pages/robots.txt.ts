import type { APIContext } from 'astro';
import { withBase } from '../lib/url';

export async function GET(context: APIContext) {
  // Lấy site từ astro.config.mjs, nếu chưa set sẽ dùng fallback
  const siteUrl = context.site ?? 'https://bio.tipskailler.com';
  const sitemapURL = new URL(withBase('/sitemap-index.xml'), siteUrl).href;

  const content = `User-agent: *
Allow: /

Sitemap: ${sitemapURL}
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
