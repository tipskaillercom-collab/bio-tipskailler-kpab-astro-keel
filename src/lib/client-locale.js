// Các hàm tiện ích xử lý URL và điều hướng ngôn ngữ ở phía Client (Trình duyệt)

export function createI18nHelper() {
  // === NOTE: Trong đoạn này cả server/client đều đọc được ====
  // code...
  // ===========================================================

  const helper = {
    // NOTE: Tại đây trở xuống, Phía Client đều không đọc được các giá trị, hàm hoặc bất cứ gì ở đoạn trên

    getSegments: () => {
      return window.location.pathname.split('/').filter(Boolean);
    },

    // Kiểm tra xem segment có phải là mã ngôn ngữ chuẩn (độ dài đúng bằng 2 và nằm trong danh sách)
    isValidLocale: (seg, locales) => {
      return !!(seg && seg.length === 2 && locales.includes(seg));
    },

    // Lấy locale hiện tại từ URL
    getCurrentLocale: (segments, isValidLocaleResult, defaultLocale) => {
      const firstSegment = segments[0];
      return segments.length > 0 && isValidLocaleResult ? firstSegment : defaultLocale;
    },

    // Bóc tách tiền tố ngôn ngữ cũ ra khỏi danh sách segments của đường dẫn
    cleanSegments: (segments, isValidLocaleResult) => {
      const clean = [...segments];
      if (isValidLocaleResult) {
        clean.shift();
      }
      return clean;
    },

    // Xây dựng đường dẫn hoàn chỉnh kèm query/hash
    buildPath: (targetLocale, cleanSegmentsResult, defaultLocale) => {
      const newPath =
        targetLocale === defaultLocale
          ? '/' + cleanSegmentsResult.join('/')
          : `/${targetLocale}/` + cleanSegmentsResult.join('/');
      return newPath.replace(/\/+/g, '/') + window.location.search + window.location.hash;
    },
  };
  return helper;
}
