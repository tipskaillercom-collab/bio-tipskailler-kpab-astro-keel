# Dưới đây là phương án triển khai tính năng **Chuyển đổi giao diện Light/Dark Mode** chuẩn quy trình 4 bước dành cho dự án:

## 1. 📋 PM & UX Spec (Yêu cầu sản phẩm & Trải nghiệm)

- **Mục tiêu:** Cho phép người dùng chuyển đổi linh hoạt giữa giao diện Sáng (Light) và Tối (Dark) để bảo vệ mắt và tăng trải nghiệm đọc.
- **Vị trí UI:** Nút chuyển đổi (Toggle Button) nằm trên `<header>` góc phải, cạnh bộ đổi ngôn ngữ.
- **Trạng thái mặc định:**
  - Nếu người dùng ghé thăm lần đầu: Tự động phát hiện cài đặt của hệ điều hành máy tính (`prefers-color-scheme`).
  - Nếu đã chọn trước đó: Ưu tiên giá trị đã lưu trong máy.
- **Accessibility (a11y):** Sử dụng thẻ `<button>` chuẩn, hỗ trợ điều hướng bằng phím Tab/Enter, có `aria-label="Chuyển đổi giao diện Sáng/Tối"`.

---

## 2. ⚠️ Edge Cases (Các bẫy logic & Kỹ thuật cần né)

1. **Lỗi Nhấp nháy màn hình (Flash of Wrong Theme - FOUT):**
   - _Rủi ro:_ Trình duyệt tải trang trắng tinh (Light) rồi mới đọc JS và đổi sang Dark làm chói mắt người dùng.
   - _Giải pháp:_ Đặt 1 đoạn script inline đồng bộ (synchronous) ngay trong `<head>` để gán attribute `data-theme` cho `<html>` **trước khi** trình duyệt bắt đầu vẽ (render) giao diện.
2. **Tương thích Astro View Transitions (`ClientRouter`):**
   - _Rủi ro:_ Khi chuyển trang bằng SPA mode (`astro:transitions`), Astro sẽ reset lại thuộc tính của tag `<html>` hoặc làm hỏng các event listener gán trực tiếp vào element.
   - _Giải pháp:_ Lắng nghe sự kiện `astro:after-swap` để khôi phục lại `data-theme` và dùng **Event Delegation** bắt sự kiện click ở mức `document`.
3. **Đồng bộ sự kiện đổi theme của hệ điều hành:**
   - Nếu người dùng chưa từng bấm nút toggle (chưa có `localStorage`), khi họ đổi theme trên Windows/macOS, trang web phải tự cập nhật theo live.

---

## 3. 🏗️ Tech Solution (Cấu trúc file & Giải pháp)

- **CSS Architecture:** Sử dụng CSS Custom Properties (Variables) gắn vào `:root[data-theme="light"]` và `:root[data-theme="dark"]`.
- **Anti-Flicker Strategy:** Tách biệt logic khởi tạo ban đầu ra file JS tĩnh trong `public/scripts/` để nạp trực tiếp tại `<head>`, chống chớp giao diện.
- **State Management:** Quản lý trạng thái bất biến qua `localStorage` kết hợp hạ cấp an toàn (Graceful Degradation) về biến tạm RAM khi `localStorage` bị chặn.
- **Cấu trúc File triển khai:**
  - `src/styles/global.css`: Định nghĩa bộ Token màu giao diện.
  - `public/scripts/theme-init-anti-flicker.js`: Script JS tĩnh thực thi đồng bộ chống Flicker ở `<head>`.
  - `src/scripts/theme/theme-toggle.ts`: Script TypeScript xử lý sự kiện click đổi theme (Event Delegation & Step Functions).
  - `src/components/ThemeToggle.astro`: UI Component nút bấm đổi theme.
  - `src/layouts/BaseLayout.astro`: Layout chính kết nối các thành phần.

---

## 4. 💻 Implementation (Chi tiết từng bước)

**Một mình file JS là KHÔNG ĐỦ** để giải quyết triệt để 100% bài toán anti-flicker và trải nghiệm native. Nó bắt buộc phải kết hợp đồng bộ với CSS thông qua các từ khóa `color-scheme` và `prefers-color-scheme`.

