# AI QA System Prompt - Locale Switch Architectural Specification

## 🎯 Target Files

- Component UI: `src/components/LocaleToggle.astro`
- Dynamic Script Generator: `src/scripts/locale-switch/init-locale-switch.ts`
- Client Toggler: `src/scripts/locale-switch/locale-switch-toggler.ts`
- Core Helpers: `src/helpers/locale-switch/locale-switch.js`
- Anti-Flicker: `public/scripts/locale-switch-anti-flicker.js`
- Test Output: `tests/locale-switch-feature/000-architectural-spec.test.ts`

## 🧠 System Context & Architectural Prompts

### 🚀 Prompt Phase 1: Deep Architectural & Spec Test

> [!IMPORTANT]  
> Sao chép và dán toàn bộ đoạn lệnh dưới đây vào terminal để kích hoạt AI tự lập trình kịch bản test kiến
> trúc cho tính năng Locale Switch.

```text
Hãy đóng vai trò là một Senior Software Engineer in Test. Phân tích tài liệu kiến trúc Locale Switch tại
`docs/features/locale-switch.md` và tự động tạo toàn bộ các ca kiểm thử chuyên sâu (Production-Ready) bằng
Vitest và Happy-DOM vào file `tests/locale-switch-feature/000-architectural-spec.test.ts`.

Yêu cầu mã test phải bao quát toàn diện các kịch bản kiến trúc cốt lõi sau:

1. **Kịch bản Ưu tiên Khởi tạo & Định tuyến Anti-Flicker (Initial Locale Resolution & SEO Routing):**
   - Đọc chính xác ngôn ngữ lưu trong `localStorage` (Ví dụ: `localStorage = 'vi'` -> Ưu tiên chọn
`'vi'`).
   - Fallback về trình duyệt khi `localStorage` trống (Ví dụ: `navigator.language = 'ja-JP'` -> Chọn
`'ja'`).
   - Fallback về `defaultLocale` khi cả Storage và `navigator.language` không hợp lệ.
   - Thao tác chuẩn hóa URL thừa tiền tố mặc định: Khi URL chứa tiền tố trùng với `defaultLocale` (Ví dụ:
`/ja/about` khi `ja` là default), Anti-Flicker phải kích hoạt điều hướng làm sạch URL về `/about`.
   - Lệch pha Locale: Khi `preferredLocale` khác với locale trên URL hiện tại, kiểm tra việc tự động xây
dựng URL mới và gọi `window.location.href`.

2. **Kịch bản Hạ cấp An toàn (Graceful Degradation / Storage Error Fallback):**
   - Giả lập trường hợp `localStorage` bị chặn truy cập (`SecurityError`).
   - Kiểm tra xem script Anti-Flicker có bỏ qua Storage mà không gây throw unhandled error, tự rơi về
`navigator.language` hoặc `defaultLocale` để gán `document.documentElement.dataset.locale`.

3. **Kịch bản Xoay vòng & Cập nhật Trạng thái (Locale Rotation & State Sync):**
   - Kiểm tra logic xoay vòng qua từng bước khi người dùng click `[data-locale-toggle]`: `en` -> `ja` ->
`vi` -> `en`.
   - Kiểm tra xem thuộc tính `document.documentElement.dataset.locale` và `localStorage.getItem('locale')`
có được cập nhật tức thì trước khi quá trình điều hướng kết thúc hay không.

4. **Kịch bản Tương thích Astro View Transitions (`astro:after-swap`):**
   - Giả lập sự kiện `astro:after-swap` và kiểm tra việc tái thực thi hàm `applyLocale()` để khôi phục
chính xác thuộc tính `data-locale` trên tag `<html>` mới.
   - Kiểm tra Event Delegation trên `document`: Đảm bảo sau khi chuyển trang, bộ lắng nghe click vẫn bắt
được tương tác trên phần tử `[data-locale-toggle]` mới.

Tất cả các ca test phải sử dụng Strict TypeScript, bổ sung comment tiếng Việt chi tiết cho khối Header,
Setup/Teardown và từng bước AAA. Đảm bảo nhường luồng bất đồng bộ bằng `yieldToEventLoop()` để ăn đèn xanh
100% trên Happy-DOM.
```
