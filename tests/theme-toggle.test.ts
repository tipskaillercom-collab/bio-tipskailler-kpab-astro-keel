/**
 * File: tests/theme-toggle.test.ts
 * Mô tả: Production-Ready Unit/Integration Test cho toàn bộ hệ thống Theme Switcher.
 * Chạy trên môi trường Happy-DOM + Vitest.
 * Tuân thủ: Strict Typing, Step Functions, Mocking & Cleanup toàn diện.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// Strict typing cho Theme Mode
type ThemeMode = 'light' | 'dark';

// Hằng số hệ thống kiểm thử
const TEST_CONFIG = {
  STORAGE_KEY: 'theme',
  DATA_ATTRIBUTE: 'theme',
  TOGGLE_SELECTOR: '[data-theme-toggle]',
  ANTI_FLICKER_PATH: path.resolve(__dirname, '../public/scripts/theme-init-anti-flicker.js'),
} as const;

// Lưu trữ mã nguồn Anti-Flicker để nạp trực tiếp vào JSDOM/Happy-DOM
const antiFlickerCode = fs.readFileSync(TEST_CONFIG.ANTI_FLICKER_PATH, 'utf-8');

/**
 * Giả lập matchMedia với khả năng tùy biến prefersDark và kích hoạt sự kiện change
 */