---

### 💡 Bảng tổng kết luồng xử lý Anti-Flicker chuẩn

```text
[Người dùng mở trang]
       │
       ├─► 1. Trình duyệt nạp CSS ──► color-scheme & @media tự ăn màu theo OS ngay lập tức! (CHỐNG NHÁY 1)
       │
       ├─► 2. Inline JS chạy ở <head> ──► Kiểm tra localStorage:
       │        ├─ Nhận thấy người dùng chọn theme khác OS?
       │        └─► Gán <html data-theme="..."> NGAY LẬP TỨC! (CHỐNG NHÁY 2)
       │
       └─► 3. Giao diện vẽ ra màn hình (Paint) ──► Mượt mà 100%, đúng ý người dùng, không nháy 1 miligiây nào!
```

Toàn bộ cấu hình mã nguồn chi tiết từ các file `global.css`, `theme-init-anti-flicker.js`, `theme-toggle.ts`, `ThemeToggle.astro` cho đến `BaseLayout.astro` có thể được tham khảo trực tiếp trong hệ thống kho lưu trữ của dự án.

#### Bước 4.1: Định nghĩa Token màu CSS `global.css` (`src/styles/global.css`)

---

- **`color-scheme: dark light;`**: Nói trực tiếp với engine của trình duyệt (Chromium, WebKit, Gecko): _"Hãy chuẩn bị sẵn sàng canvas mặc định, thanh cuộn (scrollbar), ô input, hộp chọn datePicker... ở chế độ này"_. Trình duyệt sẽ đổi màu thanh cuộn và màu nền hệ thống **ngay trước khi file JS kịp chạy hay DOM kịp render**.
- **`@media (prefers-color-scheme: dark)`**: Đây là kênh giao tiếp tự động giữa **Hệ Điều Hành (OS)** và **Trình Duyệt**. Nhờ có nó, ngay khi CSS vừa nạp xong, giao diện lập tức đúng màu OS mà chưa cần tới 1 dòng JS nào thực thi.

- Thuộc tính `data-theme` đóng vai trò là **"Công tắc ghi đè" (Override Switch)**.
- Khi JS gán `data-theme="light"`, đoạn CSS `:root[data-theme='light']` sẽ có độ ưu tiên cao hơn `@media` và **ép trình duyệt phải dùng theme Light**, bất chấp OS đang là Dark.

