// @vitest-environment node

/**
 * File: tests/locale-switch-feature/900-a11y-component.test.ts
 * Mô tả: Kiểm thử Trợ năng (Accessibility - a11y) và Ngữ nghĩa HTML (Semantics) cho LocaleToggle.astro.
 */

import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import { Window } from 'happy-dom';
import LocaleToggle from '../../src/components/LocaleToggle.astro';

// Hàm helper parse HTML chuẩn ngữ cảnh Happy-DOM Window
const parseHTML = (html: string) => {
  const window = new Window();
  return new window.DOMParser().parseFromString(html, 'text/html');
};

describe('900: LocaleToggle Accessibility & Semantics Tests', () => {
  test('1.1. Render thẻ <button> chuẩn HTML5 với type="button" tường minh', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(LocaleToggle, {
      props: { label: 'Chuyển đổi ngôn ngữ' },
    });

    const doc = parseHTML(html);
    const button = doc.querySelector('[data-locale-toggle]');

    expect(button).not.toBeNull();
    expect(button?.tagName.toLowerCase()).toBe('button');
    expect(button?.getAttribute('type')).toBe('button');
    expect(button?.getAttribute('aria-label')).toBe('Chuyển đổi ngôn ngữ');
  });

  test('1.2. Đồ họa SVG chứa aria-hidden="true" để ẩn khỏi Screen Reader', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(LocaleToggle);

    const doc = parseHTML(html);
    const svg = doc.querySelector('button svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  test('1.3. Render chính xác số lượng múi clipPath theo danh sách locales', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(LocaleToggle);

    const doc = parseHTML(html);
    const clipPaths = doc.querySelectorAll('clipPath');
    expect(clipPaths.length).toBe(3);
  });
});
