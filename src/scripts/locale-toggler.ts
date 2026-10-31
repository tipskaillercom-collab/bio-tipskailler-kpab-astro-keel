import { createLocaleSwitchHelper } from '../lib/client-locale-switch';
import { navigate } from 'astro:transitions/client';
import { locales, locale as defaultLocale, type Locale } from '../i18n';

// Gán trực tiếp trình lắng nghe sự kiện click nút đổi ngôn ngữ
// bằng Event Delegation vào thẻ document toàn cục
document.addEventListener('click', (event) => {
  // Kiểm tra xem phần tử được click có chứa thuộc tính dữ liệu điều hướng đổi ngôn ngữ [data-locale-toggle] hay không
  if (!(event.target instanceof Element) || !event.target.closest('[data-locale-toggle]')) {
    return; // Nếu không phải nút đổi ngôn ngữ, bỏ qua hành động
  }

  // Khởi tạo bộ công cụ helper locale switch đầy đủ tính năng kết hợp cấu hình TypeScript
  // Không cần truyền namespaceName vì client script chạy độc lập bằng bộ biến import tĩnh
  const clientLocaleToggleHelper = createLocaleSwitchHelper();

  // Đọc dữ liệu URL hiện tại
  const segments = clientLocaleToggleHelper.getSegments();
  const isValidLocaleResult = clientLocaleToggleHelper.isValidLocale(segments[0], locales);
  const currentLocale = clientLocaleToggleHelper.getCurrentLocale(
    segments,
    isValidLocaleResult,
    defaultLocale,
  );

  // Tính toán xoay vòng danh sách ngôn ngữ để tìm ra ngôn ngữ tiếp theo (Ví dụ: en -> ja -> vi -> en)
  const currentIndex = locales.indexOf(currentLocale as Locale);
  const nextLocale: Locale = locales[(currentIndex + 1) % locales.length];

  // Lưu lựa chọn mới của người dùng vào bộ nhớ localStorage
  localStorage.setItem('locale', nextLocale);

  // Xây dựng URL đích mới tinh gọn (giữ nguyên query, hash)
  // Tự giấu tiền tố nếu nextLocale chính là defaultLocale)
  const cleanSegmentsResult = clientLocaleToggleHelper.cleanSegments(segments, isValidLocaleResult);
  const finalUrl = clientLocaleToggleHelper.buildPath(
    nextLocale,
    cleanSegmentsResult,
    defaultLocale,
  );

  // Chuyển trang mượt mà không tải lại toàn bộ tài nguyên nhờ cơ chế nội bộ
  // Single Page App của Astro View Transitions
  navigate(finalUrl);
});
