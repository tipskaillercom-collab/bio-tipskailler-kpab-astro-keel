import { locales, locale as defaultLocale } from '../../i18n';
import { createLocaleSwitchHelpers } from '../../helpers/locale-switch/locale-switch';

/**
 * Hàm trả về đoạn script chuỗi chứa các helper lựa chọn ngôn ngữ để gán vào window trên client
 */
export function clientLocaleSwitchHelpersScript(nsName: string) {
  // Khởi tạo helper ở phía server để chuẩn bị chuyển đổi định dạng
  const localeSwitchHelpers = createLocaleSwitchHelpers();
  const NS_ClientLocaleSwitchHelper = nsName;

  // Ép toàn bộ logic các hàm thành chuỗi văn bản (String) để gán vào đối tượng toàn cục `window` trên trình duyệt
  const clientLocalSwitchHelpers = `
  window.__NS_ClientLocaleSwitchHelper = "${NS_ClientLocaleSwitchHelper}";
  window.${NS_ClientLocaleSwitchHelper} = window.${NS_ClientLocaleSwitchHelper} || {};

  window.${NS_ClientLocaleSwitchHelper}.getSegments = ${localeSwitchHelpers.getSegments.toString()};
  window.${NS_ClientLocaleSwitchHelper}.isValidLocale = ${localeSwitchHelpers.isValidLocale.toString()};
  window.${NS_ClientLocaleSwitchHelper}.getCurrentLocale = ${localeSwitchHelpers.getCurrentLocale.toString()};
  window.${NS_ClientLocaleSwitchHelper}.cleanSegments = ${localeSwitchHelpers.cleanSegments.toString()};
  window.${NS_ClientLocaleSwitchHelper}.buildPath = ${localeSwitchHelpers.buildPath.toString()};

  window.${NS_ClientLocaleSwitchHelper} = {${NS_ClientLocaleSwitchHelper}: window["${NS_ClientLocaleSwitchHelper}"], locales: "${locales}", defaultLocale: "${defaultLocale}"};
`;

  return clientLocalSwitchHelpers;
}
