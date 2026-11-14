/**
 * File: public/scripts/theme-init-anti-flicker.js
 * Mô tả: Script tĩnh thực thi đồng bộ trước khi trình duyệt render giao diện (Anti-Flicker).
 */

(() => {
  // Cấu hình hằng số hệ thống
  const STORAGE_KEY = 'theme';
  const DATA_ATTRIBUTE = 'theme';
  const VALID_THEMES = ['light', 'dark'];

  // Lấy trạng thái dark mode từ Hệ điều hành
  const getOSPreference = () =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  // Hàm kiểm tra giá trị theme có nằm trong danh sách cho phép hay không
  const getValidatedStoredTheme = () => {
    const storedTheme = localStorage.getItem(STORAGE_KEY);
    return VALID_THEMES.includes(storedTheme) ? storedTheme : null;
  };

  // STEP 1: Đọc trạng thái và gán data-theme lên <html>
  const STEP_1_APPLY_INITIAL_THEME = () => {
    try {
      // 1. Chỉ chấp nhận theme hợp lệ ('light' hoặc 'dark') từ localStorage
      const validStoredTheme = getValidatedStoredTheme();
      // 2. Ưu tiên: validStoredTheme -> OS preference ('light' | 'dark')
      const theme = validStoredTheme || getOSPreference();
      // 3. Gán attribute trực tiếp lên HTML root element
      document.documentElement.dataset[DATA_ATTRIBUTE] = theme;
    } catch (error) {
      // Graceful Degradation: Fallback về OS setting nếu localStorage bị cấm
      console.warn('[Theme Anti-Flicker] Storage access denied, fallback to OS setting.', error);
      document.documentElement.dataset[DATA_ATTRIBUTE] = getOSPreference();
    }
  };

  // STEP 2: Thực thi ngay lập tức trước First Paint
  STEP_1_APPLY_INITIAL_THEME();

  // STEP 3: Lắng nghe sự kiện hoán đổi trang trong Astro (View Transitions)
  document.addEventListener('astro:after-swap', STEP_1_APPLY_INITIAL_THEME);

  // STEP 4: Lắng nghe sự kiện đổi theme trên Hệ điều hành nếu chưa có theme hợp lệ trong localStorage
  try {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    mediaQuery.addEventListener('change', (e) => {
      try {
        if (!getValidatedStoredTheme()) {
          document.documentElement.dataset[DATA_ATTRIBUTE] = e.matches ? 'dark' : 'light';
        }
      } catch (_err) {
        document.documentElement.dataset[DATA_ATTRIBUTE] = e.matches ? 'dark' : 'light';
      }
    });
  } catch (error) {
    console.warn('[Theme Anti-Flicker] matchMedia listener setup failed.', error);
  }
})();
