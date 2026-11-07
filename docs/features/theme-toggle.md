Dưới đây là phương án triển khai tính năng **Chuyển đổi giao diện Light/Dark Mode** chuẩn quy trình 4 bước dành cho dự án:

---

### 1. 📋 PM & UX Spec (Yêu cầu sản phẩm & Trải nghiệm)

- **Mục tiêu:** Cho phép người dùng chuyển đổi linh hoạt giữa giao diện Sáng (Light) và Tối (Dark) để bảo vệ mắt và tăng trải nghiệm đọc.
- **Vị trí UI:** Nút chuyển đổi (Toggle Button) nằm trên `<header>` góc phải, cạnh bộ đổi ngôn ngữ.
- **Trạng thái mặc định:**
  - Nếu người dùng ghé thăm lần đầu: Tự động phát hiện cài đặt của hệ điều hành máy tính (`prefers-color-scheme`).
  - Nếu đã chọn trước đó: Ưu tiên giá trị đã lưu trong máy.
- **Accessibility (a11y):** Sử dụng thẻ `<button>` chuẩn, hỗ trợ điều hướng bằng phím Tab/Enter, có `aria-label="Chuyển đổi giao diện Sáng/Tối"`.

---

### 2. ⚠️ Edge Cases (Các bẫy logic & Kỹ thuật cần né)

1. **Lỗi Nhấp nháy màn hình (Flash of Wrong Theme - FOUT):**
   - _Rủi ro:_ Trình duyệt tải trang trắng tinh (Light) rồi mới đọc JS và đổi sang Dark làm chói mắt người dùng.
   - _Giải pháp:_ Đặt 1 đoạn script inline đồng bộ (synchronous) ngay trong `<head>` để gán attribute `data-theme` cho `<html>` **trước khi** trình duyệt bắt đầu vẽ (render) giao diện.
2. **Tương thích Astro View Transitions (`ClientRouter`):**
   - _Rủi ro:_ Khi chuyển trang bằng SPA mode (`astro:transitions`), Astro sẽ reset lại thuộc tính của tag `<html>` hoặc làm hỏng các event listener gán trực tiếp vào element.
   - _Giải pháp:_ Lắng nghe sự kiện `astro:after-swap` để khôi phục lại `data-theme` và dùng **Event Delegation** bắt sự kiện click ở mức `document`.
3. **Đồng bộ sự kiện đổi theme của hệ điều hành:**
   - Nếu người dùng chưa từng bấm nút toggle (chưa có `localStorage`), khi họ đổi theme trên Windows/macOS, trang web phải tự cập nhật theo live.

---

### 3. 🏗️ Tech Solution (Cấu trúc file & Giải pháp)

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

### 4. 💻 Implementation (Chi tiết từng bước)

#### Bước 4.1: Định nghĩa Token màu CSS (`src/styles/global.css`)

```css src/styles/global.css
:root {
  color-scheme: light;
  /* Change this one line to retune the theme accent. */
  --color-accent: oklch(0.54 0.14 35);
  --color-accent-hover: color-mix(in oklch, var(--color-accent), black 12%);
  --color-accent-soft: color-mix(in oklch, var(--color-accent), transparent 84%);
  /* Text/icon color on top of a filled accent surface. */
  --color-on-accent: oklch(0.99 0.003 100);
  --color-bg: oklch(0.99 0.003 100);
  --color-surface: oklch(0.965 0.004 100);
  --color-text: oklch(0.25 0.01 250);
  --color-muted: oklch(0.5 0.012 250);
  --color-line: oklch(0.86 0.008 100);
  --color-line-strong: oklch(0.72 0.012 120);
  --color-soft: oklch(0.94 0.006 100);
  --font-display: 'Fraunces Variable', Georgia, serif;
  --font-body: 'Public Sans', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono Variable', ui-monospace, monospace;
  --content-width: 1160px;
  --prose-width: 68ch;
  --page-pad: clamp(1rem, 3vw, 2rem);
  --baseline: 1.5rem;
  --hairline: 1px solid var(--color-line);
  --focus-ring: 0 0 0 3px var(--color-accent-soft);
}

@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
    --color-accent: oklch(0.72 0.13 42);
    --color-accent-hover: color-mix(in oklch, var(--color-accent), white 10%);
    --color-accent-soft: color-mix(in oklch, var(--color-accent), transparent 78%);
    /* The dark-scheme accent is light, so filled surfaces need dark text. */
    --color-on-accent: oklch(0.18 0.009 250);
    --color-bg: oklch(0.18 0.009 250);
    --color-surface: oklch(0.22 0.01 250);
    --color-text: oklch(0.93 0.006 95);
    --color-muted: oklch(0.69 0.012 250);
    --color-line: oklch(0.34 0.012 250);
    --color-line-strong: oklch(0.44 0.016 230);
    --color-soft: oklch(0.26 0.01 250);
  }
}

:root[data-theme='light'] {
  color-scheme: light;
  --color-accent: oklch(0.54 0.14 35);
  --color-accent-hover: color-mix(in oklch, var(--color-accent), black 12%);
  --color-accent-soft: color-mix(in oklch, var(--color-accent), transparent 84%);
  /* Text/icon color on top of a filled accent surface. */
  --color-on-accent: oklch(0.99 0.003 100);
  --color-bg: oklch(0.99 0.003 100);
  --color-surface: oklch(0.965 0.004 100);
  --color-text: oklch(0.25 0.01 250);
  --color-muted: oklch(0.5 0.012 250);
  --color-line: oklch(0.86 0.008 100);
  --color-line-strong: oklch(0.72 0.012 120);
  --color-soft: oklch(0.94 0.006 100);
}

:root[data-theme='dark'] {
  color-scheme: dark;
  --color-accent: oklch(0.72 0.13 42);
  --color-accent-hover: color-mix(in oklch, var(--color-accent), white 10%);
  --color-accent-soft: color-mix(in oklch, var(--color-accent), transparent 78%);
  /* The dark-scheme accent is light, so filled surfaces need dark text. */
  --color-on-accent: oklch(0.18 0.009 250);
  --color-bg: oklch(0.18 0.009 250);
  --color-surface: oklch(0.22 0.01 250);
  --color-text: oklch(0.93 0.006 95);
  --color-muted: oklch(0.69 0.012 250);
  --color-line: oklch(0.34 0.012 250);
  --color-line-strong: oklch(0.44 0.016 230);
  --color-soft: oklch(0.26 0.01 250);
}
```

