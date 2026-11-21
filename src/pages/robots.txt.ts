import type { APIContext } from 'astro';
import { withBase } from '../lib/url';

export async function GET(context: APIContext) {
  // Fallback về context.url.origin nếu chưa cấu hình `site` trong astro.config.mjs
  const siteUrl = context.site ?? new URL(context.url.origin);
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