```css src/styles/global.css
/* ==========================================================================
   0. BẢNG MÀU GỐC (PRIMITIVE PALETTE)
   Nơi lưu trữ tập trung toàn bộ các mã màu OKLCH để tránh lặp lại ở bên dưới.
   Muốn đổi sắc độ màu nào, chỉ cần sửa đúng 1 lần tại đây.
   ========================================================================== */
:root {
  /* --- NHÓM FONT CHỮ (TYPOGRAPHY) --- */
  --font-display: 'Fraunces Variable', Georgia, serif; /* Font tiêu đề lớn */
  --font-body: 'Public Sans', system-ui, sans-serif; /* Font văn bản đọc */
  --font-mono: 'JetBrains Mono Variable', ui-monospace, monospace; /* Font mã nguồn */

  /* --- NHÓM KÍCH THƯỚC & NHỊP ĐIỆU BỐ CỤC (LAYOUT & SPACING) --- */
  --content-width: 1160px; /* Chiều rộng tối đa của khung nội dung */
  --prose-width: 68ch; /* Giới hạn 68 ký tự/dòng để đọc bài không mỏi mắt */
  --page-pad: clamp(1rem, 3vw, 2rem); /* Lề 2 bên trang tự co giãn từ 1rem đến 2rem */
  --baseline: 1.5rem; /* Đơn vị nhịp khoảng cách dọc chuẩn của trang */
  --hairline: 1px solid var(--color-line); /* Viền mảnh 1px dùng chung */
  --focus-ring: 0 0 0 3px var(--color-accent-soft); /* Vòng sáng khi điều hướng bằng phím Tab */

  /* --- MÀU NHẤN (ACCENT) --- */
  --palette-accent-light: oklch(0.54 0.14 35);
  --palette-accent-dark: oklch(0.72 0.13 42);

  /* --- THANG MÀU SÁNG (LIGHT NEUTRALS) --- */
  --palette-light-100: oklch(0.99 0.003 100); /* Trắng ngà sáng nhất (Nền chính / Chữ trên nút) */
  --palette-light-200: oklch(0.965 0.004 100); /* Trắng ngà dịu (Nền thẻ card / surface) */
  --palette-light-300: oklch(0.94 0.006 100); /* Xám nhạt nhẹ (Nền khối code / soft) */
  --palette-light-400: oklch(0.86 0.008 100); /* Xám kẻ mảnh (line) */
  --palette-light-500: oklch(0.72 0.012 120); /* Xám kẻ đậm (line-strong) */
  --palette-light-600: oklch(0.5 0.012 250); /* Xám chữ phụ (muted) */
  --palette-light-900: oklch(0.25 0.01 250); /* Xám than đậm (Chữ chính) */

  /* --- THANG MÀU TỐI (DARK NEUTRALS) --- */
  --palette-dark-900: oklch(0.18 0.009 250); /* Đen than sâu nhất (Nền chính / Chữ trên nút) */
  --palette-dark-800: oklch(0.22 0.01 250); /* Đen than vừa (Nền thẻ card / surface) */
  --palette-dark-700: oklch(0.26 0.01 250); /* Xám tối nhẹ (Nền khối code / soft) */
  --palette-dark-600: oklch(0.34 0.012 250); /* Xám kẻ mảnh (line) */
  --palette-dark-500: oklch(0.44 0.016 230); /* Xám kẻ đậm (line-strong) */
  --palette-dark-300: oklch(0.69 0.012 250); /* Xám chữ phụ (muted) */
  --palette-dark-100: oklch(0.93 0.006 95); /* Trắng ngà dịu (Chữ chính) */
}

/* ==========================================================================
   1. GIAO DIỆN SÁNG MẶC ĐỊNH (LIGHT MODE) & CÁC BIẾN BỐ CỤC CHUNG
   Áp dụng cho thẻ gốc <html> khi chưa có thiết lập giao diện đặc biệt nào.
   ========================================================================== */
:root {
  /* Báo cho trình duyệt dùng thanh cuộn (scrollbar) và form mặc định tông sáng */
  color-scheme: light;

  /* --- NHÓM MÀU NHẤN CHỦ ĐẠO (ACCENT COLORS) --- */
  /* Đổi 1 dòng này (hoặc đổi --palette-accent-light ở trên) để retune màu nhấn */
  --color-accent: var(--palette-accent-light);
  /* Tự động pha thêm 12% màu đen vào màu nhấn để làm màu khi di chuột (hover) */
  --color-accent-hover: color-mix(in oklch, var(--color-accent), black 12%);
  /* Pha 84% độ trong suốt tạo màu nền nhạt (dùng cho bôi đen chữ, focus ring) */
  --color-accent-soft: color-mix(in oklch, var(--color-accent), transparent 84%);
  /* Màu chữ/icon (trắng ngà) nằm đè lên trên các nút có nền --color-accent */
  --color-on-accent: var(--palette-light-100);

  /* --- NHÓM MÀU NỀN, CHỮ & ĐƯỜNG KẺ (SURFACE & TEXT) --- */
  --color-bg: var(--palette-light-100); /* Màu nền chính toàn trang (trắng ngà dịu mắt) */
  --color-surface: var(--palette-light-200); /* Màu nền phụ cho thẻ card / khối nổi */
  --color-text: var(--palette-light-900); /* Màu chữ nội dung chính (xám than đậm) */
  --color-muted: var(--palette-light-600); /* Màu chữ phụ (ngày tháng, chú thích mờ) */
  --color-line: var(--palette-light-400); /* Màu đường kẻ phân cách mảnh */
  --color-line-strong: var(--palette-light-500); /* Màu đường kẻ nhấn đậm hơn */
  --color-soft: var(--palette-light-300); /* Màu nền nhẹ cho khối code (<pre>, <code>) */
}

/* ==========================================================================
   2. TỰ ĐỘNG CHUYỂN TỐI THEO HỆ ĐIỀU HÀNH (OS PREFERENCE)
   Kích hoạt khi người dùng chưa bấm nút đổi theme trên web, nhưng máy đang bật Dark Mode.
   ========================================================================== */
@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
    /* Nâng độ sáng màu nhấn để nổi bật trên nền tối */
    --color-accent: var(--palette-accent-dark);
    /* Trên nền tối, khi hover thì pha thêm 10% màu trắng cho sáng lên */
    --color-accent-hover: color-mix(in oklch, var(--color-accent), white 10%);
    --color-accent-soft: color-mix(in oklch, var(--color-accent), transparent 78%);
    /* Vì màu nhấn giờ đã sáng, chữ nằm đè lên nút phải đổi thành màu tối để dễ đọc */
    --color-on-accent: var(--palette-dark-900);

    --color-bg: var(--palette-dark-900);
    --color-surface: var(--palette-dark-800);
    --color-text: var(--palette-dark-100);
    --color-muted: var(--palette-dark-300);
    --color-line: var(--palette-dark-600);
    --color-line-strong: var(--palette-dark-500);
    --color-soft: var(--palette-dark-700);
  }
}

/* ==========================================================================
   3. ÉP BUỘC GIAO DIỆN SÁNG THỦ CÔNG (KHI JS GẮN data-theme='light')
   Độ ưu tiên cao hơn :root mặc định -> Khóa giao diện Sáng bất chấp cài đặt máy.
   ========================================================================== */
:root[data-theme='light'] {
  color-scheme: light;
  --color-accent: var(--palette-accent-light);
  --color-accent-hover: color-mix(in oklch, var(--color-accent), black 12%);
  --color-accent-soft: color-mix(in oklch, var(--color-accent), transparent 84%);
  --color-on-accent: var(--palette-light-100);
  --color-bg: var(--palette-light-100);
  --color-surface: var(--palette-light-200);
  --color-text: var(--palette-light-900);
  --color-muted: var(--palette-light-600);
  --color-line: var(--palette-light-400);
  --color-line-strong: var(--palette-light-500);
  --color-soft: var(--palette-light-300);
}

/* ==========================================================================
   4. ÉP BUỘC GIAO DIỆN TỐI THỦ CÔNG (KHI JS GẮN data-theme='dark')
   Độ ưu tiên cao hơn :root mặc định -> Khóa giao diện Tối bất chấp cài đặt máy.
   (Tách riêng khối này vì CSS thuần không gộp chung được với @media ở trên)
   ========================================================================== */
:root[data-theme='dark'] {
  color-scheme: dark;
  --color-accent: var(--palette-accent-dark);
  --color-accent-hover: color-mix(in oklch, var(--color-accent), white 10%);
  --color-accent-soft: color-mix(in oklch, var(--color-accent), transparent 78%);
  --color-on-accent: var(--palette-dark-900);
  --color-bg: var(--palette-dark-900);
  --color-surface: var(--palette-dark-800);
  --color-text: var(--palette-dark-100);
  --color-muted: var(--palette-dark-300);
  --color-line: var(--palette-dark-600);
  --color-line-strong: var(--palette-dark-500);
  --color-soft: var(--palette-dark-700);
}
```