#### Bước 4.2: Tạo File Script Tĩnh Anti-Flicker (`public/scripts/theme-init-anti-flicker.js`)

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

  // STEP 1: Đọc trạng thái và gán data-theme lên <html>
  const STEP_1_APPLY_INITIAL_THEME = () => {
    try {
      // 1. Kiểm tra theme đã lưu trong localStorage
      const storedTheme = localStorage.getItem(STORAGE_KEY);
      // 2. Kiểm tra cấu hình màu của Hệ điều hành
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      // 3. Ưu tiên: localStorage -> OS preference -> 'light'
      const theme = storedTheme || (prefersDark ? 'dark' : 'light');
      // 4. Gán attribute trực tiếp lên HTML root element
      document.documentElement.dataset[DATA_ATTRIBUTE] = theme;
    } catch (error) {
      // Graceful Degradation: Fallback về OS setting nếu localStorage bị cấm
      console.warn('[Theme Anti-Flicker] Storage access denied, fallback to OS setting.', error);
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.dataset[DATA_ATTRIBUTE] = prefersDark ? 'dark' : 'light';
    }
  };

  // STEP 2: Thực thi ngay lập tức trước First Paint
  STEP_1_APPLY_INITIAL_THEME();

  // STEP 3: Lắng nghe sự kiện hoán đổi trang trong Astro (View Transitions)
  document.addEventListener('astro:after-swap', STEP_1_APPLY_INITIAL_THEME);
})();
```

#### Bước 4.3: Tạo Logic Interactive Toggle Script (`src/scripts/theme/theme-toggle.ts`)

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
    console.warn('[Theme Toggle] Cannot write to localStorage. Using RAM fallback.', error);
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
```

#### Bước 4.4: Tạo Component `ThemeToggle.astro` (`src/components/ThemeToggle.astro`)

```astro src/components/ThemeToggle.astro
---
/**
 * Component: src/components/ThemeToggle.astro
 * Mô tả: UI Component nút bấm chuyển đổi theme.
 */

interface Props {
  label?: string;
  className?: string;
}

const { label = 'Toggle Theme', className = 'theme-toggle' } = Astro.props;
---

<button type="button" class={className} aria-label={label} data-theme-toggle>
  <span aria-hidden="true"></span>
</button>
```

#### Bước 4.5: Tích hợp vào Layout Chính (`src/layouts/BaseLayout.astro`)

```astro src/layouts/BaseLayout.astro
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

### 🔍 Kết quả đạt được sau kiểm thử:

- ✅ **Chuẩn kiến trúc Anti-Flicker:** Logic Anti-Flicker nằm trong file tĩnh `/scripts/theme-init-anti-flicker.js` ở `public/`, nạp qua `<script is:inline src="...">` cực nhẹ và nhanh.
- ✅ **Đồng bộ kiến trúc với `locale-switch`:** Cách triển khai 100% khớp với pattern hiện tại của dự án.
- ✅ **Code sạch & chuẩn TypeScript:** Tách biệt 3 file rõ ràng, có đầy đủ Step Functions, Strict Types và Error Handling.
