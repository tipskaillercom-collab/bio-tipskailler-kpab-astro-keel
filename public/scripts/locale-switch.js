(() => {
  const applyLocale = () => {
    // Lấy bộ công cụ helper từ đối tượng window toàn cục
    const NS_ClientLocaleSwitchHelper = window.__NS_ClientLocaleSwitchHelper;
    const {
      __clientLocaleSwitchHelper: clientLocaleSwitchHelper,
      locales,
      defaultLocale,
    } = window[NS_ClientLocaleSwitchHelper];
    if (!clientLocaleSwitchHelper) return;

    // Thực hiện phân rã các thông số URL hiện tại
    const segments = clientLocaleSwitchHelper.getSegments();
    const storedLocale = localStorage.getItem('locale');

    // Kiểm tra xem phân đoạn đầu tiên của URL có phải là mã ngôn ngữ hợp lệ hay không
    const isValidLocaleResult = clientLocaleSwitchHelper.isValidLocale(segments[0], locales);

    // Lấy ra ngôn ngữ thực tế của URL (nếu URL không có tiền tố, hàm trả về defaultLocale)
    const currentUrlLocale = clientLocaleSwitchHelper.getCurrentLocale(
      segments,
      isValidLocaleResult,
      defaultLocale,
    );

    // TRƯỜNG HỢP ĐẶC BIỆT (Yêu cầu cốt lõi): URL chứa mã ngôn ngữ trùng với ngôn ngữ hệ thống mặc định
    // Ví dụ: Cấu hình hệ thống mặc định là "ja" nhưng URL lại là ://domain.com
    if (isValidLocaleResult && segments[0] === defaultLocale) {
      // Đồng bộ lại bộ nhớ hệ thống về ngôn ngữ mặc định này
      localStorage.setItem('locale', defaultLocale);

      // Bóc tách chữ tiền tố thừa đó ra (Ví dụ: bỏ "ja" ra khỏi ["ja", "about"] thành ["about"])
      const cleanSegmentsResult = clientLocaleSwitchHelper.cleanSegments(segments, true);

      // Tạo dựng URL sạch không chứa tiền tố trùng lặp mặc định
      const cleanUrl = clientLocaleSwitchHelper.buildPath(
        defaultLocale,
        cleanSegmentsResult,
        defaultLocale,
      );

      // Điều hướng ngay lập tức về trang sạch chuẩn SEO (://domain.com) và dừng tiến trình
      window.location.href = cleanUrl;
      return;
    }

    // Bước 1: Xác định ngôn ngữ mục tiêu người dùng mong muốn dựa trên độ ưu tiên
    // Thứ tự: Lựa chọn lưu trữ trước đó (localStorage) -> Ngôn ngữ máy của trình duyệt -> Mặc định hệ thống
    let targetLocale = defaultLocale;
    if (storedLocale && locales.includes(storedLocale)) {
      targetLocale = storedLocale;
    } else {
      const browserLang = (navigator.language || navigator.userLanguage || '').split('-')[0];
      if (locales.includes(browserLang)) {
        targetLocale = browserLang;
      }
    }

    // Bước 2: Kiểm tra sự lệch pha giữa ngôn ngữ đích và ngôn ngữ hiển thị trên URL hiện tại
    if (targetLocale !== currentUrlLocale) {
      // Cập nhật bộ nhớ hệ thống theo ngôn ngữ đích mới
      localStorage.setItem('locale', targetLocale);

      // Tiến hành làm sạch mảng phân đoạn URL cũ
      const cleanSegmentsResult = clientLocaleSwitchHelper.cleanSegments(
        segments,
        isValidLocaleResult,
      );

      // Tạo dựng URL đích mới phù hợp với cấu hình (Nếu bằng defaultLocale sẽ tự động giấu đi)
      const finalUrl = clientLocaleSwitchHelper.buildPath(
        targetLocale,
        cleanSegmentsResult,
        defaultLocale,
      );

      // Điều hướng sang trang đích và dừng tiến trình để chờ tải trang mới
      window.location.href = finalUrl;
      return;
    }

    // Nếu URL đã trùng khớp hoàn hảo với ngôn ngữ đích, đồng bộ giá trị chuẩn vào bộ nhớ lưu trữ
    localStorage.setItem('locale', currentUrlLocale);

    // Đính thuộc tính dữ liệu data-locale vào thẻ <html> để CSS/JS khác nhận diện điều khiển UI giao diện
    document.documentElement.dataset.locale = currentUrlLocale;
  };

  // Kích hoạt bộ lọc định tuyến ngay khi phân tích cú pháp mã HTML đầu tiên đầu tiên nhằm chặn render sai ngôn ngữ
  applyLocale();

  // Kích hoạt lại bộ lọc mỗi khi hệ thống View Transitions của Astro thực hiện tráo đổi trang (swap)
  document.addEventListener('astro:after-swap', applyLocale);
})();
