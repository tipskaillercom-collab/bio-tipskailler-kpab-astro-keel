import { navigate } from 'astro:transitions/client';
import { locales, locale as defaultLocale, type Locale } from '../../i18n';
import { createLocaleSwitchHelpers } from '../../helpers/locale-switch/locale-switch';

// Mở rộng interface Window toàn cục để TypeScript nhận diện biến fallback
declare global {
  interface Window {
    __FALLBACK_LOCALE?: Locale;
  }
}

// Gán trực tiếp trình lắng nghe sự kiện click nút đổi ngôn ngữ
// bằng Event Delegation vào thẻ document toàn cục
document.addEventListener('click', (event) => {
  // STEP 1: Kiểm tra phần tử mục tiêu kích hoạt (Event Target Guard)
  STEP_1_VALIDATE_TARGET: {
    // Kiểm tra xem phần tử được click có chứa thuộc tính dữ liệu điều hướng đổi ngôn ngữ [data-locale-toggle] hay không
    const isToggleElement =
      event.target instanceof Element && !!event.target.closest('[data-locale-toggle]');
    if (!isToggleElement) {
      // Nếu không phải nút đổi ngôn ngữ, bỏ qua hành động
      return; // Bỏ qua nếu không phải nút đổi ngôn ngữ
    }
  }

  // Khai báo các biến trạng thái trung gian giữa các bước
  let nextLocale: Locale;
  let targetUrl: string;
  // Khởi tạo bộ công cụ helper locale switch đầy đủ tính năng kết hợp cấu hình TypeScript
  // Không cần truyền namespaceName vì client script chạy độc lập bằng bộ biến import tĩnh
  const helpers = createLocaleSwitchHelpers();

  // Đọc dữ liệu URL hiện tại
  const pathSegments = helpers.getSegments();
  const hasLocalePrefix = helpers.isValidLocale(pathSegments[0], locales);

  // STEP 2: Xác định ngôn ngữ hiển thị hiện tại và ngôn ngữ tiếp theo trong danh sách xoay vòng
  STEP_2_DETERMINE_NEXT_LOCALE: {
    const currentLocale = helpers.getCurrentLocale(pathSegments, hasLocalePrefix, defaultLocale);
    // Tính toán xoay vòng danh sách ngôn ngữ để tìm ra ngôn ngữ tiếp theo (Ví dụ: en -> ja -> vi -> en)
    const currentIndex = locales.indexOf(currentLocale as Locale);
    nextLocale = locales[(currentIndex + 1) % locales.length];
  }

  // STEP 3: Lưu trữ cài đặt ngôn ngữ mới vào LocalStorage và xây dựng URL đích
  STEP_3_PREPARE_TARGET_URL: {
    try {
      // Lưu lựa chọn mới của người dùng vào bộ nhớ localStorage
      localStorage.setItem('locale', nextLocale);
    } catch {
      // Bỏ qua lỗi nếu trình duyệt chặn localStorage (chế độ ẩn danh, chặn cookie, đầy bộ nhớ...)
      // để quá trình chuyển trang ở bước sau vẫn diễn ra bình thường
    }
    // localStorage.setItem('locale', nextLocale);

    // Xây dựng URL đích mới tinh gọn (giữ nguyên query, hash)
    // Tự giấu tiền tố nếu nextLocale chính là defaultLocale)
    const cleanSegments = helpers.cleanSegments(pathSegments, hasLocalePrefix);
    targetUrl = helpers.buildPath(nextLocale, cleanSegments, defaultLocale);
  }

  // STEP 4: Điều hướng trang mượt mà thông qua Astro View Transitions
  STEP_4_NAVIGATE: {
    window.__FALLBACK_LOCALE = nextLocale;
    // Chuyển trang mượt mà không tải lại toàn bộ tài nguyên nhờ cơ chế nội bộ
    // Single Page App của Astro View Transitions
    navigate(targetUrl);
  }
});
