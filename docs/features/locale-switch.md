# Tính Năng Chuyển Đổi Ngôn Ngữ (Locale Switch Feature)

Tài liệu chi tiết về kiến trúc, luồng xử lý và cách vận hành của tính năng chuyển đổi ngôn ngữ (i18n Locale  
Switcher). Tính năng được tối ưu chống nhấp nháy giao diện (Anti-Flicker), hỗ trợ chuẩn SEO canonical URL, hạ
cấp an toàn (Graceful Degradation) và tích hợp liền mạch với cơ chế Astro View Transitions.

---

## 1. Tổng Quan Kiến Trúc (Architecture Overview)

Hệ thống xử lý đa ngôn ngữ tuân thủ các nguyên tắc thiết kế:

1. **Anti-Flicker (Chống Nhấp Nháy):** Logic kiểm tra và đồng bộ ngôn ngữ được thực thi ngay tại `<head>`  
   trước khi trình duyệt render giao diện.
2. **SEO Friendly (Canonical URLs):** Tự động ẩn tiền tố ngôn ngữ nếu trùng với ngôn ngữ mặc định (ví dụ: `/`
   thay vì `/en/`), và thêm tiền tố cho ngôn ngữ phụ (ví dụ: `/vi/about`).
3. **Step Functions Architecture:** Logic xử lý phức tạp được chia thành các hàm xử lý tuần tự độc lập  
   (`STEP_1`, `STEP_2`, ...).
4. **Graceful Degradation (Hạ Cấp An Toàn):** Nếu `localStorage` bị cấm hoặc ném ngoại lệ `SecurityError`, hệ
   thống tự động lưu trạng thái tạm thời trên bộ nhớ RAM (`window.__FALLBACK_LOCALE`).
5. **View Transitions Integration:** Lắng nghe sự kiện `astro:after-swap` để duy trì thuộc tính DOM và ngôn  
   ngữ chuẩn xác sau khi chuyển trang mượt mà (SPA).

---

## 2. Cấu Trúc Thư Mục & Vai Trò Các File

```text
├── src/
│   ├── helpers/
│   │   └── locale-switch/
│   │       ├── locale-switch.js        # Core helper functions xử lý URL & routing
│   │       └── locale-switch.d.ts      # Type definitions cho helper
│   └── scripts/
│       └── locale-switch/
│           ├── init-locale-switch.ts   # Server-side generator sinh inline init script
│           └── locale-switch-toggler.ts # Event Delegation listener xử lý click button
├── public/
│   └── scripts/
│       └── locale-switch-anti-flicker.js # Script tĩnh thực thi Anti-Flicker tại <head>
└── docs/
    └── features/
        └── locale-switch.md            # Tài liệu kỹ thuật tính năng
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

Hệ thống vận hành dựa trên kiến trúc Step Functions, bóc tách logic phức tạp thành các hàm độc lập xử lý theo
tuần tự khép kín cho cả luồng khởi tạo (Anti-Flicker) lẫn luồng tương tác của người dùng (Toggler).

### A. Anti-Flicker Flow (Khởi tạo trang)

Quy trình Anti-Flicker thực thi đồng bộ ngay khi trình duyệt đọc đến thẻ <head> để ngăn chặn hiện tượng nhấp  
nháy giao diện sai ngôn ngữ trước khi render.

```text
[Khởi động Anti-Flicker Script]
                 │
                 ▼
[STEP 1: GET CONFIG] ────────────► (Lỗi/Không tìm thấy?) ──► [Dừng tiến trình]
                 │
                 ▼
[STEP 2: REDUNDANT PREFIX GUARD] ────► (Nếu URL chứa /en/about) ──► [Redirect sang /about]
                 │
                 ▼
[STEP 3: DETERMINE PREFERRED LOCALE] ──► (Đọ ưu tiên: Storage/RAM > Browser Lang > Default)
                 │
                 ▼
[STEP 4: LOCALE MISMATCH GUARD] ─────► (Nếu Preferred khác URL) ──► [Redirect sang Target URL]
                 │
                 ▼