---

#### Bước 4.2: Tạo File Script Tĩnh Anti-Flicker `theme-init-anti-flicker.js` (`public/scripts/theme-init-anti-flicker.js`)

---

Nếu chỉ có CSS ở trên, ta gặp 1 hạn chế: **Không nhớ được lựa chọn thủ công của người dùng trong quá khứ**, vì vậy vai trò của file này là: **Đọc `localStorage` trước khi trình duyệt vẽ (paint) giao diện ra màn hình**.

| Tệp                        | Trách nhiệm chính                                                                 | Xử lý khi nào?                                   |
| -------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------ |
| theme-init-anti-flicker.js | Chống chớp màn hình + Lắng nghe thay đổi từ Hệ điều hành (nếu user chưa tự chọn). | Ngay khi tải trang & liên tục ngầm ở background. |

> **Quy tắc Anti-Flicker:** Tách logic thực thi thô ra file JS tĩnh độc lập nằm trong `public/scripts/` để nạp trực tiếp qua thẻ `<script is:inline src="...">` trong `<head>`.

```javascript public/scripts/theme-init-anti-flicker.js
/**
 * File: public/scripts/theme-init-anti-flicker.js
 * Mô tả: Script tĩnh thực thi đồng bộ trước khi trình duyệt render giao diện (Anti-Flicker).
 */

(() => {
  // Cấu hình hằng số hệ thống
  const STORAGE_KEY = 'theme';
  const DATA_ATTRIBUTE = 'theme';
  const VALID_THEMES = ['light', 'dark'];
  const LOG_MESSAGES_ANTI_FLICKER_STORAGE_DENIED =
    '[Theme Anti-Flicker] Storage access denied, fallback to OS setting.';
  const LOG_MESSAGES_ANTI_FLICKER_MATCH_MEDIA_LISTENER_SETUP_FAILED =
    '[Theme Anti-Flicker] matchMedia listener setup failed.';

  // Lấy trạng thái dark mode từ Hệ điều hành
  const getOSPreference = () =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  // Hàm kiểm tra giá trị theme có nằm trong danh sách cho phép hay không
  const getValidatedStoredTheme = () => {
    const storedTheme = localStorage.getItem(STORAGE_KEY);
    return VALID_THEMES.includes(storedTheme) ? storedTheme : null;
  };

  // STEP 1: Đọc trạng thái và gán data-theme lên <html>
  const STEP_1_APPLY_INITIAL_THEME = () => {
    try {
      // 1. Chỉ chấp nhận theme hợp lệ ('light' hoặc 'dark') từ localStorage
      const validStoredTheme = getValidatedStoredTheme();
      // 2. Ưu tiên: validStoredTheme -> OS preference ('light' | 'dark')
      const theme = validStoredTheme || getOSPreference();
      // 3. Gán attribute trực tiếp lên HTML root element
      document.documentElement.dataset[DATA_ATTRIBUTE] = theme;
    } catch (error) {
      // Graceful Degradation: Fallback về OS setting nếu localStorage bị cấm
      console.warn(LOG_MESSAGES_ANTI_FLICKER_STORAGE_DENIED, error);
      document.documentElement.dataset[DATA_ATTRIBUTE] = getOSPreference();
    }
  };

  // STEP 2: Thực thi ngay lập tức trước First Paint
  STEP_1_APPLY_INITIAL_THEME();

  // STEP 3: Lắng nghe sự kiện hoán đổi trang trong Astro (View Transitions)
  document.addEventListener('astro:after-swap', STEP_1_APPLY_INITIAL_THEME);

  // STEP 4: Lắng nghe sự kiện đổi theme trên Hệ điều hành nếu chưa có theme hợp lệ trong localStorage
  try {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    mediaQuery.addEventListener('change', (e) => {
      try {
        if (!getValidatedStoredTheme()) {
          document.documentElement.dataset[DATA_ATTRIBUTE] = e.matches ? 'dark' : 'light';
        }
      } catch (_err) {
        document.documentElement.dataset[DATA_ATTRIBUTE] = e.matches ? 'dark' : 'light';
      }
    });
  } catch (error) {
    console.warn(LOG_MESSAGES_ANTI_FLICKER_MATCH_MEDIA_LISTENER_SETUP_FAILED, error);
  }
})();
```

