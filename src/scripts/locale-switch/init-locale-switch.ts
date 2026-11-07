import { locales, locale as defaultLocale } from '../../i18n';
import { createLocaleSwitchHelpers } from '../../helpers/locale-switch/locale-switch';

/**
 * Hàm trả về đoạn script chuỗi chứa các helper lựa chọn ngôn ngữ để gán vào window trên client
 */
export function getLocaleHelpersScript(nsName: string) {
  // Khởi tạo helper ở phía server để chuẩn bị chuyển đổi định dạng
  const helpers = createLocaleSwitchHelpers();
  const nsKey = nsName;

  // Ép toàn bộ logic các hàm thành chuỗi văn bản (String) để gán vào đối tượng toàn cục `window` trên trình duyệt
  const localeHelpersInlineScript = `
  window.__NS_ClientLocaleSwitchHelper = "${nsKey}";
  window.${nsKey} = window.${nsKey} || {};

  window.${nsKey}.getSegments = ${helpers.getSegments.toString()};
  window.${nsKey}.isValidLocale = ${helpers.isValidLocale.toString()};
  window.${nsKey}.getCurrentLocale = ${helpers.getCurrentLocale.toString()};
  window.${nsKey}.cleanSegments = ${helpers.cleanSegments.toString()};
  window.${nsKey}.buildPath = ${helpers.buildPath.toString()};

  window.${nsKey} = { helpers: window["${nsKey}"], locales: "${locales}", defaultLocale: "${defaultLocale}" };
`;

  return localeHelpersInlineScript;
}
