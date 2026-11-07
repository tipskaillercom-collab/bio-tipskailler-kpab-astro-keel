(() => {
  // ==========================================
  // STEP FUNCTIONS (Các bước xử lý độc lập)
  // ==========================================

  // Bước 1: Trích xuất cấu hình và bộ công cụ trợ giúp từ window
  // Lấy bộ công cụ helper từ đối tượng window toàn cục
  const getLocaleConfig = () => {
    const nsKey = window.__NS_ClientLocaleSwitchHelper;
    const nsConfig = window[nsKey];
    if (!nsConfig || !nsConfig.helpers) return null;
    return nsConfig;
  };

  // Bước 2: Xử lý chuẩn hóa URL khi URL chứa mã ngôn ngữ trùng với ngôn ngữ hệ thống mặc định
  // Ví dụ: Cấu hình hệ thống mặc định là "ja" nhưng URL lại là ://domain.com
  const handleRedundantDefaultPrefix = ({
    hasLocalePrefix,
    pathSegments,
    defaultLocale,
    helpers,
  }) => {
    if (!hasLocalePrefix || pathSegments[0] !== defaultLocale) {
      return false;
    }

    // Đồng bộ lại bộ nhớ hệ thống về ngôn ngữ mặc định này
    localStorage.setItem('locale', defaultLocale);

    // Bóc tách chữ tiền tố thừa đó ra (Ví dụ: bỏ "ja" ra khỏi ["ja", "about"] thành ["about"])
    const cleanSegments = helpers.cleanSegments(pathSegments, true);

    // Tạo dựng URL sạch không chứa tiền tố trùng lặp mặc định
    const canonicalUrl = helpers.buildPath(defaultLocale, cleanSegments, defaultLocale);

    // Điều hướng ngay lập tức về trang sạch chuẩn SEO (://domain.com) và dừng tiến trình
    window.location.href = canonicalUrl;
    return true; // Đã thực hiện điều hướng
  };

  // Bước 3: Xác định ngôn ngữ mục tiêu người dùng mong muốn dựa trên độ ưu tiên
  // Thứ tự: Lựa chọn lưu trữ trước đó (localStorage) -> Ngôn ngữ máy của trình duyệt -> Mặc định hệ thống
  const determinePreferredLocale = (savedLocale, locales, defaultLocale) => {
    if (savedLocale && locales.includes(savedLocale)) {
      return savedLocale;
    }

    const browserLang = (navigator.language || navigator.userLanguage || '').split('-')[0];
    if (locales.includes(browserLang)) {
      return browserLang;
    }

    return defaultLocale;
  };

  // Bước 4: Chuyển hướng nếu ngôn ngữ mong muốn khác với ngôn ngữ hiện tại của URL
  // Kiểm tra sự lệch pha giữa ngôn ngữ đích và ngôn ngữ hiển thị trên URL hiện tại
  const handleLocaleMismatch = ({
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
    localStorage.setItem('locale', preferredLocale);

    // Tiến hành làm sạch mảng phân đoạn URL cũ
    const cleanSegments = helpers.cleanSegments(pathSegments, hasLocalePrefix);

    // Tạo dựng URL đích mới phù hợp với cấu hình (Nếu bằng defaultLocale sẽ tự động giấu đi)
    const targetUrl = helpers.buildPath(preferredLocale, cleanSegments, defaultLocale);

    // Điều hướng sang trang đích và dừng tiến trình để chờ tải trang mới
    window.location.href = targetUrl;
    return true; // Đã thực hiện điều hướng
  };

  // Bước 5: Đồng bộ hóa trạng thái ngôn ngữ vào LocalStorage và thuộc tính DOM
  const syncLocaleState = (currentLocale) => {
    // Nếu URL đã trùng khớp hoàn hảo với ngôn ngữ đích, đồng bộ giá trị chuẩn vào bộ nhớ lưu trữ
    localStorage.setItem('locale', currentLocale);
    // Đính thuộc tính dữ liệu data-locale vào thẻ <html> để CSS/JS khác nhận diện điều khiển UI giao diện
    document.documentElement.dataset.locale = currentLocale;
  };

  // ==========================================
  // MAIN ORCHESTRATOR (Hàm điều phối chính)
  // ==========================================
  const applyLocale = () => {
    // 1. Lấy cấu hình hệ thống
    const config = getLocaleConfig();
    if (!config) return;

    const { helpers, locales, defaultLocale } = config;

    // Thực hiện phân rã các thông số URL hiện tại
    const pathSegments = helpers.getSegments();
    const savedLocale = localStorage.getItem('locale');

    // Kiểm tra xem phân đoạn đầu tiên của URL có phải là mã ngôn ngữ hợp lệ hay không
    const hasLocalePrefix = helpers.isValidLocale(pathSegments[0], locales);

    // Lấy ra ngôn ngữ thực tế của URL (nếu URL không có tiền tố, hàm trả về defaultLocale)
    const currentLocale = helpers.getCurrentLocale(pathSegments, hasLocalePrefix, defaultLocale);

    // 2. Kiểm tra & chuẩn hóa tiền tố URL mặc định (SEO)
    const wasRedirectedForDefault = handleRedundantDefaultPrefix({
      hasLocalePrefix,
      pathSegments,
      defaultLocale,
      helpers,
    });
    if (wasRedirectedForDefault) return;

    // 3. Tính toán ngôn ngữ ưu tiên của người dùng
    const preferredLocale = determinePreferredLocale(savedLocale, locales, defaultLocale);

    // 4. Chuyển hướng nếu có sự lệch pha ngôn ngữ
    const wasRedirectedForMismatch = handleLocaleMismatch({
      preferredLocale,
      currentLocale,
      pathSegments,
      hasLocalePrefix,
      defaultLocale,
      helpers,
    });
    if (wasRedirectedForMismatch) return;

    // 5. Đồng bộ DOM và bộ nhớ nếu không cần chuyển hướng
    syncLocaleState(currentLocale);
  };

  // Kích hoạt bộ lọc định tuyến ngay khi phân tích cú pháp mã HTML đầu tiên nhằm chặn render sai ngôn ngữ
  applyLocale();

  // Kích hoạt lại bộ lọc mỗi khi hệ thống View Transitions của Astro thực hiện tráo đổi trang (swap)
  document.addEventListener('astro:after-swap', applyLocale);
})();
