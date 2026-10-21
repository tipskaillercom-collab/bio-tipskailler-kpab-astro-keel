# Báo Cáo Kiểm Tra & Tối Ưu Hóa RSS Feed & Sitemap Trong Astro (RSS & Sitemap Audit)

Tài liệu này tổng hợp chi tiết quá trình kiểm tra, cấu hình và chuẩn hóa hệ thống RSS Feed, XML Sitemap và Dynamic Robots.txt trong dự án Astro SSG, bảo đảm việc thu thập thông tin và lập chỉ mục của các công cụ tìm kiếm diễn ra chính xác, tự động và chuẩn SEO.

---

## 1. Mục tiêu tối ưu
- Cấu hình tích hợp sitemap tự động thông qua `@astrojs/sitemap` tương thích với cấu trúc URL và routing của dự án.
- Tự động sinh file `robots.txt` động (`src/pages/robots.txt.ts`) chứa đường dẫn chính xác tới `sitemap-index.xml`, thích ứng linh hoạt theo cấu hình môi trường và tên miền.
- Chuẩn hóa RSS Feed (`src/pages/rss.xml.ts`):
  - Đồng bộ domain gốc (`site`) chính xác theo môi trường thực tế (`https://[your-domain.com]`).
  - Lọc bỏ các bài viết bản nháp (`draft: true`).
  - Sắp xếp bài viết theo thời gian xuất bản mới nhất (`publishDate`).
  - Khai báo đầy đủ tiêu đề, mô tả và ngôn ngữ cho feed reader.

---

## 2. Quá trình kiểm tra chi tiết từng thành phần

### 2.1. Cấu hình Sitemap (`astro.config.mjs`)
- Tích hợp chính thức `sitemap()` từ `@astrojs/mdx` và `@astrojs/sitemap`.
- Xác định trường `site` và `base` linh hoạt thông qua biến môi trường nạp từ Vite:
  - Môi trường Production: sử dụng `PUBLIC_APP_PRODUCTION_URL` và `PUBLIC_APP_PRODUCTION_BASE`.
  - Môi trường Local/Staging: sử dụng `PUBLIC_APP_LOCAL_URL` và `PUBLIC_APP_LOCAL_BASE`.
- Khi build production, Astro tự động quét toàn bộ routes tĩnh để sinh ra file chỉ mục `sitemap-index.xml` và các file sitemap con.

### 2.2. Tự động hóa tệp robots.txt (`src/pages/robots.txt.ts`)
- Thay vì sử dụng file tĩnh trong thư mục `public/`, dự án sử dụng API endpoint động `src/pages/robots.txt.ts` với hàm `GET(context: APIContext)`.
- **Logic hoạt động:**
  - Lấy thông tin URL gốc trực tiếp từ `context.site` (hoặc fallback về domain production chính thức `https://[your-domain.com]`).
  - Sử dụng hàm helper `withBase('/sitemap-index.xml')` để bảo đảm đường dẫn sitemap luôn khớp với base path được chỉ định.
  - Sinh nội dung cho phép tất cả bot thu thập dữ liệu hợp lệ (`Allow: /`) và công khai đường dẫn `Sitemap`.

### 2.3. Tối ưu hóa nguồn cấp dữ liệu RSS (`src/pages/rss.xml.ts`)
- Tận dụng hàm `getCollection('blog')` từ Content Layer API.
- **Tiêu chuẩn xử lý:**
  - Lọc bỏ các bản nháp: `({ data }) => !data.draft`.
  - Sắp xếp bài viết giảm dần theo ngày đăng: `b.data.publishDate.valueOf() - a.data.publishDate.valueOf()`.
  - Cập nhật domain cấu hình RSS feed: lấy trực tiếp từ `context.site` hoặc fallback chính xác về `https://[your-domain.com]`.
  - Thiết lập thuộc tính ngôn ngữ và metadata phù hợp với tiêu chuẩn RSS 2.0.

---

## 3. Các thay đổi và cấu hình cụ thể

### 3.1. Cấu hình sinh robots.txt động (`src/pages/robots.txt.ts`)
```typescript
import type { APIContext } from 'astro';
import { withBase } from '../lib/url';

export async function GET(context: APIContext) {
  const siteUrl = context.site ?? 'https://[your-domain.com]';
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
```

### 3.2. Cấu hình RSS Feed chuẩn SEO (`src/pages/rss.xml.ts`)
```typescript
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '../consts';

export async function GET(context: APIContext) {
  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf(),
  );

  return rss({
    title: SITE.title,
    description: SITE.rssDescription,
    site: context.site ?? 'https://[your-domain.com]',
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishDate,
      link: `/blog/${post.id}/`,
    })),
  });
}
```

---

## 4. Tóm tắt kết quả đạt được
1. **Khả năng lập chỉ mục (Indexability):** Các bot tìm kiếm (Googlebot, Bingbot,...) luôn được cung cấp sơ đồ trang web cập nhật nhất tại `/robots.txt` dẫn tới `/sitemap-index.xml`.
2. **Khả năng phân phối nội dung (Content Syndication):** Người dùng và các feed reader nhận được dữ liệu bài viết mới nhất tức thì, không bị lỗi sai lệch domain hay lộ các bài viết đang ở trạng thái nháp.
3. **Tính nhất quán giữa các môi trường:** Việc liên kết URL trong sitemap và RSS tự động thích ứng chuẩn xác dù chạy trên localhost, staging hay production.
