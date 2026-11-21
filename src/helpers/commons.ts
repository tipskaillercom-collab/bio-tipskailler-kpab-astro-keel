import { type Locale } from './../i18n';

// helper tách locale prefix ở đầu chuỗi mỗi ID của collection "work/blog"
export function toCollectionSlug(idCollect: string, locale: Locale) {
  let slug = idCollect;
  if (locale && slug.startsWith(`${locale}/`)) {
    slug = slug.slice(locale.length + 1);
  }
  return slug;
}
