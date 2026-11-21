/**
 * File: src/scripts/locale-switch/init-locale-switch.ts
 * Mô tả: Server-side generator sinh script cấu hình và đính kèm bộ helper vào Window object.
 */

import { locales, locale as defaultLocale } from '../../i18n';
import { createLocaleSwitchHelpers } from '../../helpers/locale-switch/locale-switch';

/**
 * Sinh chuỗi script Javascript inline để gán bộ công cụ helper và cấu hình locale vào `window`
 * @param nsName Tên namespace đối tượng toàn cục trên window
 */
export function getLocaleHelpersScript(nsName: string): string {
  try {
    // Khởi tạo helper ở phía server để chuẩn bị chuyển đổi định dạng
    const helpers = createLocaleSwitchHelpers();
    const nsKey = nsName;

    // Ép toàn bộ logic các hàm thành chuỗi văn bản (String) để gán vào đối tượng toàn cục `window` trên trình duyệt
    return `
  window.__NS_ClientLocaleSwitchHelper = "${nsKey}";
  window.${nsKey} = window.${nsKey} || {};

  window.${nsKey}.getSegments = ${helpers.getSegments.toString()};
  window.${nsKey}.isValidLocale = ${helpers.isValidLocale.toString()};
  window.${nsKey}.getCurrentLocale = ${helpers.getCurrentLocale.toString()};
  window.${nsKey}.cleanSegments = ${helpers.cleanSegments.toString()};
  window.${nsKey}.buildPath = ${helpers.buildPath.toString()};

  window.${nsKey} = { helpers: window["${nsKey}"], locales: "${locales}", defaultLocale: "${defaultLocale}" };
`;
  } catch (error) {
    console.error('[Locale Switch Init] Lỗi khi tạo inline helper script:', error);
    return '';
  }
}
