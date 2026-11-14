# Tính Năng Chuyển Đổi Ngôn Ngữ (Locale Switch Feature)

Tài liệu chi tiết về kiến trúc, luồng xử lý và cách vận hành của tính năng chuyển đổi ngôn ngữ (i18n Locale Switcher) trong hệ thống. Feature này được tối ưu chống nhấp nháy giao diện (Anti-Flicker), hỗ trợ chuẩn SEO canonical URL và tích hợp liền mạch với cơ chế Astro View Transitions.

---

## 1. Tổng Quan Kiến Trúc (Architecture Overview)

Hệ thống xử lý đa ngôn ngữ được thiết kế dựa trên các mục tiêu chính:

1. **Anti-Flicker (Chống Nhấp Nháy):** Thực thi logic kiểm tra và đồng bộ ngôn ngữ ngay tại phần `<head>` của trang HTML trước khi trình duyệt render body DOM, ngăn chặn hoàn toàn hiện tượng hiển thị sai ngôn ngữ trong khoảnh khắc tải trang ban đầu.
2. **SEO Friendly:** Tự động ẩn tiền tố ngôn ngữ nếu trùng với ngôn ngữ mặc định hệ thống (ví dụ: `https://domain.com/` thay vì `https://domain.com/ja/`). Thêm tiền tố rõ ràng cho các ngôn ngữ phụ (ví dụ: `https://domain.com/vi/about`).
3. **Phân Tách Trách Nhiệm (Separation of Concerns):** Logic cốt lõi được trích xuất thành các helper độc lập, hỗ trợ cả môi trường Server-Side Rendering (SSR) lẫn Client-Side Runtime.
4. **Tích Hợp View Transitions:** Lắng nghe sự kiện `astro:after-swap` để tự động duy trì trạng thái ngôn ngữ chuẩn xác sau khi tráo đổi trang mượt bằng Astro Single Page Application (SPA) routing.

---

## 2. Cấu Trúc Thư Mục & Vai Trò Các File

```text
├── src/
│   ├── helpers/
│   │   └── locale-switch/
│   │       ├── locale-switch.js        # Core helper functions xử lý URL & routing
│   │       └── locale-switch.d.ts      # Type definitions & strict interfaces cho helper
│   └── scripts/
│       └── locale-switch/
│           ├── init-locale-switch.ts   # Server-side generator sinh inline init script
│           └── locale-switch-toggler.ts # Event Delegation handler lắng nghe nút click đổi locale
├── public/
│   └── scripts/
│       └── locale-switch-anti-flicker.js # File tĩnh thực thi Anti-Flicker tại <head>
└── docs/
    └── features/
        └── locale-switch.md            # Tài liệu tính năng này
```

### Chi Tiết Vai Trò File:

1. **`src/helpers/locale-switch/locale-switch.js` & `.d.ts`**
   - Chứa hàm `createLocaleSwitchHelpers()` cung cấp bộ tiện ích độc lập: `getSegments()`, `isValidLocale()`, `getCurrentLocale()`, `cleanSegments()`, `buildPath()`.
   - Có khai báo TypeScript Interface `LocaleSwitchHelpers` đảm bảo type safety.

2. **`src/scripts/locale-switch/init-locale-switch.ts`**
   - Chạy trên Server để sinh chuỗi script cấu hình siêu nhẹ (`window.__NS_ClientLocaleSwitchHelper` và đăng ký các hàm helper lên `window`).
   - Nhúng dạng inline script trong HTML `<head>`.

3. **`public/scripts/locale-switch-anti-flicker.js`**
   - File JS tĩnh nạp bằng thẻ `<script is:inline src="/scripts/locale-switch-anti-flicker.js">` ngay sau inline script cấu hình.
   - Chứa logic IIFE phân tách theo chuẩn **Step Functions** để kiểm tra URL, đọc `localStorage`, điều hướng khẩn cấp nếu có chênh lệch locale và gán `data-locale` vào thẻ `<html>`.

4. **`src/scripts/locale-switch/locale-switch-toggler.ts`**
   - Lắng nghe sự kiện click toàn cục bằng **Event Delegation** trên `document`.
   - Nhận diện các phần tử có thuộc tính `[data-locale-toggle]`.
   - Áp dụng các bước tuần tự (STEP_1 đến STEP_4) để xoay vòng ngôn ngữ (ví dụ: `en` -> `ja` -> `vi` -> `en`) và chuyển trang mượt qua `navigate()` từ `astro:transitions/client`.

---

## 3. Luồng Xử Lý & Các Bước Tuần Tự (Processing Pipelines)

### A. Anti-Flicker Flow (Khởi tạo trang)

Khi trình duyệt tải trang, quy trình thực thi tại `<head>` trải qua 5 bước:

