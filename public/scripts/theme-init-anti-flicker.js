/**
 * File: public/scripts/theme-init-anti-flicker.js
 * Mô tả: Script tĩnh thực thi đồng bộ trước khi trình duyệt render giao diện (Anti-Flicker).
 */

(() => {
  // Cấu hình hằng số hệ thống
  const STORAGE_KEY = 'theme';
  const DATA_ATTRIBUTE = 'theme';

  // STEP 1: Đọc trạng thái và gán data-theme lên <html>
  const STEP_1_APPLY_INITIAL_THEME = () => {
    try {
      // 1. Kiểm tra theme đã lưu trong localStorage
      const storedTheme = localStorage.getItem(STORAGE_KEY);
      // 2. Kiểm tra cấu hình màu của Hệ điều hành
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      // 3. Ưu tiên: localStorage -> OS preference -> 'light'
      const theme = storedTheme || (prefersDark ? 'dark' : 'light');
      // 4. Gán attribute trực tiếp lên HTML root element
      document.documentElement.dataset[DATA_ATTRIBUTE] = theme;
    } catch (error) {
      // Graceful Degradation: Fallback về OS setting nếu localStorage bị cấm
      console.warn('[Theme Anti-Flicker] Storage access denied, fallback to OS setting.', error);
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.dataset[DATA_ATTRIBUTE] = prefersDark ? 'dark' : 'light';
    }
  };

  // STEP 2: Thực thi ngay lập tức trước First Paint
  STEP_1_APPLY_INITIAL_THEME();

  // STEP 3: Lắng nghe sự kiện hoán đổi trang trong Astro (View Transitions)
  document.addEventListener('astro:after-swap', STEP_1_APPLY_INITIAL_THEME);

  // STEP 4: Lắng nghe sự kiện đổi theme trên Hệ điều hành nếu chưa thiết lập localStorage
  try {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleOsThemeChange = (e) => {
      try {
        if (!localStorage.getItem(STORAGE_KEY)) {
          document.documentElement.dataset[DATA_ATTRIBUTE] = e.matches ? 'dark' : 'light';
        }
      } catch (_err) {
        document.documentElement.dataset[DATA_ATTRIBUTE] = e.matches ? 'dark' : 'light';
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleOsThemeChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleOsThemeChange);
    }
  } catch (error) {
    console.warn('[Theme Anti-Flicker] matchMedia listener setup failed.', error);
  }
})();
