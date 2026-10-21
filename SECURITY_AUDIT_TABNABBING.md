# Báo Cáo Kiểm Tra An Toàn Bảo Mật: Phòng Chống Lỗ Hổng Tabnabbing (Reverse Tabnabbing)

## 1. Giới thiệu về lỗ hổng

Khi một thẻ liên kết `<a href="..." target="_blank">` mở một trang web bên ngoài mà không có thuộc tính `rel="noopener noreferrer"`, trang đích có thể chiếm quyền điều khiển của trang mở nó thông qua đối tượng JavaScript `window.opener.location`. Lỗ hổng này (Reverse Tabnabbing) thường bị khai thác để điều hướng người dùng đến các trang giả mạo (phishing) mà người dùng không hề hay biết.

## 2. Quy chuẩn rà soát

- **Bắt buộc có `rel="noopener noreferrer"`**: Tất cả các liên kết ra bên ngoài hệ thống (external domains) có thuộc tính `target="_blank"`.
- **Không cần thêm**:
  - Các liên kết nội bộ trong website (`href="/..."` hoặc dùng `withBase(...)`).
  - Các liên kết `mailto:` (mở ứng dụng email, không mở tài liệu web mới).
  - Các liên kết điều hướng cùng tab (`target` mặc định là `_self`).

---

## 3. Danh sách các file đã được rà soát

| STT | Đường dẫn file                     | Trạng thái trước rà soát                                                                                   | Kết quả xử lý                                          |
| --- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 1   | `src/layouts/BaseLayout.astro`     | Đã có sẵn `rel="noopener noreferrer"` ở link Almanac                                                       | An toàn, không cần sửa đổi                             |
| 2   | `src/components/SocialLinks.astro` | Đã có logic tự động gán `rel="noopener noreferrer"` cho external links                                     | An toàn, không cần sửa đổi                             |
| 3   | `src/pages/works/[slug].astro`     | Thiếu `target="_blank"` và `rel="noopener noreferrer"` cho các link `entry.data.link` và `entry.data.repo` | Đã bổ sung `target="_blank" rel="noopener noreferrer"` |
| 4   | `src/pages/works/index.astro`      | Chỉ chứa liên kết nội bộ                                                                                   | An toàn, không cần sửa đổi                             |
| 5   | `src/pages/about/index.astro`      | Chỉ chứa văn bản tĩnh và layout nội bộ                                                                     | An toàn, không cần sửa đổi                             |

---

## 4. Chi tiết các vị trí đã chỉnh sửa

### `src/pages/works/[slug].astro`

- **Vị trí**: Dòng render nút "Visit" (`entry.data.link`) và link "Repository" (`entry.data.repo`).
- **Thay đổi**: Bổ sung `target="_blank" rel="noopener noreferrer"` để khi người đọc bấm vào link dự án thực tế hoặc repo mã nguồn bên ngoài, trang gốc không bị truy cập và thao tác qua `window.opener`.

---

## 5. Các trường hợp ngoại lệ và lý do không thêm

1. **Navigation menu & Brand link (`src/layouts/BaseLayout.astro`)**:
   - `href={withBase('/')}` và các mục menu (`NAV_ITEMS`) là liên kết nội bộ trong ứng dụng Astro.
   - Lý do: Không mở tab mới và thuộc cùng origin, không thể bị tấn công tabnabbing.

2. **Footer Internal Link (`src/layouts/BaseLayout.astro`)**:
   - `<a href={withBase('/blog/')}>`: Liên kết nội bộ đến trang blog.

3. **Email Links (`mailto:`) trong `src/components/SocialLinks.astro`**:
   - Logic: `link.href.startsWith('mailto:')` được loại trừ không gán `target="_blank" rel="noopener noreferrer"`.
   - Lý do: Giao thức `mailto:` kích hoạt ứng dụng email của hệ điều hành, không mở phiên duyệt web mới nên không có rủi ro `window.opener`.

4. **Work card items (`src/pages/works/index.astro`)**:
   - `<a href={withBase('/works/${work.id}/')}>`: Điều hướng nội bộ đến trang chi tiết dự án.
