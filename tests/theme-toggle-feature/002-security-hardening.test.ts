/**
 * File: tests/theme-toggle-feature/002-security-hardening.test.ts
 * Mô tả: Kiểm thử bảo mật nâng cao và giảm thiểu đe dọa cho hệ thống Theme Toggle.
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

function runAntiFlickerScript(): void {
  // eslint-disable-next-line no-eval
  eval(antiFlickerCode);
}

async function yieldToEventLoop(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('002: Security Hardening & Threat Mitigation Tests', () => {
  const originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');

  beforeEach(() => {
    if (originalLocalStorageDescriptor) {
      Object.defineProperty(window, 'localStorage', originalLocalStorageDescriptor);
    }
    document.documentElement.removeAttribute(`data-${TEST_CONFIG.DATA_ATTRIBUTE}`);
    document.body.innerHTML = `
      <button class="theme-toggle" type="button" data-theme-toggle>
        <span>Toggle</span>
      </button>
    `;
    try {
      localStorage.clear();
    } catch (_e) {}
    vi.restoreAllMocks();
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => ({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    vi.resetModules();
  });

  afterEach(() => {
    if (originalLocalStorageDescriptor) {
      Object.defineProperty(window, 'localStorage', originalLocalStorageDescriptor);
    }
    vi.unstubAllGlobals();
  });

  test('6.1. Storage Quota Exceeded: Bắt QuotaExceededError và sử dụng mượt RAM Fallback', async () => {
    runAntiFlickerScript();
    await import('../../src/scripts/theme/theme-toggle');

    const realLocalStorage = window.localStorage;
    Object.defineProperty(window, 'localStorage', {
      get() {
        return {
          getItem: (key: string) => realLocalStorage.getItem(key),
          setItem: () => {
            throw new DOMException('QuotaExceededError', 'QuotaExceededError');
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

  test('6.2. Storage Tampering: Tiêm script độc vào localStorage -> Khởi tạo an toàn và vô hiệu hóa mã độc', async () => {
    localStorage.setItem(TEST_CONFIG.STORAGE_KEY, '<script>alert(1)</script>');

    runAntiFlickerScript();
    await yieldToEventLoop();

    const currentTheme = document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE];
    expect(['light', 'dark'].includes(currentTheme as string)).toBe(true);

    await import('../../src/scripts/theme/theme-toggle');
    const button = document.querySelector<HTMLButtonElement>(TEST_CONFIG.TOGGLE_SELECTOR)!;
    button.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        composed: true,
        cancelable: true,
      }),
    );

    await yieldToEventLoop();

    expect(
      ['light', 'dark'].includes(
        document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE] as string,
      ),
    ).toBe(true);
    expect(
      ['light', 'dark'].includes(localStorage.getItem(TEST_CONFIG.STORAGE_KEY) as string),
    ).toBe(true);
  });

  test('6.3. DOM Clobbering: Miễn nhiễm trước phần tử HTML có id="theme"', async () => {
    const clobberDiv = document.createElement('div');
    clobberDiv.id = 'theme';
    document.body.appendChild(clobberDiv);

    runAntiFlickerScript();
    await import('../../src/scripts/theme/theme-toggle');

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
  });
});
