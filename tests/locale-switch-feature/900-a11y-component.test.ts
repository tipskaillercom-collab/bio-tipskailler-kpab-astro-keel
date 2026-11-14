// @vitest-environment node

/**
 * File: tests/locale-switch-feature/900-a11y-component.test.ts
 * Mô tả: Kiểm thử Trợ năng (Accessibility - a11y) và Ngữ nghĩa HTML (Semantics) cho LocaleToggle.astro.
 */

import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import { Window } from 'happy-dom';
import LocaleToggle from '../../src/components/LocaleToggle.astro';

// Hàm helper parse HTML gọn gàng
const parseHTML = (html: string) => {
  const window = new Window();
  return new window.DOMParser().parseFromString(html, 'text/html');
};

describe('900: LocaleToggle Accessibility & Semantics Tests', () => {
  test('1.1. Render thẻ <button> chuẩn HTML5 với type="button" tường minh', async () => {
    // ARRANGE: Render component ra HTML string bằng AstroContainer
    const container = await AstroContainer.create();
    const html = await container.renderToString(LocaleToggle, {
      props: { label: 'Chuyển đổi ngôn ngữ' },
    });

    // ACT: Parse HTML string
    const doc = parseHTML(html);
    const button = doc.querySelector('[data-locale-toggle]');

    // ASSERT: Kiểm tra semantics và attributes
    expect(button).not.toBeNull();
    expect(button?.tagName.toLowerCase()).toBe('button');
    expect(button?.getAttribute('type')).toBe('button');
    expect(button?.getAttribute('aria-label')).toBe('Chuyển đổi ngôn ngữ');
  });

  test('1.2. Đồ họa SVG chứa aria-hidden="true" để ẩn khỏi Screen Reader', async () => {
    // ARRANGE: Render component
    const container = await AstroContainer.create();
    const html = await container.renderToString(LocaleToggle);

    // ACT & ASSERT: Thẻ SVG phải có aria-hidden="true"
    const doc = parseHTML(html);
    const svg = doc.querySelector('button svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  test('1.3. Render chính xác số lượng múi clipPath theo danh sách locales', async () => {
    // ARRANGE: Render component
    const container = await AstroContainer.create();
    const html = await container.renderToString(LocaleToggle);

    // ACT & ASSERT: Số thẻ clipPath match đúng 3 locales ('en', 'ja', 'vi')
    const doc = parseHTML(html);
    const clipPaths = doc.querySelectorAll('clipPath');
    expect(clipPaths.length).toBe(3);
  });
});
