/**
 * File: public/scripts/locale-switch-anti-flicker.js
 * Mô tả: Script tĩnh thực thi đồng bộ tại <head> chống giật/nhấp nháy sai ngôn ngữ (Anti-Flicker).
 */

(() => {
  const LOG_PREFIX = '[Locale Anti-Flicker]';

  // Storage wrapper hỗ trợ hạ cấp an toàn (Graceful Degradation)
  const safeGetLocale = () => {
    try {
      return localStorage.getItem('locale') || window.__FALLBACK_LOCALE || null;
    } catch (error) {
      console.warn(`${LOG_PREFIX} Không thể đọc localStorage, hạ cấp dùng RAM fallback:`, error);
      return window.__FALLBACK_LOCALE || null;
    }
  };

  const safeSetLocale = (locale) => {
    window.__FALLBACK_LOCALE = locale; // Luôn giữ bản sao trên RAM cho phiên hiện tại
    try {
      localStorage.setItem('locale', locale);
    } catch (error) {
      console.warn(`${LOG_PREFIX} Không thể ghi localStorage:`, error);
    }
  };

  // STEP 1: Lấy đối tượng cấu hình từ window
  // Lấy bộ công cụ helper từ đối tượng window toàn cục
  const STEP_1_GET_CONFIG = () => {
    const nsKey = window.__NS_ClientLocaleSwitchHelper;
    const nsConfig = window[nsKey];
    if (!nsConfig || !nsConfig.helpers) {
      console.warn(`${LOG_PREFIX} Không tìm thấy cấu hình helper trên window.`);
      return null;
    }
    return nsConfig;
  };

  // STEP 2: Xử lý chuẩn hóa tiền tố dư thừa của ngôn ngữ mặc định (SEO Guard)
  // Xử lý chuẩn hóa URL khi URL chứa mã ngôn ngữ trùng với ngôn ngữ hệ thống mặc định
  const STEP_2_HANDLE_REDUNDANT_PREFIX = ({
    hasLocalePrefix,
    pathSegments,
    defaultLocale,
    helpers,
  }) => {
    if (!hasLocalePrefix || pathSegments[0] !== defaultLocale) {
      return false;
    }
    // Đồng bộ lại bộ nhớ hệ thống về ngôn ngữ mặc định này
    safeSetLocale(defaultLocale);
    // Bóc tách chữ tiền tố thừa đó ra (Ví dụ: bỏ "ja" ra khỏi ["ja", "about"] thành ["about"])
    const cleanSegments = helpers.cleanSegments(pathSegments, true);
    // Tạo dựng URL sạch không chứa tiền tố trùng lặp mặc định
    const canonicalUrl = helpers.buildPath(defaultLocale, cleanSegments, defaultLocale);
    // Điều hướng ngay lập tức về trang sạch chuẩn SEO (://domain.com) và dừng tiến trình
    window.location.href = canonicalUrl;
    return true; // Đã thực hiện điều hướng
  };

  // STEP 3: Xác định ngôn ngữ ưu tiên (localStorage -> Browser Language -> Default)
  const STEP_3_DETERMINE_PREFERRED_LOCALE = (savedLocale, locales, defaultLocale) => {
    if (savedLocale && locales.includes(savedLocale)) {
      return savedLocale;
    }
    const browserLang = (navigator.language || navigator.userLanguage || '').split('-')[0];
    if (locales.includes(browserLang)) {
      return browserLang;
    }
    return defaultLocale;
  };

  // STEP 4: Chuyển hướng nếu lệch pha ngôn ngữ URL với preferredLocale
  // Kiểm tra sự lệch pha giữa ngôn ngữ đích và ngôn ngữ hiển thị trên URL hiện tại
  const STEP_4_HANDLE_LOCALE_MISMATCH = ({
    preferredLocale,
    currentLocale,
    pathSegments,
    hasLocalePrefix,
    defaultLocale,
    helpers,
  }) => {
    if (preferredLocale === currentLocale) {
      return false;
    }
    // Cập nhật bộ nhớ hệ thống theo ngôn ngữ đích mới
    safeSetLocale(preferredLocale);
    // Tiến hành làm sạch mảng phân đoạn URL cũ
    const cleanSegments = helpers.cleanSegments(pathSegments, hasLocalePrefix);
    // Tạo dựng URL đích mới phù hợp với cấu hình (Nếu bằng defaultLocale sẽ tự động giấu đi)
    const targetUrl = helpers.buildPath(preferredLocale, cleanSegments, defaultLocale);
    // Điều hướng sang trang đích và dừng tiến trình để chờ tải trang mới
    window.location.href = targetUrl;
    return true; // Đã thực hiện điều hướng
  };

  // STEP 5: Cập nhật DOM và trạng thái lưu trữ
  const STEP_5_SYNC_LOCALE_STATE = (currentLocale) => {
    // Nếu URL đã trùng khớp hoàn hảo với ngôn ngữ đích, đồng bộ giá trị chuẩn vào bộ nhớ lưu trữ
    safeSetLocale(currentLocale);
    // Đính thuộc tính dữ liệu data-locale vào thẻ <html> để CSS/JS khác nhận diện điều khiển UI giao diện
    document.documentElement.dataset.locale = currentLocale;
  };

  // Main Orchestrator
  const applyLocale = () => {
    const config = STEP_1_GET_CONFIG();
    if (!config) return;

    const { helpers, locales, defaultLocale } = config;
    // Thực hiện phân rã các thông số URL hiện tại
    const pathSegments = helpers.getSegments();
    const savedLocale = safeGetLocale();
    // Kiểm tra xem phân đoạn đầu tiên của URL có phải là mã ngôn ngữ hợp lệ hay không
    const hasLocalePrefix = helpers.isValidLocale(pathSegments[0], locales);
    // Lấy ra ngôn ngữ thực tế của URL (nếu URL không có tiền tố, hàm trả về defaultLocale)
    const currentLocale = helpers.getCurrentLocale(pathSegments, hasLocalePrefix, defaultLocale);

    if (STEP_2_HANDLE_REDUNDANT_PREFIX({ hasLocalePrefix, pathSegments, defaultLocale, helpers }))
      return;

    const preferredLocale = STEP_3_DETERMINE_PREFERRED_LOCALE(savedLocale, locales, defaultLocale);

    if (
      STEP_4_HANDLE_LOCALE_MISMATCH({
        preferredLocale,
        currentLocale,
        pathSegments,
        hasLocalePrefix,
        defaultLocale,
        helpers,
      })
    )
      return;

    STEP_5_SYNC_LOCALE_STATE(currentLocale);
  };

  // Kích hoạt bộ lọc định tuyến ngay khi phân tích cú pháp mã HTML đầu tiên nhằm chặn render sai ngôn ngữ
  applyLocale();
  // Kích hoạt lại bộ lọc mỗi khi hệ thống View Transitions của Astro thực hiện tráo đổi trang (swap)
  document.addEventListener('astro:after-swap', applyLocale);
})();