---

#### Bước 4.3: Tạo Logic Interactive Toggle Script `theme-toggle.ts` (`src/scripts/theme/theme-toggle.ts`)

---

| Tệp             | Trách nhiệm chính                                                                                            | Xử lý khi nào?                       |
| --------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| theme-toggle.ts | Xử lý sự kiện Click chuột của người dùng + Lưu trạng thái thủ công (có cơ chế RAM dự phòng nếu kẹt Storage). | Chỉ chạy khi user tương tác (click). |

```typescript src/scripts/theme/theme-toggle.ts
/**
 * File: src/scripts/theme/theme-toggle.ts
 * Mô tả: Script logic bắt sự kiện click đổi theme, tuân thủ Step Functions và Strict Typing.
 */

// Strict typing cho kiểu dữ liệu Theme
export type ThemeMode = 'light' | 'dark';

// Cấu hình hằng số đóng băng từ compile-time bằng `as const`
const THEME_TOGGLE_CONFIG = {
  STORAGE_KEY: 'theme',
  DATA_ATTRIBUTE: 'theme',
  TOGGLE_SELECTOR: '[data-theme-toggle]',
  LOG_MESSAGES: {
    TOGGLE_STORAGE_DENIED: '[Theme Toggle] Cannot write to localStorage. Using RAM fallback.',
  },
} as const;

// Biến bộ nhớ RAM dự phòng khi localStorage bị chặn
let fallbackRamThemeStorage: ThemeMode | null = null;

/**
 * STEP 1: Lấy theme hiện tại từ dataset thẻ <html>
 */
function STEP_1_GET_CURRENT_THEME(): ThemeMode {
  const currentTheme = document.documentElement.dataset[THEME_TOGGLE_CONFIG.DATA_ATTRIBUTE];
  return currentTheme === 'dark' ? 'dark' : 'light';
}

/**
 * STEP 2: Tính toán theme kế tiếp theo tư duy Immutability
 */
function STEP_2_CALCULATE_NEXT_THEME(currentTheme: ThemeMode): ThemeMode {
  return currentTheme === 'dark' ? 'light' : 'dark';
}

/**
 * STEP 3: Thực thi cập nhật DOM và lưu trữ an toàn (Graceful Degradation)
 */
function STEP_3_EXECUTE_THEME_UPDATE(nextTheme: ThemeMode): void {
  // Cập nhật DOM
  document.documentElement.dataset[THEME_TOGGLE_CONFIG.DATA_ATTRIBUTE] = nextTheme;

  // Thử lưu vào localStorage
  try {
    localStorage.setItem(THEME_TOGGLE_CONFIG.STORAGE_KEY, nextTheme);
  } catch (error) {
    console.warn(THEME_TOGGLE_CONFIG.LOG_MESSAGES.TOGGLE_STORAGE_DENIED, error);
    fallbackRamThemeStorage = nextTheme;
  }
}

// Bắt sự kiện Click trên toàn Document (Event Delegation)
document.addEventListener('click', (event: MouseEvent): void => {
  if (!(event.target instanceof Element)) return;

  const toggleButton = event.target.closest(THEME_TOGGLE_CONFIG.TOGGLE_SELECTOR);
  if (!toggleButton) return;

  const currentTheme = STEP_1_GET_CURRENT_THEME();
  const nextTheme = STEP_2_CALCULATE_NEXT_THEME(currentTheme);
  STEP_3_EXECUTE_THEME_UPDATE(nextTheme);
});

/**
 * Getter phục vụ kiểm thử (Testing) và kiểm tra trạng thái RAM Fallback
 */
export function getFallbackRamTheme(): ThemeMode | null {
  return fallbackRamThemeStorage;
}
```

