# AI QA System Prompt - Locale Switch Security Hardening & Threat Mitigation

## 🎯 Target Files

- Anti-Flicker: `public/scripts/locale-switch-anti-flicker.js`
- Core Helpers: `src/helpers/locale-switch/locale-switch.js`
- Client Toggler: `src/scripts/locale-switch/locale-switch-toggler.ts`
- Test Output: `tests/locale-switch-feature/002-security-hardening.test.ts`

## 🧠 System Context & Security Prompts

### 🚀 Prompt Phase 3: Security Hardening & Threat Mitigation Testing

> [!IMPORTANT]  
> Sao chép và dán toàn bộ đoạn lệnh dưới đây vào terminal để kiểm tra khả năng phòng thủ dữ liệu rác và  
> lỗi môi trường của tính năng Locale Switch.

```text
Hãy tạo file `tests/locale-switch-feature/002-security-hardening.test.ts` chứa các ca kiểm thử bảo mật
nâng cao (Security Hardening & Defensive Testing) cho hệ thống chuyển đổi ngôn ngữ:

1. **Tấn công Tràn bộ nhớ / Storage Quota Exceeded:**
   - Giả lập ngoại lệ `QuotaExceededError` khi gọi `localStorage.setItem('locale', ...)`.
   - Kiểm tra xem khối lệnh `try...catch` hoặc logic điều hướng có hoạt động mượt mà, không làm treo ứng
dụng và vẫn tiếp tục thực hiện điều hướng trang hoặc cập nhật `document.documentElement.dataset.locale`.

2. **Tấn công Tiêm nhiễm Dữ liệu Lưu trữ (Storage Tampering & Malicious Payload Injection):**
   - Tiêm nhiễm các giá trị chứa mã độc XSS hoặc chuỗi không hợp lệ vào `localStorage` (Ví dụ:
`localStorage.setItem('locale', '<script>alert(1)</script>')`, `javascript:void(0)`, hoặc `../../admin`).
   - Kiểm tra xem logic khởi tạo (`determinePreferredLocale` & `isValidLocale`) có lọc bỏ hoàn toàn các
chuỗi này, tự động hạ cấp an toàn về `defaultLocale` và không ghi đè dữ liệu độc hại lên DOM attribute hay
URL.

3. **Tấn công Giả mạo Biến Toàn cục (Global Namespace Clobbering / Tampering):**
   - Kẻ tấn công hoặc extension tự ý xóa hoặc đè giá trị rác vào `window.__NS_ClientLocaleSwitchHelper`
hoặc đối tượng `window.__clientLocaleSwitchHelper`.
   - Kiểm tra xem script Anti-Flicker (`getLocaleConfig`) có kiểm tra guard an toàn (null check), bỏ qua
việc chuyển hướng một cách êm đẹp mà không gây sập ứng dụng (unhandled TypeError).

Mã kiểm thử bắt buộc dùng `Object.defineProperty` để mock storage theo quy chuẩn, sử dụng Strict
TypeScript và có comment Tiếng Việt chi tiết cho từng ca test.
```
