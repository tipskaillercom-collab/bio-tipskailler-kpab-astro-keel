// Các hàm tiện ích xử lý URL và điều hướng ngôn ngữ ở phía Client (Trình duyệt)
export function createI18nHelper() {
  // === NOTE: Trong đoạn này cả server/client đều đọc được ====
  // code...
  // ===========================================================

  const helper = {
    // NOTE: Tại đây trở xuống, Phía Client đều không đọc được các giá trị, hàm hoặc bất cứ gì ở đoạn trên

    // Tách đường dẫn URL thành các phân đoạn mảng (Ví dụ: "/vi/posts/abc" -> ["vi", "posts", "abc"])
    getSegments: () => {
      return window.location.pathname.split('/').filter(Boolean);
    },

    // Kiểm tra xem chuỗi phân đoạn có độ dài bằng 2 và nằm trong danh sách ngôn ngữ hỗ trợ không
    isValidLocale: (seg, locales) => {
      return !!(seg && seg.length === 2 && locales.includes(seg));
    },

    // Xác định ngôn ngữ hiện tại của URL. Nếu phân đoạn đầu tiên hợp lệ thì trả về nó, ngược lại dùng mặc định hệ thống
    getCurrentLocale: (segments, isValidLocaleResult, defaultLocale) => {
      const firstSegment = segments[0];
      return segments.length > 0 && isValidLocaleResult ? firstSegment : defaultLocale;
    },

    // Loại bỏ mã ngôn ngữ khỏi mảng phân đoạn nếu URL đó đang chứa mã ngôn ngữ hợp lệ
    cleanSegments: (segments, isValidLocaleResult) => {
      const clean = [...segments];
      if (isValidLocaleResult) {
        clean.shift(); // Xóa phần tử đầu tiên (Ví dụ: ["vi", "about"] -> ["about"])
      }
      return clean;
    },

    // Xây dựng đường dẫn chuẩn SEO
    buildPath: (targetLocale, cleanSegmentsResult, defaultLocale) => {
      const newPath =
        targetLocale === defaultLocale
          ? '/' + cleanSegmentsResult.join('/') // Nếu là ngôn ngữ mặc định hệ thống: giấu tiền tố đi (Ví dụ: /about)
          : `/${targetLocale}/` + cleanSegmentsResult.join('/'); // Nếu là ngôn ngữ phụ: thêm tiền tố vào (Ví dụ: /vi/about)

      // Loại bỏ các ký tự gạch chéo lặp thừa (//) và ghép nối lại chuỗi query (?...) hoặc hash (#...) nguyên bản
      return newPath.replace(/\/+/g, '/') + window.location.search + window.location.hash;
    },
  };
  return helper;
}
