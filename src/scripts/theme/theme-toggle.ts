/**
 * File: src/scripts/theme/theme-toggle.ts
 * Mô tả: Script logic bắt sự kiện click đổi theme, tuân thủ Step Functions và Strict Typing.
 */

// Strict typing cho kiểu dữ liệu Theme
export type ThemeMode = 'light' | 'dark';

// Cấu hình hằng số đóng băng từ compile-time bằng `as const`
const THEME_TOGGLE_CONFIG = {
  STORAGE_KEY: 'theme',
  DATA_ATTRIBUTE: 'theme',
  TOGGLE_SELECTOR: '[data-theme-toggle]',
} as const;

// Biến bộ nhớ RAM dự phòng khi localStorage bị chặn
let fallbackRamThemeStorage: ThemeMode | null = null;

/**
 * STEP 1: Lấy theme hiện tại từ dataset thẻ <html>
 */
function STEP_1_GET_CURRENT_THEME(): ThemeMode {
  const currentTheme = document.documentElement.dataset[THEME_TOGGLE_CONFIG.DATA_ATTRIBUTE];
  return currentTheme === 'dark' ? 'dark' : 'light';
}

/**
 * STEP 2: Tính toán theme kế tiếp theo tư duy Immutability
 */
function STEP_2_CALCULATE_NEXT_THEME(currentTheme: ThemeMode): ThemeMode {
  return currentTheme === 'dark' ? 'light' : 'dark';
}

/**
 * STEP 3: Thực thi cập nhật DOM và lưu trữ an toàn (Graceful Degradation)
 */
function STEP_3_EXECUTE_THEME_UPDATE(nextTheme: ThemeMode): void {
  // Cập nhật DOM
  document.documentElement.dataset[THEME_TOGGLE_CONFIG.DATA_ATTRIBUTE] = nextTheme;

  // Thử lưu vào localStorage
  try {
    localStorage.setItem(THEME_TOGGLE_CONFIG.STORAGE_KEY, nextTheme);
  } catch (error) {
    console.warn('[Theme Toggle] Cannot write to localStorage. Using RAM fallback.', error);
    fallbackRamThemeStorage = nextTheme;
  }
}

// Bắt sự kiện Click trên toàn Document (Event Delegation)
document.addEventListener('click', (event: MouseEvent): void => {
  if (!(event.target instanceof Element)) return;

  const toggleButton = event.target.closest(THEME_TOGGLE_CONFIG.TOGGLE_SELECTOR);
  if (!toggleButton) return;

  const currentTheme = STEP_1_GET_CURRENT_THEME();
  const nextTheme = STEP_2_CALCULATE_NEXT_THEME(currentTheme);
  STEP_3_EXECUTE_THEME_UPDATE(nextTheme);
});

/**
 * Getter phục vụ kiểm thử (Testing) và kiểm tra trạng thái RAM Fallback
 */
export function getFallbackRamTheme(): ThemeMode | null {
  return fallbackRamThemeStorage;
}
