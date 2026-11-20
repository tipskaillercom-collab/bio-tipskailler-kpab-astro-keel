/**
 * File: src/helpers/locale-switch/locale-switch.js
 * Mô tả: Bộ tiện ích xử lý URL, bóc tách và tạo đường dẫn đa ngôn ngữ phía Client & Server.
 */

export function createLocaleSwitchHelpers() {
  // === NOTE: Trong đoạn này cả server/client đều đọc được ====
  // code...
  // ===========================================================

  const helpers = {
    // NOTE: Tại đây trở xuống, Phía Client đều không đọc được các giá trị, hàm hoặc bất cứ gì ở đoạn trên

    /**
     * Tách đường dẫn URL hiện tại thành mảng các phân đoạn (segments)
     * Đầu ra: Mảng các chuỗi đại diện cho từng cấp đường dẫn (ví dụ: ["vi", "about"])
     */
    getSegments: () => {
      return window.location.pathname.split('/').filter(Boolean);
    },

    /**
     * Kiểm tra một phân đoạn đường dẫn có phải là mã ngôn ngữ hợp lệ hay không
     * Đầu vào: seg (chuỗi phân đoạn), locales (danh sách ngôn ngữ hỗ trợ)
     */
    isValidLocale: (seg, locales) => {
      return !!(seg && seg.length === 2 && locales.includes(seg));
    },

    /**
     * STEP 1: Xác định mã ngôn ngữ hiện tại của trang dựa trên URL
     */
    getCurrentLocale: (pathSegments, hasLocalePrefix, defaultLocale) => {
      const firstSegment = pathSegments[0];
      return pathSegments.length > 0 && hasLocalePrefix ? firstSegment : defaultLocale;
    },

    /**
     * STEP 2: Loại bỏ mã ngôn ngữ khỏi danh sách phân đoạn nếu URL có chứa tiền tố locale
     */
    cleanSegments: (pathSegments, hasLocalePrefix) => {
      const clean = [...pathSegments];
      if (hasLocalePrefix) {
        clean.shift();
      }
      return clean;
    },

    /**
     * STEP 3: Xây dựng đường dẫn URL đích chuẩn SEO kết hợp Query và Hash
     */
    buildPath: (preferredLocale, cleanSegments, defaultLocale) => {
      const newPath =
        preferredLocale === defaultLocale
          ? '/' + cleanSegments.join('/') // Nếu là ngôn ngữ mặc định hệ thống: giấu tiền tố đi (Ví dụ: /about)
          : `/${preferredLocale}/` + cleanSegments.join('/'); // Nếu là ngôn ngữ phụ: thêm tiền tố vào (Ví dụ: /vi/about)

      // Loại bỏ các ký tự gạch chéo lặp thừa (//) và ghép nối lại chuỗi query (?...) hoặc hash (#...) nguyên bản
      return newPath.replace(/\/+/g, '/') + window.location.search + window.location.hash;
    },
  };
  return helpers;
}
