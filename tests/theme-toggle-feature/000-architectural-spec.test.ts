/**
 * File: tests/theme-toggle-feature/000-architectural-spec.test.ts
 * Mô tả: Kiểm thử đặc tả kiến trúc hệ thống Theme Toggle.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const TEST_CONFIG = {
  STORAGE_KEY: 'theme',
  DATA_ATTRIBUTE: 'theme',
  TOGGLE_SELECTOR: '[data-theme-toggle]',
  ANTI_FLICKER_PATH: path.resolve(__dirname, '../../public/scripts/theme-init-anti-flicker.js'),
} as const;

const antiFlickerCode = fs.readFileSync(TEST_CONFIG.ANTI_FLICKER_PATH, 'utf-8');

function createMatchMediaMock(initialPrefersDark: boolean = false) {
  const listeners = new Set<(e: MediaQueryListEvent) => void>();
  let matches = initialPrefersDark;

  return {
    get matches() {
      return matches;
    },
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addListener: vi.fn((listener: (e: MediaQueryListEvent) => void) => listeners.add(listener)),
    removeListener: vi.fn((listener: (e: MediaQueryListEvent) => void) =>
      listeners.delete(listener),
    ),
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
    dispatchOsChange(newPrefersDark: boolean) {
      matches = newPrefersDark;
      const event = {
        matches: newPrefersDark,
        media: '(prefers-color-scheme: dark)',
      } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
    },
  };
}

function runAntiFlickerScript(): void {
  // eslint-disable-next-line no-eval
  eval(antiFlickerCode);
}

async function yieldToEventLoop(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('000: Architectural Specification Tests', () => {
  let matchMediaMock: ReturnType<typeof createMatchMediaMock>;
  const originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');

  beforeEach(() => {
    if (originalLocalStorageDescriptor) {
      Object.defineProperty(window, 'localStorage', originalLocalStorageDescriptor);
    }
    document.documentElement.removeAttribute(`data-${TEST_CONFIG.DATA_ATTRIBUTE}`);
    document.body.innerHTML = `
      <header>
        <button class="theme-toggle" type="button" data-theme-toggle aria-label="Toggle theme">
          <span>Toggle</span>
        </button>
      </header>
    `;
    try {
      localStorage.clear();
    } catch (_e) {}
    vi.restoreAllMocks();
    matchMediaMock = createMatchMediaMock(false);
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => matchMediaMock),
    );
    vi.resetModules();
  });

  afterEach(() => {
    if (originalLocalStorageDescriptor) {
      Object.defineProperty(window, 'localStorage', originalLocalStorageDescriptor);
    }
    vi.unstubAllGlobals();
  });

  describe('1. Initial Theme Selection Order', () => {
    test('1.1. Truy cập lần đầu + OS Dark Mode -> data-theme = "dark"', async () => {
      matchMediaMock = createMatchMediaMock(true);
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockImplementation(() => matchMediaMock),
      );

      runAntiFlickerScript();
      await yieldToEventLoop();

      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
    });

    test('1.2. Truy cập lần đầu + OS Light Mode -> data-theme = "light"', async () => {
      matchMediaMock = createMatchMediaMock(false);
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockImplementation(() => matchMediaMock),
      );

      runAntiFlickerScript();
      await yieldToEventLoop();

      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('light');
    });

    test('1.3. localStorage = "dark" & OS = Light -> localStorage ghi đè OS', async () => {
      localStorage.setItem(TEST_CONFIG.STORAGE_KEY, 'dark');
      matchMediaMock = createMatchMediaMock(false);
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockImplementation(() => matchMediaMock),
      );

      runAntiFlickerScript();
      await yieldToEventLoop();

      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
    });

    test('1.4. localStorage = "light" & OS = Dark -> localStorage ghi đè OS', async () => {
      localStorage.setItem(TEST_CONFIG.STORAGE_KEY, 'light');
      matchMediaMock = createMatchMediaMock(true);
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockImplementation(() => matchMediaMock),
      );

      runAntiFlickerScript();
      await yieldToEventLoop();

      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('light');
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

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(() => runAntiFlickerScript()).not.toThrow();
      await yieldToEventLoop();

      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
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

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const button = document.querySelector<HTMLButtonElement>(TEST_CONFIG.TOGGLE_SELECTOR)!;
      button.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
          composed: true,
          cancelable: true,
        }),
      );

      await yieldToEventLoop();

      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Theme Toggle] Cannot write to localStorage. Using RAM fallback.'),
        expect.any(Error),
      );
    });
  });

  describe('3. Live OS Scheme Syncing', () => {
    test('3.1. Chưa có localStorage -> OS đổi theme tự động cập nhật DOM', async () => {
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

    test('3.2. Đã chọn localStorage -> OS đổi theme giữ nguyên trạng thái đã lưu', async () => {
      localStorage.setItem(TEST_CONFIG.STORAGE_KEY, 'light');
      matchMediaMock = createMatchMediaMock(false);
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockImplementation(() => matchMediaMock),
      );
      runAntiFlickerScript();

      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('light');

      matchMediaMock.dispatchOsChange(true);
      await yieldToEventLoop();

      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('light');
    });
  });

  describe('4. Astro ClientRouter Compatibility', () => {
    test('4.1. Sự kiện astro:after-swap khôi phục data-theme', async () => {
      localStorage.setItem(TEST_CONFIG.STORAGE_KEY, 'dark');
      runAntiFlickerScript();

      document.documentElement.removeAttribute(`data-${TEST_CONFIG.DATA_ATTRIBUTE}`);
      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBeUndefined();

      document.dispatchEvent(new Event('astro:after-swap'));
      await yieldToEventLoop();

      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
    });

    test('4.2. Event Delegation duy trì sau khi nút bấm bị thay mới trong DOM', async () => {
      runAntiFlickerScript();
      await import('../../src/scripts/theme/theme-toggle');

      document.body.innerHTML = `
        <header>
          <button class="theme-toggle" type="button" data-theme-toggle>
            <span id="new-span">New Button</span>
          </button>
        </header>
      `;

      document.dispatchEvent(new Event('astro:after-swap'));

      const newSpan = document.getElementById('new-span')!;
      newSpan.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
          composed: true,
          cancelable: true,
        }),
      );

      await yieldToEventLoop();

      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
      expect(localStorage.getItem(TEST_CONFIG.STORAGE_KEY)).toBe('dark');
    });
  });
});