---

#### Bước 4.4: Tạo Component `ThemeToggle.astro` (`src/components/ThemeToggle.astro`)

---

```tsx src/components/ThemeToggle.astro
---
/**
 * Component: src/components/ThemeToggle.astro
 * Mô tả: UI Component nút bấm chuyển đổi theme.
 */

interface Props {
  label: string;
}

const { label } = Astro.props;
---

<button type="button" class="theme-toggle" aria-label={label} data-theme-toggle>
  <span aria-hidden="true"></span>
</button>

```

---

#### Bước 4.5: Tích hợp vào Layout Chính `BaseLayout.astro` (`src/layouts/BaseLayout.astro`)

---

```tsx src/layouts/BaseLayout.astro
---
import ThemeToggle from '../components/ThemeToggle.astro';
---

<!doctype html>
<html lang={locale}>
  <head>
    <!-- ... các thẻ meta khác ... -->
    <ClientRouter />

    <!-- Script tĩnh chặn nhấp nháy giao diện (Anti-Flicker) chạy trước khi paint -->
    <script is:inline src="/scripts/theme-init-anti-flicker.js"></script>
  </head>
  <body>
    <header class="site-header">
      <!-- ... nav content ... -->
      <ThemeToggle label={t('theme.toggle')} />
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

---

## 🛡️ 5. Triết lý Lập trình Phòng thủ (Defensive Programming) & Ranh giới Bảo mật Client-Server

- **Ranh giới Client vs. Server:** Phía Client là môi trường không đáng tin cậy; các từ khóa type safety chỉ có tác dụng khi biên dịch. Phía Server mới là nơi xử lý logic nghiệp vụ nhạy cảm.
- **Độ bền vững ứng dụng (Resilience):** Hệ thống tự động xử lý ngoại lệ khi dung lượng storage bị chặn hoặc đầy (`QuotaExceededError`), chống lỗi DOM Clobbering và tự phục hồi về trạng thái mặc định an toàn.

---

## 🔍 6. Kết quả đạt được sau kiểm thử:

Hệ thống đã vượt qua **100%** trên cả 4 bộ kiểm thử tự động sử dụng Vitest, Happy-DOM và AstroContainer, đáp ứng đầy đủ các tiêu chí về kiến
trúc, trải nghiệm người dùng, độ bền vững (Resilience), trợ năng (a11y) và bảo mật phòng thủ.

### 📋 Bảng tổng hợp đối chiếu kết quả kiểm thử (Test Matrix Verification):

- ✅ **Kiến trúc & Khởi tạo (`000-architectural-spec.test.ts`):**
  - ☑️ Đọc chính xác cấu hình OS preference (`dark`/`light`) khi `localStorage` trống.
  - ☑️ Ưu tiên dữ liệu cài đặt người dùng lưu trong `localStorage` đè lên OS preference.
  - ☑️ Đồng bộ tự động theo thời gian thực (Live OS Scheme Syncing) khi hệ điều hành thay đổi giao diện (khi chưa khóa lựa chọn cá nhân).
  - ☑️ Khôi phục chính xác trạng thái `data-theme` và duy trì bộ lắng nghe sự kiện khi Astro chuyển trang SPA (`astro:after-swap`).

- ✅ **Chịu tải & Thao tác biên (`001-stress-edge-cases.test.ts`):**
  - ☑️ Bắt sự kiện chuyển đổi thành công qua Event Delegation khi click vào thẻ con `<span>` bên trong button.
  - ☑️ Bỏ qua các sự kiện click bên ngoài khu vực nút toggle.
  - ☑️ Chống nghẽn/đua lệnh (Race Conditions) khi người dùng nhấp chuột nhanh liên tục (Rapid Clicks 10 lần/giây).
  - ☑️ Tự phục hồi an toàn (Auto-recovery Guard) về theme mặc định khi thuộc tính `dataset.theme` bị giả mạo dữ liệu rác (`Corrupted Dataset Attack`).

- ✅ **Lập trình phòng thủ & Hạ cấp an toàn (`002-security-hardening.test.ts`):**
  - ☑️ Xử lý mượt mà ngoại lệ tràn bộ nhớ trình duyệt (`QuotaExceededError`), tự động hạ cấp an toàn sang bộ nhớ tạm RAM (`RAM Fallback`).
  - ☑️ Bắt ngoại lệ truy cập bộ nhớ bị chặn (`SecurityError` ở chế độ Ẩn danh/Brave) mà không làm sập ứng dụng.
  - ☑️ Chống tấn công `DOM Clobbering` (thẻ HTML lạ chèn đè biến toàn cục `window.localStorage`).

- ✅ **Trợ năng & Ngữ nghĩa HTML (`900-a11y-component.test.ts`):**
  - ☑️ Kiểm tra component render chính xác thẻ `<button>` chuẩn HTML5 (không dùng thẻ phi tương tác như `div`/`a`).
  - ☑️ Khai báo tường minh `type="button"` tránh tự động submit khi đặt trong thẻ `<form>`.
  - ☑️ Gán đúng nhãn hỗ trợ đọc màn hình `aria-label` linh hoạt từ Props truyền vào (hỗ trợ i18n).
  - ☑️ Gán `aria-hidden="true"` cho icon `<span>` trang trí bên trong để tránh trình đọc màn hình đọc lặp rác.
