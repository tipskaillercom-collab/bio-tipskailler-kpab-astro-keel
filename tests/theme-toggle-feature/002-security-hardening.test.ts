import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  createMatchMediaMock,
  runAntiFlickerScript,
  TEST_CONFIG,
  yieldToEventLoop,
} from './theme-toggle.helpers';

describe('002: Security Hardening & Threat Mitigation Tests', () => {
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

    const matchMediaMock = createMatchMediaMock(false);
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => matchMediaMock),
    );
  });

  describe('1. Denial of Service Mitigation (Storage Quota Exceeded)', () => {
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

  describe('2. Storage Tampering & Malformed Data Mitigation', () => {
    test('6.2. Tiêm nhiễm mã độc/script rác vào localStorage -> Anti-Flicker hạ cấp về giá trị hợp lệ', async () => {
      localStorage.setItem(TEST_CONFIG.STORAGE_KEY, '<script>alert("xss")</script>');

      runAntiFlickerScript();
      await yieldToEventLoop();

      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('light');
    });
  });

  describe('3. DOM Clobbering Isolation Test', () => {
    test('6.3. Chèn phần tử có id="theme" đè biến toàn cục -> Dataset truy vấn không bị sập', async () => {
      const clobberedDiv = document.createElement('div');
      clobberedDiv.id = 'theme';
      document.body.appendChild(clobberedDiv);

      runAntiFlickerScript();
      await import('../../src/scripts/theme/theme-toggle');

      const button = document.querySelector(TEST_CONFIG.TOGGLE_SELECTOR) as HTMLButtonElement;
      button.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await yieldToEventLoop();

      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
    });
  });
});