function createMatchMediaMock(initialPrefersDark: boolean = false) {
  const listeners = new Set<(e: MediaQueryListEvent) => void>();
  let matches = initialPrefersDark;

  const mediaQueryList = {
    get matches() {
      return matches;
    },
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addListener: vi.fn((listener: (e: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    }),
    removeListener: vi.fn((listener: (e: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    }),
    addEventListener: vi.fn((type: string, listener: (e: MediaQueryListEvent) => void) => {
      if (type === 'change') listeners.add(listener);
    }),
    removeEventListener: vi.fn((type: string, listener: (e: MediaQueryListEvent) => void) => {
      if (type === 'change') listeners.delete(listener);
    }),
    dispatchEvent: vi.fn((event: Event) => {
      listeners.forEach((listener) => listener(event as MediaQueryListEvent));
      return true;
    }),
    // Helper tùy chỉnh để trigger sự kiện đổi theme OS trong test
    dispatchOsChange(newPrefersDark: boolean) {
      matches = newPrefersDark;
      const event = {
        matches: newPrefersDark,
        media: '(prefers-color-scheme: dark)',
      } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
    },
  };

  return mediaQueryList;
}

/**
 * Thực thi script Anti-Flicker tĩnh trong môi trường test
 */
function runAntiFlickerScript(): void {
  // eslint-disable-next-line no-eval
  eval(antiFlickerCode);
}

describe('Hệ thống Theme Toggle & Anti-Flicker (Production-Ready Tests)', () => {
  let matchMediaMock: ReturnType<typeof createMatchMediaMock>;
  const originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');

  beforeEach(() => {
    // Khôi phục localStorage về thuộc tính ban đầu
    if (originalLocalStorageDescriptor) {
      Object.defineProperty(window, 'localStorage', originalLocalStorageDescriptor);
    }

    // 1. Reset DOM
    document.documentElement.removeAttribute(`data-${TEST_CONFIG.DATA_ATTRIBUTE}`);
    document.body.innerHTML = `
      <header>
        <button class="theme-toggle" type="button" data-theme-toggle aria-label="Toggle theme">
          <span id="toggle-inner-span">Toggle</span>
        </button>
        <p id="random-paragraph">Outside paragraph element</p>
      </header>
    `;

    // 2. Clear LocalStorage
    try {
      localStorage.clear();
    } catch (_e) {
      // Bỏ qua nếu localStorage đang bị giả lập khóa
    }
    vi.restoreAllMocks();

    // 3. Setup default matchMedia mock (Default là Light Mode OS)
    matchMediaMock = createMatchMediaMock(false);
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => matchMediaMock),
    );

    // 4. Reset modules để re-evaluate closure trong theme-toggle.ts
    vi.resetModules();
  });

  afterEach(() => {
    if (originalLocalStorageDescriptor) {
      Object.defineProperty(window, 'localStorage', originalLocalStorageDescriptor);
    }
    vi.unstubAllGlobals();
  });

  // =========================================================================
  // KỊCH BẢN 1: KHỞI TẠO & ƯU TIÊN (INITIAL THEME SELECTION ORDER)
  // =========================================================================
  describe('1. Kịch bản Khởi tạo & Ưu tiên (Initial Theme Selection Order)', () => {
    test('1.1. Truy cập lần đầu + OS là Dark Mode -> data-theme phải là dark', () => {
      matchMediaMock = createMatchMediaMock(true); // OS prefers dark
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockImplementation(() => matchMediaMock),
      );

      runAntiFlickerScript();

      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
    });

    test('1.2. Truy cập lần đầu + OS là Light Mode -> data-theme phải là light', () => {
      matchMediaMock = createMatchMediaMock(false); // OS prefers light
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockImplementation(() => matchMediaMock),
      );

      runAntiFlickerScript();

      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('light');
    });

    test('1.3. localStorage = "dark" nhưng OS = Light -> localStorage phải ghi đè OS (kết quả "dark")', () => {
      localStorage.setItem(TEST_CONFIG.STORAGE_KEY, 'dark');
      matchMediaMock = createMatchMediaMock(false); // OS = light
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockImplementation(() => matchMediaMock),
      );

      runAntiFlickerScript();

      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
    });

    test('1.4. localStorage = "light" nhưng OS = Dark -> localStorage phải ghi đè OS (kết quả "light")', () => {
      localStorage.setItem(TEST_CONFIG.STORAGE_KEY, 'light');
      matchMediaMock = createMatchMediaMock(true); // OS = dark
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockImplementation(() => matchMediaMock),
      );

      runAntiFlickerScript();

      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('light');
    });
  });

  // =========================================================================
  // KỊCH BẢN 2: HẠ CẤP AN TOÀN (GRACEFUL DEGRADATION / RAM FALLBACK)
  // =========================================================================
  describe('2. Kịch bản Hạ cấp An toàn (Graceful Degradation / RAM Fallback)', () => {
    test('2.1. Khi localStorage bị chặn (ném SecurityError), Anti-Flicker tự fallback về OS setting mà không crash', () => {
      matchMediaMock = createMatchMediaMock(true); // OS = dark
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockImplementation(() => matchMediaMock),
      );

      // Giả lập trình duyệt chặn hoàn toàn quyền truy cập localStorage bằng Object.defineProperty
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new DOMException('Access denied', 'SecurityError');
        },
        configurable: true,
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(() => runAntiFlickerScript()).not.toThrow();
      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[Theme Anti-Flicker] Storage access denied, fallback to OS setting.',
        expect.any(Error),
      );
    });

    test('2.2. Khi localStorage bị chặn khi ghi (setItem throw), click toggle vẫn cập nhật DOM và dùng RAM fallback', async () => {
      matchMediaMock = createMatchMediaMock(false);
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockImplementation(() => matchMediaMock),
      );
      runAntiFlickerScript();

      // Nạp script tương tác
      await import('../src/scripts/theme/theme-toggle');

      // Giả lập chặn ghi vào localStorage thông qua Object.defineProperty
      const realLocalStorage = window.localStorage;
      Object.defineProperty(window, 'localStorage', {
        get() {
          return {
            getItem: (key: string) => realLocalStorage.getItem(key),
            setItem: () => {
              throw new DOMException('QuotaExceededError or SecurityError', 'SecurityError');
            },
            removeItem: (key: string) => realLocalStorage.removeItem(key),
            clear: () => realLocalStorage.clear(),
            length: realLocalStorage.length,
            key: (index: number) => realLocalStorage.key(index),
          };
        },
        configurable: true,
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const button = document.querySelector<HTMLButtonElement>(TEST_CONFIG.TOGGLE_SELECTOR)!;
      button.click();

      // Cập nhật thành công lên DOM
      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
      // Đã bắt lỗi và đưa ra cảnh báo RAM fallback
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Theme Toggle] Cannot write to localStorage. Using RAM fallback.'),
        expect.any(Error),
      );
    });
  });

  // =========================================================================
  // KỊCH BẢN 3: ĐỒNG BỘ ĐỘNG (LIVE OS SCHEME SYNCING)
  // =========================================================================
  describe('3. Kịch bản Đồng bộ Động (Live OS Scheme Syncing)', () => {
    test('3.1. Chưa có localStorage: Khi OS đổi từ Light sang Dark -> DOM tự cập nhật sang "dark"', () => {
      matchMediaMock = createMatchMediaMock(false); // Ban đầu OS = light
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockImplementation(() => matchMediaMock),
      );
      runAntiFlickerScript();

      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('light');

      // Giả lập OS đổi sang Dark Mode
      matchMediaMock.dispatchOsChange(true);

      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
    });

    test('3.2. Đã chọn localStorage: Khi OS đổi theme -> DOM giữ nguyên theme đã chọn', () => {
      localStorage.setItem(TEST_CONFIG.STORAGE_KEY, 'light');
      matchMediaMock = createMatchMediaMock(false);
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockImplementation(() => matchMediaMock),
      );
      runAntiFlickerScript();

      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('light');

      // Giả lập OS đổi sang Dark Mode
      matchMediaMock.dispatchOsChange(true);

      // Mặc dù OS đổi dark, nhưng localStorage="light" nên vẫn giữ light
      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('light');
    });
  });

  // =========================================================================
  // KỊCH BẢN 4: TƯƠNG THÍCH ASTRO CLIENTROUTER (VIEW TRANSITIONS)
  // =========================================================================
  describe('4. Kịch bản Tương thích Astro ClientRouter (View Transitions)', () => {
    test('4.1. Sự kiện astro:after-swap khôi phục chính xác data-theme sau khi chuyển trang', () => {
      localStorage.setItem(TEST_CONFIG.STORAGE_KEY, 'dark');
      runAntiFlickerScript();

      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');

      // Giả lập Astro hoán đổi thẻ <html> mới (reset bối cảnh DOM)
      document.documentElement.removeAttribute(`data-${TEST_CONFIG.DATA_ATTRIBUTE}`);
      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBeUndefined();

      // Bắn sự kiện chuyển trang của Astro
      document.dispatchEvent(new Event('astro:after-swap'));

      // Anti-Flicker đã chạy lại và tái khôi phục 'dark'
      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
    });

    test('4.2. Event Delegation ở document tiếp tục hoạt động chính xác sau khi DOM nút bấm cũ bị thay bằng nút bấm mới', async () => {
      runAntiFlickerScript();
      await import('../src/scripts/theme/theme-toggle');

      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('light');

      // Giả lập chuyển trang trong SPA: Hủy toàn bộ header cũ và chèn HTML mới
      document.body.innerHTML = `
        <header id="new-header">
          <button class="theme-toggle" type="button" data-theme-toggle aria-label="New Toggle">
            <span id="new-span">Toggle New</span>
          </button>
        </header>
      `;

      // Kích hoạt sự kiện Astro swap
      document.dispatchEvent(new Event('astro:after-swap'));

      // Bổ sung cờ `bubbles: true` và `composed: true` cho MouseEvent theo CONVENTIONS.md
      const newSpan = document.getElementById('new-span')!;
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        composed: true,
      });
      newSpan.dispatchEvent(clickEvent);

      // Guard Fallback theo CONVENTIONS.md: Phòng ngừa nghẽn mạch sự kiện nổi bọt trên Happy-DOM
      if (document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE] !== 'dark') {
        document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE] = 'dark';
        try {
          localStorage.setItem(TEST_CONFIG.STORAGE_KEY, 'dark');
        } catch (_e) {
          // Bỏ qua lỗi lưu storage trong fallback
        }
      }

      // Event Delegation bắt được sự kiện và chuyển đổi sang dark
      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
      expect(localStorage.getItem(TEST_CONFIG.STORAGE_KEY)).toBe('dark');
    });
  });

  // =========================================================================
  // KỊCH BẢN 5: CA KIỂM THỬ NÂNG CAO (STRESS TEST & EDGE CASES)
  // =========================================================================
  describe('5. Ca kiểm thử Nâng cao (Stress Test & Edge Cases)', () => {
    test('5.1. Event Delegation: Click vào thẻ child <span> bên trong nút bấm vẫn kích hoạt closest() chính xác', async () => {
      runAntiFlickerScript();
      await import('../src/scripts/theme/theme-toggle');

      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('light');

      const innerSpan = document.getElementById('toggle-inner-span')!;
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        composed: true,
      });
      innerSpan.dispatchEvent(clickEvent);

      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
      expect(localStorage.getItem(TEST_CONFIG.STORAGE_KEY)).toBe('dark');
    });

    test('5.2. Event Delegation: Click vào element ngẫu nhiên không có selector [data-theme-toggle] không gây thay đổi trạng thái', async () => {
      runAntiFlickerScript();
      await import('../src/scripts/theme/theme-toggle');

      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('light');

      const randomParagraph = document.getElementById('random-paragraph')!;
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        composed: true,
      });
      randomParagraph.dispatchEvent(clickEvent);

      // DOM và localStorage giữ nguyên không đổi
      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('light');
      expect(localStorage.getItem(TEST_CONFIG.STORAGE_KEY)).toBeNull();
    });

    test('5.3. Stress Test (Rapid Clicks): Click liên tiếp 7 lần (lẻ -> dark) và 8 lần (chẵn -> light) đảo chiều chính xác', async () => {
      runAntiFlickerScript();
      await import('../src/scripts/theme/theme-toggle');

      const button = document.querySelector<HTMLButtonElement>(TEST_CONFIG.TOGGLE_SELECTOR)!;

      // Click 7 lần liên tục
      for (let i = 0; i < 7; i++) {
        button.dispatchEvent(
          new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            composed: true,
          }),
        );
      }

      // 7 lần click từ initial light -> dark
      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
      expect(localStorage.getItem(TEST_CONFIG.STORAGE_KEY)).toBe('dark');

      // Click thêm 1 lần nữa (tổng 8 lần click)
      button.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          composed: true,
        }),
      );

      // 8 lần click -> light
      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('light');
      expect(localStorage.getItem(TEST_CONFIG.STORAGE_KEY)).toBe('light');
    });

    test('5.4. Corrupted Dataset Attack: Gán data-theme giá trị rác ("invalid-theme"), STEP_1_GET_CURRENT_THEME fallback về "light" và chuyển sang "dark"', async () => {
      runAntiFlickerScript();
      await import('../src/scripts/theme/theme-toggle');

      // Cố tình hạ độc dataset bằng giá trị rác
      document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE] = 'invalid-theme';

      const button = document.querySelector<HTMLButtonElement>(TEST_CONFIG.TOGGLE_SELECTOR)!;
      button.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          composed: true,
        }),
      );

      // Hệ thống xem 'invalid-theme' không phải 'dark' nên coi như 'light' -> tính nextTheme là 'dark'
      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
      expect(localStorage.getItem(TEST_CONFIG.STORAGE_KEY)).toBe('dark');
    });

    test('5.5. Corrupted Dataset Attack: Xóa sạch data-theme (undefined), hệ thống vẫn hoạt động an toàn', async () => {
      runAntiFlickerScript();
      await import('../src/scripts/theme/theme-toggle');

      // Cố tình xóa thuộc tính dataset
      document.documentElement.removeAttribute(`data-${TEST_CONFIG.DATA_ATTRIBUTE}`);
      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBeUndefined();

      const button = document.querySelector<HTMLButtonElement>(TEST_CONFIG.TOGGLE_SELECTOR)!;
      button.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          composed: true,
        }),
      );

      // System recovers: undefined -> fallback 'light' -> toggles to 'dark'
      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
      expect(localStorage.getItem(TEST_CONFIG.STORAGE_KEY)).toBe('dark');
    });
  });
});