```text
[Bắt đầu tải HTML]
       │
       ▼
[STEP 1: Lấy cấu hình & helpers từ window]
       │
       ▼
[STEP 2: Kiểm tra & chuẩn hóa tiền tố mặc định (Default Prefix Guard)]
  ├── Nếu URL thừa tiền tố mặc định (VD: /ja/about khi ja là default)
  │     └── Điều hướng ngay sang URL chuẩn (/about) & Dừng
  └── Ngược lại ──> Tiếp tục STEP 3
       │
       ▼
[STEP 3: Xác định ngôn ngữ ưu tiên (determinePreferredLocale)]
  └── Đọ ưu tiên: localStorage > navigator.language > defaultLocale
       │
       ▼
[STEP 4: Chuyển hướng nếu lệch pha (handleLocaleMismatch)]
  ├── Nếu preferredLocale khác currentLocale của URL
  │     └── Điều hướng sang targetUrl tương ứng & Dừng
  └── Ngược lại ──> Tiếp tục STEP 5
       │
       ▼
[STEP 5: Đồng bộ trạng thái (syncLocaleState)]
  └── Ghi localStorage('locale') & Gán document.documentElement.dataset.locale
```

### B. User Action Flow (Khi click nút đổi ngôn ngữ)

Khi người dùng click vào nút toggle đổi ngôn ngữ, `locale-switch-toggler.ts` xử lý tuần tự qua các khối Labelled Steps:

- **`STEP_1_VALIDATE_TARGET`**: Kiểm tra sự kiện có xuất phát từ phần tử hoặc phần tử con chứa `[data-locale-toggle]` hay không. Nếu không, bỏ qua.
- **`STEP_2_DETERMINE_NEXT_LOCALE`**: Xác định mã locale hiện tại của trang và xoay vòng đến phần tử kế tiếp trong danh sách `locales`.
- **`STEP_3_PREPARE_TARGET_URL`**: Cập nhật giá trị mới vào `localStorage.setItem('locale', nextLocale)` và xây dựng URL đích chuẩn bằng `helpers.buildPath(...)`.
- **`STEP_4_NAVIGATE`**: Gọi hàm `navigate(targetUrl)` của Astro View Transitions để chuyển đổi giao diện mượt mà không bị reload lại trang.

---

## 4. Hướng Dẫn Tích Hợp Trong Layout & Component

### 1. Nhúng script trong `src/layouts/BaseLayout.astro`

Nhúng khối script cấu hình inline và thẻ nạp file anti-flicker tĩnh vào thẻ `<head>` của layout chung:

```tsx src/layouts/BaseLayout.astro
---
import { getLocaleHelpersScript } from '../scripts/locale-switch/init-locale-switch';

// Khởi tạo helper ở phía server để chuẩn bị chuyển đổi định dạng
const localeHelpersInlineScript = getLocaleHelpersScript('__clientLocaleSwitchHelper');
---

<!doctype html>
<html lang={locale}>
  <head>
    <!-- ... các thẻ meta khác ... -->
    <ClientRouter />

    <!-- Đưa bộ thư viện helper dạng chuỗi vào môi trường runtime của trình duyệt -->
    <script is:inline set:html={localeHelpersInlineScript} />
    <!-- Script chặn render sai ngôn ngữ ngay trước khi trình duyệt vẽ giao diện (Anti-Flicker) -->
    <script is:inline src="/scripts/locale-switch-anti-flicker.js"></script>
  </head>
  <body>
    <header class="site-header">
      <!-- ... nav content ... -->
      <button class="locale-toggle" type="button" aria-label="dfsadfdsdafasdf" data-locale-toggle>
        <span aria-hidden="true">sssssssssssssss</span>
      </button>
    </header>

    <main>
      <slot />
    </main>

    <script>
      // Script bắt sự kiện click đổi ngôn ngữ
      import '../scripts/locale-switch/locale-switch-toggler';
    </script>
  </body>
</html>
```

### 2. Tạo UI Component Nút Đổi Ngôn Ngữ

Để tạo một button điều khiển việc đổi ngôn ngữ, chỉ cần thêm thuộc tính `data-locale-toggle` vào phần tử button:

```astro src/components/LocaleToggleButton.astro
<button
  type="button"
  data-locale-toggle
  aria-label="Switch Language"
  class="px-3 py-1 border rounded hover:bg-gray-100 transition-colors"
>
  <span class="inline-block data-[locale=vi]:hidden">🌐 VI</span>
  <span class="hidden data-[locale=vi]:inline-block">🌐 EN</span>
</button>
```

---

## 5. Quy Tắc Bảo Trì & Mở Rộng

- **Không tự ý sửa trực tiếp Object State:** Sử dụng hàm helper `cleanSegments` và `buildPath` để tạo đường dẫn mới thay vì dùng thao tác nối chuỗi thủ công.
- **Thêm Ngôn Ngữ Mới:** Chỉ cần bổ sung mã ngôn ngữ mới (ví dụ: `'fr'`, `'zh'`) vào file cấu hình gốc `src/i18n.ts`. Toàn bộ bộ tiện ích xoay vòng và kiểm tra tiền tố sẽ tự động nhận diện không cần sửa đổi logic code của runner.
- **Graceful Degradation:** Nếu người dùng tắt JavaScript, hệ thống vẫn duy trì hiển thị theo đúng URL mà họ truy cập nhờ logic phân tích đường dẫn tĩnh từ Server.