[STEP 5: SYNC LOCALE STATE] ─────► (Ghi Storage/RAM & Gán html[data-locale])
```

Chi tiết các bước thực thi:

1. **STEP_1_GET_CONFIG() — Kiểm tra & Trích xuất cấu hình runtime**:

- Đọc đối tượng namespace toàn cục window.__NS_ClientLocaleSwitchHelper và lấy bộ tiện ích helpers, danh  
  sách locales, ngôn ngữ mặc định defaultLocale.
- Nếu thiếu cấu hình: Xuất cảnh báo console.warn và dừng thực thi để tránh gây sập trang.

2. **STEP_2_HANDLE_REDUNDANT_PREFIX()** — Chuẩn hóa **URL** chuẩn **SEO** (Canonical Guard):

- Kiểm tra xem đường dẫn **URL** hiện tại có chứa tiền tố trùng với defaultLocale hay không (ví dụ: /en/about
  khi en là mặc định).
- Nếu vi phạm: Đồng bộ bộ nhớ, tính toán đường dẫn sạch không chứa tiền tố (/about), thực hiện chuyển  
  hướng window.location.href ngay lập tức và dừng tiến trình.

3. **STEP_3_DETERMINE_PREFERRED_LOCALE() — Xác định ngôn ngữ ưu tiên người dùng**:

- Đối chiếu theo thứ tự ưu tiên giảm dần:
  1. Ngôn ngữ đã lưu trong localStorage hoặc bộ nhớ **RAM** tạm thời (window.__FALLBACK_LOCALE).
  2. Ngôn ngữ hệ thống của trình duyệt người dùng (navigator.language).
  3. Ngôn ngữ mặc định của ứng dụng (defaultLocale).

4. **STEP_4_HANDLE_LOCALE_MISMATCH() — Điều hướng khắc phục lệch pha ngôn ngữ**:

- So sánh preferredLocale vừa xác định với currentLocale hiển thị trên thanh địa chỉ **URL**.
- Nếu có sự lệch pha: Làm sạch phân đoạn **URL**, dựng lại đường dẫn chuẩn cho preferredLocale, thực hiện  
  window.location.href và dừng tiến trình.

5. **STEP_5_SYNC_LOCALE_STATE()** — Đồng bộ **DOM** & Trạng thái lưu trữ:

- Khi **URL** đã khớp hoàn hảo với ngôn ngữ ưu tiên, tiến hành lưu trữ trạng thái vào localStorage (hoặc hạ  
  cấp an toàn sang **RAM** Fallback nếu storage bị khóa).
- Gán trực tiếp thuộc tính data-locale lên thẻ root document.documentElement để kích hoạt **CSS**/JS giao diện
  tương ứng.

### B. User Action Flow (Khi click nút đổi ngôn ngữ)

Quy trình xử lý sự kiện click toàn cục (Event Delegation) khi người dùng chủ động bấm vào nút chuyển đổi ngôn
ngữ trên giao diện.

Khi người dùng click vào nút toggle đổi ngôn ngữ, `locale-switch-toggler.ts` xử lý tuần tự qua các khối Labelled Steps:

```text
[Sự kiện Click toàn cục (document)]
        │
        ▼
[STEP 1: VALIDATE TARGET] ─────────► (Không chứa [data-locale-toggle]) ──► [Bỏ qua]
        │
        ▼
[STEP 2: DETERMINE NEXT LOCALE] ────► (Xoay vòng: en ──► ja ──► vi ──► en)
        │
        ▼
[STEP 3: PREPARE TARGET URL] ───────► (Cập nhật Storage/RAM & Xây dựng Clean URL)
        │
        ▼
[STEP 4: NAVIGATE] ────────────► (Điều hướng mượt bằng Astro View Transitions)
```

Chi tiết các bước thực thi:

1. STEP_1_VALIDATE_TARGET(event) — Lọc & Xác thực phần tử kích hoạt:

- Kiểm tra sự kiện click có xuất phát từ phần tử hoặc thẻ con bên trong nút bấm có thuộc tính  
  [data-locale-toggle] hay không (event.target.closest(...)).
- Nếu không khớp: Kết thúc hàm ngay lập tức để trả lại hiệu năng cho trình duyệt.

2. STEP_2_DETERMINE_NEXT_LOCALE(...) — Xoay vòng ngôn ngữ tiếp theo:

- Lấy danh sách phân đoạn **URL** hiện tại, xác định ngôn ngữ hiện tại (currentLocale).
- Lấy vị trí chỉ mục (index) hiện tại trong mảng locales và tính toán ngôn ngữ kế tiếp theo công thức xoay
  vòng: locales[(currentIndex + 1) % locales.length].

3. STEP_3_PREPARE_TARGET_URL(...) — Cập nhật bộ nhớ & Tạo đường dẫn đích:

- Thử ghi mã ngôn ngữ mới (nextLocale) vào localStorage. Nếu bị trình duyệt chặn (SecurityError), tự động
  ghi log cảnh báo và lưu vào biến **RAM** fallback (window.__FALLBACK_LOCALE).
- Bóc tách tiền tố cũ ra khỏi phân đoạn **URL** bằng cleanSegments().
- Tạo **URL** mới bằng buildPath() (tự động giấu tiền tố nếu nextLocale trùng với defaultLocale và giữ nguyên
  Query Parameters/Hash).

4. STEP_4_NAVIGATE(targetUrl) — Chuyển trang mượt mà không Reload:

- Gọi hàm navigate(targetUrl) thuộc bộ thư viện Client Router của Astro (astro:transitions/client).
- Chuyển đổi giao diện theo cơ chế Single Page App (**SPA**) mượt mà, đồng thời kích hoạt lại listener  
  astro:after-swap của Anti-Flicker script để đồng bộ thuộc tính **DOM**.

---

## 4. Hướng Dẫn Tích Hợp Trong Layout & Component

### 1. Nhúng script trong `src/layouts/BaseLayout.astro`

Nhúng khối script cấu hình inline và thẻ nạp file anti-flicker tĩnh vào thẻ `<head>` của layout chung:

```tsx src/layouts/BaseLayout.astro
---
import { getLocaleHelpersScript } from '../scripts/locale-switch/init-locale-switch';
import LocaleToggle from '../components/LocaleToggle.astro';

