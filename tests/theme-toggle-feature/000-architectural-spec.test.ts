import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  createMatchMediaMock,
  runAntiFlickerScript,
  TEST_CONFIG,
  yieldToEventLoop,
} from './theme-toggle.helpers';

describe('000: Architectural Specification Tests', () => {
  let matchMediaMock: ReturnType<typeof createMatchMediaMock>;
  const originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');

  beforeEach(() => {
    if (originalLocalStorageDescriptor) {
      Object.defineProperty(window, 'localStorage', originalLocalStorageDescriptor);
    }
    localStorage.clear();

    document.documentElement.removeAttribute(`data-${TEST_CONFIG.DATA_ATTRIBUTE}`);
    document.body.innerHTML = `
      <button class="theme-toggle" type="button" data-theme-toggle>
        <span aria-hidden="true"></span>
      </button>
    `;

    vi.restoreAllMocks();
  });

  describe('1. Kịch bản Khởi tạo & Ưu tiên (Initial Theme Selection Order)', () => {
    test('1.1. Lần đầu truy cập (localStorage trống) -> Đọc OS preference = dark', () => {
      matchMediaMock = createMatchMediaMock(true);
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockImplementation(() => matchMediaMock),
      );

      runAntiFlickerScript();
      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
    });

    test('1.2. Lần đầu truy cập (localStorage trống) -> Đọc OS preference = light', () => {
      matchMediaMock = createMatchMediaMock(false);
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockImplementation(() => matchMediaMock),
      );

      runAntiFlickerScript();
      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('light');
    });

    test('1.3. Khởi tạo khi localStorage = dark & OS = light -> localStorage ghi đè OS', () => {
      matchMediaMock = createMatchMediaMock(false);
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockImplementation(() => matchMediaMock),
      );
      localStorage.setItem(TEST_CONFIG.STORAGE_KEY, 'dark');

      runAntiFlickerScript();
      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
    });
  });

  describe('2. Graceful Degradation / RAM Fallback', () => {
    test('2.1. localStorage bị chặn SecurityError -> Anti-Flicker fallback về OS setting', async () => {
      matchMediaMock = createMatchMediaMock(true);
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockImplementation(() => matchMediaMock),
      );

      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new DOMException('Access denied', 'SecurityError');
        },
        configurable: true,
      });

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      runAntiFlickerScript();
      await yieldToEventLoop();

      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
      expect(warnSpy).toHaveBeenCalledWith(
        '[Theme Anti-Flicker] Storage access denied, fallback to OS setting.',
        expect.any(Error),
      );
    });

    test('2.2. localStorage.setItem bị chặn -> Toggle click sử dụng RAM fallback', async () => {
      matchMediaMock = createMatchMediaMock(false);
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockImplementation(() => matchMediaMock),
      );
      runAntiFlickerScript();

      await import('../../src/scripts/theme/theme-toggle');

      const realLocalStorage = window.localStorage;
      Object.defineProperty(window, 'localStorage', {
        get() {
          return {
            getItem: (key: string) => realLocalStorage.getItem(key),
            setItem: () => {
              throw new DOMException('Access denied', 'SecurityError');
            },
            removeItem: (key: string) => realLocalStorage.removeItem(key),
            clear: () => realLocalStorage.clear(),
            length: realLocalStorage.length,
            key: (index: number) => realLocalStorage.key(index),
          };
        },
        configurable: true,
      });

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const button = document.querySelector(TEST_CONFIG.TOGGLE_SELECTOR) as HTMLButtonElement;

      button.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await yieldToEventLoop();

      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
      expect(warnSpy).toHaveBeenCalledWith(
        '[Theme Toggle] Cannot write to localStorage. Using RAM fallback.',
        expect.any(Error),
      );
    });
  });

  describe('3. Kịch bản Đồng bộ Động (Live OS Scheme Syncing)', () => {
    test('3.1. Chưa chọn localStorage -> Tự đồng bộ thời gian thực khi OS đổi theme', async () => {
      matchMediaMock = createMatchMediaMock(false);
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockImplementation(() => matchMediaMock),
      );

      runAntiFlickerScript();
      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('light');

      matchMediaMock.dispatchOsChange(true);
      await yieldToEventLoop();

      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
    });

    test('3.2. Đã có localStorage -> Giữ nguyên trạng thái do user chọn khi OS đổi theme', async () => {
      matchMediaMock = createMatchMediaMock(false);
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockImplementation(() => matchMediaMock),
      );
      localStorage.setItem(TEST_CONFIG.STORAGE_KEY, 'light');

      runAntiFlickerScript();
      matchMediaMock.dispatchOsChange(true);
      await yieldToEventLoop();

      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('light');
    });
  });

  describe('4. Kịch bản Tương thích Astro ClientRouter (View Transitions)', () => {
    test('4.1. Sự kiện astro:after-swap khôi phục data-theme và giữ bộ lắng nghe click', async () => {
      matchMediaMock = createMatchMediaMock(false);
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockImplementation(() => matchMediaMock),
      );
      localStorage.setItem(TEST_CONFIG.STORAGE_KEY, 'dark');

      runAntiFlickerScript();
      await import('../../src/scripts/theme/theme-toggle');

      document.documentElement.removeAttribute(`data-${TEST_CONFIG.DATA_ATTRIBUTE}`);
      document.body.innerHTML = `
        <button class="theme-toggle-new" type="button" data-theme-toggle>
          <span class="icon"></span>
        </button>
      `;

      document.dispatchEvent(new Event('astro:after-swap'));
      await yieldToEventLoop();

      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');

      const newButton = document.querySelector(TEST_CONFIG.TOGGLE_SELECTOR) as HTMLButtonElement;
      newButton.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await yieldToEventLoop();

      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('light');
    });
  });
});
