// Các hàm tiện ích xử lý URL và điều hướng ngôn ngữ ở phía Client (Trình duyệt)

export function createI18nHelper(locales: readonly string[], defaultLocale: string) {
  return {
    getSegments(): string[] {
      return window.location.pathname.split('/').filter(Boolean);
    },

    // Kiểm tra xem segment có phải là mã ngôn ngữ chuẩn (độ dài đúng bằng 2 và nằm trong danh sách)
    isValidLocale(seg?: string | null): boolean {
      return !!(seg && seg.length === 2 && locales.includes(seg));
    },

    // Lấy locale hiện tại từ URL
    getCurrentLocale(segments: string[]): string {
      const firstSegment = segments[0];
      return segments.length > 0 && this.isValidLocale(firstSegment) ? firstSegment : defaultLocale;
    },

    // Bóc tách tiền tố ngôn ngữ cũ ra khỏi danh sách segments của đường dẫn
    cleanSegments(segments: string[]): string[] {
      const clean = [...segments];
      if (this.isValidLocale(clean[0])) {
        clean.shift();
      }
      return clean;
    },

    // Xây dựng đường dẫn hoàn chỉnh kèm query/hash
    buildPath(targetLocale: string, cleanSegments: string[]): string {
      const newPath =
        targetLocale === defaultLocale
          ? '/' + cleanSegments.join('/')
          : `/${targetLocale}/` + cleanSegments.join('/');

      return newPath.replace(/\/+/g, '/') + window.location.search + window.location.hash;
    },
  };
}
