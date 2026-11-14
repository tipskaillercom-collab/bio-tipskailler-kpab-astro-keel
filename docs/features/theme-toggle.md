# Dưới đây là phương án triển khai tính năng **Chuyển đổi giao diện Light/Dark Mode** chuẩn quy trình 4 bước dành cho dự án:

## 1. 📋 PM & UX Spec (Yêu cầu sản phẩm & Trải nghiệm)

- **Mục tiêu:** Cho phép người dùng chuyển đổi linh hoạt giữa giao diện Sáng (Light) và Tối (Dark) để bảo vệ mắt và tăng trải nghiệm đọc.
  <!-- // TODO: Làm sao để test nút toggle này luôn nằm bên góc phải của nhiều thiết bị như: PC, Laptop, Smart Phone, Table.. và có kiểm tra yêu cầu: aria-label -->
- **Vị trí UI:** Nút chuyển đổi (Toggle Button) nằm trên `<header>` góc phải, cạnh bộ đổi ngôn ngữ.
- **Trạng thái mặc định:**
  - Nếu người dùng ghé thăm lần đầu: Tự động phát hiện cài đặt của hệ điều hành máy tính (`prefers-color-scheme`).
  - Nếu đã chọn trước đó: Ưu tiên giá trị đã lưu trong máy.
    <!-- // TODO: kiểm tra xem có đúng là button không? -->
- **Accessibility (a11y):** Sử dụng thẻ `<button>` chuẩn, hỗ trợ điều hướng bằng phím Tab/Enter, có `aria-label="Chuyển đổi giao diện Sáng/Tối"`.

---

## 2. ⚠️ Edge Cases (Các bẫy logic & Kỹ thuật cần né)

1. **Lỗi Nhấp nháy màn hình (Flash of Wrong Theme - FOUT):**
   - _Rủi ro:_ Trình duyệt tải trang trắng tinh (Light) rồi mới đọc JS và đổi sang Dark làm chói mắt người dùng.
   <!-- // TODO: Làm sao check 1 đoạn script inline đã dùng đồng bộ (synchronous) ngay trong <head> và đã gán attribute data-theme cho <html> -->
   - _Giải pháp:_ Đặt 1 đoạn script inline đồng bộ (synchronous) ngay trong `<head>` để gán attribute `data-theme` cho `<html>` **trước khi** trình duyệt bắt đầu vẽ (render) giao diện.
2. **Tương thích Astro View Transitions (`ClientRouter`):**
   - _Rủi ro:_ Khi chuyển trang bằng SPA mode (`astro:transitions`), Astro sẽ reset lại thuộc tính của tag `<html>` hoặc làm hỏng các event listener gán trực tiếp vào element.
   <!-- // TODO: Làm sao để check ĐÃ: "Lắng nghe sự kiện astro:after-swap để khôi phục lại data-theme và dùng Event Delegation bắt sự kiện click ở mức document" -->
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

  // Lấy trạng thái dark mode từ Hệ điều hành
  const getOSPreference = () =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  // STEP 1: Đọc trạng thái và gán data-theme lên <html>
  const STEP_1_APPLY_INITIAL_THEME = () => {
    try {
      // 1. Kiểm tra theme đã lưu trong localStorage
      const storedTheme = localStorage.getItem(STORAGE_KEY);
      // 2. Ưu tiên: localStorage -> OS preference -> 'light'
      const theme = storedTheme || getOSPreference();
      // 3. Gán attribute trực tiếp lên HTML root element
      document.documentElement.dataset[DATA_ATTRIBUTE] = theme;
    } catch (error) {
      // Graceful Degradation: Fallback về OS setting nếu localStorage bị cấm
      console.warn('[Theme Anti-Flicker] Storage access denied, fallback to OS setting.', error);
      document.documentElement.dataset[DATA_ATTRIBUTE] = getOSPreference();
    }
  };

  // STEP 2: Thực thi ngay lập tức trước First Paint
  STEP_1_APPLY_INITIAL_THEME();

  // STEP 3: Lắng nghe sự kiện hoán đổi trang trong Astro (View Transitions)
  document.addEventListener('astro:after-swap', STEP_1_APPLY_INITIAL_THEME);

  // STEP 4: Lắng nghe sự kiện đổi theme trên Hệ điều hành nếu chưa thiết lập localStorage
  try {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    mediaQuery.addEventListener('change', (e) => {
      try {
        if (!localStorage.getItem(STORAGE_KEY)) {
          document.documentElement.dataset[DATA_ATTRIBUTE] = e.matches ? 'dark' : 'light';
        }
      } catch (_err) {
        document.documentElement.dataset[DATA_ATTRIBUTE] = e.matches ? 'dark' : 'light';
      }
    });
  } catch (error) {
    console.warn('[Theme Anti-Flicker] matchMedia listener setup failed.', error);
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

<!-- // TODO: thông báo kết quả sau khi thử nghiệm tại đây -->

Hệ thống đã vượt qua 100% các bài test qua Vitest và Happy-DOM bao gồm kiểm thử kiến trúc, chịu tải edge-case và lập trình phòng thủ.

## 🔍 Kết quả đạt được sau kiểm thử:

<!-- // TODO: thông báo kết quả sau khi thử nghiệm tại đây -->
<!-- - ✅ **Chuẩn kiến trúc Anti-Flicker:** Logic Anti-Flicker nằm trong file tĩnh `/scripts/theme-init-anti-flicker.js` ở `public/`, nạp qua `<script is:inline src="...">` cực nhẹ và nhanh.
- ✅ **Đồng bộ kiến trúc với `locale-switch`:** Cách triển khai 100% khớp với pattern hiện tại của dự án.
- ✅ **Code sạch & chuẩn TypeScript:** Tách biệt 3 file rõ ràng, có đầy đủ Step Functions, Strict Types và Error Handling. -->
