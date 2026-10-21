# Báo Cáo Kiểm Tra & Tối Ưu Hóa SEO & Open Graph Meta Tags (SEO & Social Sharing Audit)

Tài liệu này tổng hợp toàn bộ quá trình rà soát, tinh chỉnh và nâng cấp hệ thống thẻ meta SEO, hình ảnh xem trước Open Graph (OG), Twitter Cards, cùng việc tích hợp liên kết mạng xã hội và hỗ trợ đa ngôn ngữ trong dự án Astro.

---

## 1. Mục tiêu tối ưu
- Cập nhật và chuẩn hóa hệ thống thẻ SEO Meta Tags (Title, Description, Canonical URL, Open Graph, Twitter Cards).
- Chuẩn hóa định dạng và tỷ lệ hình ảnh chia sẻ mạng xã hội (Open Graph Images):
  - **Kích thước tiêu chuẩn:** `1200 x 630 px`.
  - **Tỷ lệ chuẩn:** `1.91:1`.
  - **Định dạng & Dung lượng:** JPG chất lượng cao, dung lượng tối ưu dưới 300KB để tăng tốc độ xem trước link khi chia sẻ trên Facebook, Zalo, LinkedIn, X/Twitter.
- Bổ sung và đồng bộ hỗ trợ ngôn ngữ Tiếng Việt (`vi`) bên cạnh Tiếng Anh (`en`).
- Cập nhật thông tin profile mạng xã hội (GitHub) và thêm phương thức liên hệ qua Gmail.

---

## 2. Quá trình kiểm tra và chuẩn hóa chi tiết

### 2.1. Chuẩn hóa hình ảnh chia sẻ mạng xã hội (Open Graph Images)
- **Chuẩn bị asset trong thư mục `public/`:**
  - `og-image-vi.jpg`: Ảnh đại diện Open Graph dành riêng cho giao diện/ngôn ngữ Tiếng Việt.
  - `og-image-en.jpg`: Ảnh đại diện Open Graph dành cho giao diện Tiếng Anh.
  - `og.jpg`: Ảnh Open Graph mặc định toàn site.
- **Tiêu chuẩn kỹ thuật đạt được:**
  - Độ phân giải: `1200 x 630 px`.
  - Tỷ lệ khung hình: `1.91:1` (chuẩn khuyến nghị chính thức của Facebook & Open Graph Protocol).
  - Tối ưu dung lượng: Đều được nén dưới ngưỡng **300KB**, giúp crawler nạp ảnh gần như tức thì mà không bị timeout.

### 2.2. Tối ưu hệ thống thẻ Meta SEO (`src/layouts/BaseLayout.astro`)
- **Open Graph tags:**
  - Khai báo đầy đủ: `og:title`, `og:description`, `og:image`, `og:image:width` (1200), `og:image:height` (630), `og:type`, `og:url`.
  - Tự động fallback về ảnh mặc định khi bài viết hoặc dự án không có ảnh đại diện riêng.
- **Twitter Card tags:**
  - Khai báo thẻ `twitter:card` kiểu `summary_large_image`.
  - Đồng bộ `twitter:title`, `twitter:description`, và `twitter:image`.
- **Thẻ Canonical & Alternate:**
  - Khai báo URL chính tắc (`rel="canonical"`), tránh trùng lặp nội dung.

### 2.3. Cập nhật liên kết Social & Kênh liên hệ (`src/consts.ts` & `src/components/SocialLinks.astro`)
- Bổ sung kênh liên hệ qua Gmail (`mailto:`) và cập nhật profile GitHub chính xác.
- Đảm bảo các liên kết ngoài mở tab mới an toàn với `rel="noopener noreferrer"`, riêng liên kết `mailto:` giữ nguyên hành vi mở app mặc định.

### 2.4. Hỗ trợ đa ngôn ngữ (Localization - Tiếng Việt & Tiếng Anh)
- Hoàn thiện tệp dịch ngữ `src/i18n/vi.ts` đồng bộ với `src/i18n/en.ts`.
- Gán thẻ `lang="vi"` hoặc `lang="en"` tương ứng trên phần tử `<html>` để công cụ tìm kiếm nhận diện ngôn ngữ nội dung chính xác.

---

## 3. Bảng tổng hợp thông số Open Graph chuẩn hóa

| Thuộc tính | Giá trị tối ưu | Ghi chú |
| :--- | :--- | :--- |
| **Kích thước (Dimensions)** | `1200 x 630 px` | Hiển thị sắc nét trên cả desktop và mobile |
| **Tỷ lệ (Aspect Ratio)** | `1.91:1` | Tiêu chuẩn bắt buộc cho dạng `summary_large_image` |
| **Định dạng file** | JPG | Khả năng tương thích 100% trên mọi nền tảng |
| **Giới hạn dung lượng** | `< 300 KB` | Tránh bị crawler bỏ qua do nạp chậm |
| **Các biến thể ngôn ngữ** | `og-image-vi.jpg`, `og-image-en.jpg` | Đem lại trải nghiệm bản địa hóa chuyên nghiệp |

---

## 4. Tóm tắt lợi ích đạt được
1. **Tỷ lệ nhấp chuột (CTR) khi chia sẻ link:** Giao diện xem trước trên các mạng xã hội (Facebook, LinkedIn, X, Telegram, Zalo) hiển thị đầy đủ hình ảnh lớn, tiêu đề rõ ràng và mô tả ngắn gọn, tăng độ tin cậy và thu hút tương tác.
2. **Khả năng nhận diện thương hiệu:** Hình ảnh xem trước đồng bộ nhận diện cá nhân và dự án với bố cục chuẩn quốc tế.
3. **Thân thiện với SEO đa vùng miền:** Google và các search engine phân biệt rõ ràng ngôn ngữ trang (Tiếng Việt / Tiếng Anh), giúp cải thiện thứ hạng tìm kiếm tương ứng theo từng khu vực địa lý.
