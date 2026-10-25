import { locale as defaultLocale, locales } from '../i18n';

const base = import.meta.env.BASE_URL;

/**
 * Prefix a site-root-absolute path (e.g. `/blog/`) with the configured `base`
 * so links and assets resolve when the site is served from a subpath — such as
 * a GitHub Pages project site at `/<repo>/`. With no `base` set, `BASE_URL` is
 * `/` and the path is returned unchanged.
 */
export function withBase(path: string): string {
  const trimmedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${trimmedBase}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Hàm hỗ trợ nội bộ xử lý đa ngôn ngữ và bóc tách locale cũ.
 */
export function withLocalePath(path: string, forcedLocale?: string): string {
  let cleanPath = path.startsWith('/') ? path : `/${path}`;

  // 1. Tự động tìm xem URL truyền vào có sẵn locale chưa
  const segments = cleanPath.split('/').filter(Boolean);
  let detectedLocale: string | undefined = undefined;

  if (segments.length > 0 && locales.includes(segments[0] as any)) {
    detectedLocale = segments.shift();
    cleanPath = `/${segments.join('/')}`;
  }

  // 2. Xác định Locale cuối cùng
  const isForcedLocaleValid = forcedLocale && locales.includes(forcedLocale as any);
  const finalLocale = isForcedLocaleValid ? forcedLocale : (detectedLocale ?? defaultLocale);

  // 3. Tạo đường dẫn chứa tiền tố ngôn ngữ (Ẩn nếu là ngôn ngữ mặc định)
  const localePrefix = !finalLocale || finalLocale === defaultLocale ? '' : `/${finalLocale}`;
  const localizedPath = `${localePrefix}${cleanPath}`.replace(/\/+/g, '/');

  // 4. Bọc qua withBase gốc để gắn base URL hệ thống
  return withBase(localizedPath);
}

/**
 * ✨ BỘ CÔNG CỤ RÚT GỌN (Giống y hệt useTranslation)
 * Giúp gọi `withBase` trong file .astro mà tự động gắn locale của trang hiện tại,
 * đồng thời vẫn cho phép override ép buộc locale nếu cần thiết.
 */
export const useWithBaseWithLocale = (currentLocale?: string) => {
  const targetLocale = currentLocale ?? defaultLocale;

  return {
    /**
     * Hàm withBase phiên bản đa ngôn ngữ, gắn chặt với locale của trang.
     * Cách dùng: withBase('/blog/post-1') hoặc truyền ép buộc withBase('/blog/post-1', 'vi')
     */
    withBase: (path: string, overrideLocale?: string) =>
      withLocalePath(path, overrideLocale ?? targetLocale),
  };
};