// Khởi tạo helper ở phía server để chuẩn bị chuyển đổi định dạng
const localeHelpersInlineScript = getLocaleHelpersScript('__clientLocaleSwitchHelper');
---

<!doctype html>
<html lang={locale}>
  <head>
    <!-- ... các thẻ meta khác ... -->
    <ClientRouter />

    <!-- ... -->
    <!-- Đưa bộ thư viện helper dạng chuỗi vào môi trường runtime của trình duyệt -->
    <script is:inline set:html={localeHelpersInlineScript} />
    <!-- Script chặn render sai ngôn ngữ ngay trước khi trình duyệt vẽ giao diện (Anti-Flicker) -->
    <script is:inline src="/scripts/locale-switch-anti-flicker.js"></script>
  </head>
  <body>
    <header class="site-header">
      <!-- ... nav content ... -->
      <!-- Gom nhóm các nút chức năng ở header -->
      <div class="header-actions">
        <ThemeToggle label={t('theme.toggle')} />
        <LocaleToggle label="Switch language" />
      </div>
    </header>

    <main>
      <slot />
    </main>

    <!-- Script bắt sự kiện click đổi theme từ src/scripts/theme/ -->
    <script>
      import '../scripts/theme/theme-toggle';
    </script>
  </body>
</html>
```

### 2. Tạo UI Component Nút Đổi Ngôn Ngữ

Để tạo một button điều khiển việc đổi ngôn ngữ, chỉ cần thêm thuộc tính `data-locale-toggle` vào phần tử button:

```ts src/components/LocaleToggleButton.astro
---
/**
 * File: src/components/LocaleToggle.astro
 * Mô tả: Component nút chuyển đổi ngôn ngữ (Locale Switcher) dạng vòng tròn SVG.
 * Tự động chia múi hình quạt và render các lá cờ dựa trên danh sách `locales` và `flagMarkupMap` từ i18n.
 */
import { locales, flagMarkupMap } from '../i18n';

interface Props {
  label?: string;
}

const { label = 'Switch language' } = Astro.props;

// ===============================================================
// HÀM TẠO SVG PATH VÀ CLIP-PATH TỰ ĐỘNG THEO SỐ LƯỢNG LOCALES
// ===============================================================
const totalLocales = locales.length;
const anglePerSlice = 360 / totalLocales;

/**
 * Tính toán đường dẫn hình quạt SVG (Pie Slice Path) từ góc bắt đầu đến góc kết thúc
 */
const getSlicePath = (index: number) => {
  const startAngle = index * anglePerSlice - 90; // Xoay 90 độ để múi đầu tiên bắt đầu từ đỉnh (12h)
  const endAngle = (index + 1) * anglePerSlice - 90;

  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;

  const x1 = (12 + 12 * Math.cos(startRad)).toFixed(2);
  const y1 = (12 + 12 * Math.sin(startRad)).toFixed(2);
  const x2 = (12 + 12 * Math.cos(endRad)).toFixed(2);
  const y2 = (12 + 12 * Math.sin(endRad)).toFixed(2);

  const largeArcFlag = anglePerSlice > 180 ? 1 : 0;

  return `M12,12 L${x1},${y1} A12,12 0 ${largeArcFlag},1 ${x2},${y2} Z`;
};
---

<button type="button" class="lang-toggle" aria-label={label} data-locale-toggle>
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <defs>
      {locales.map((loc, index) => (
        <clipPath id={`clip-${loc}`}>
          <path d={getSlicePath(index)} />
        </clipPath>
      ))}
    </defs>

    {locales.map((loc) => (
      <g
        class={`flag-part flag-${loc}`}
        clip-path={`url(#clip-${loc})`}
        set:html={flagMarkupMap[loc]}
      />
    ))}

    {locales.map((_, index) => {
      const angle = index * anglePerSlice - 90;
      const rad = (angle * Math.PI) / 180;
      const x = (12 + 12 * Math.cos(rad)).toFixed(2);
      const y = (12 + 12 * Math.sin(rad)).toFixed(2);
      return <path d={`M12,12 L${x},${y}`} stroke="var(--color-line-strong)" stroke-width="0.8" />;
    })}
  </svg>
</button>
```

---

## 5. Quy Tắc Bảo Trì & Mở Rộng

- **Không tự ý sửa trực tiếp Object State:** Sử dụng hàm helper `cleanSegments` và `buildPath` để tạo đường dẫn mới thay vì dùng thao tác nối chuỗi thủ công.
- **Thêm Ngôn Ngữ Mới:** Chỉ cần bổ sung mã ngôn ngữ mới (ví dụ: `'fr'`, `'zh'`) vào file cấu hình gốc `src/i18n.ts`. Toàn bộ bộ tiện ích xoay vòng và kiểm tra tiền tố sẽ tự động nhận diện không cần sửa đổi logic code của runner.
- **Graceful Degradation:** Nếu người dùng tắt JavaScript, hệ thống vẫn duy trì hiển thị theo đúng URL mà họ truy cập nhờ logic phân tích đường dẫn tĩnh từ Server.
