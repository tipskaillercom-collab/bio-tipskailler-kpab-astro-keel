import { locale as defaultLocale } from '../i18n';

const base = import.meta.env.BASE_URL;

/**
 * Prefix a site-root-absolute path (e.g. `/blog/`) with the configured `base`
 * so links and assets resolve when the site is served from a subpath — such as
 * a GitHub Pages project site at `/<repo>/`. With no `base` set, `BASE_URL` is
 * `/` and the path is returned unchanged.
 */
/**
 * Prefix a site-root-absolute path with the configured `base`
 * and an optional multi-language `locale` partition.
 *
 * - Nếu `locale` là 'en' (hoặc không truyền/mặc định): giữ nguyên đường dẫn gốc (ví dụ: `/blog/`)
 * - Nếu `locale` là 'vi' hoặc 'ja': tự động chèn tiền tố ngôn ngữ vào giữa (ví dụ: `/vi/blog/`)
 */
export function withBase(path: string, locale: string = defaultLocale): string {
  const trimmedBase = base.endsWith('/') ? base.slice(0, -1) : base;

  // Xác định tiền tố locale (Tiếng Anh mặc định ở gốc nên không thêm /en/ vào URL)
  const localePrefix = !locale || locale === defaultLocale ? '' : `/${locale}`;

  // Chuẩn hóa path luôn bắt đầu bằng dấu gạch chéo
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // Ghép nối: base + localePrefix + path (đồng thời lọc bỏ các dấu gạch chéo kép nếu có)
  const fullPath = `${trimmedBase}${localePrefix}${cleanPath}`;
  return fullPath.replace(/\/+/g, '/');
}
