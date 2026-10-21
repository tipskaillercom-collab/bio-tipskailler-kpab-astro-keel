# Hướng dẫn Phân tích Cấu trúc `src/` và Lộ trình Tối ưu Hình ảnh (Avatar/Banner)

Tài liệu này giải thích ý nghĩa các thư mục/file trong mã nguồn Astro của bạn và định hướng chính xác các bước cần làm để tối ưu hóa hình ảnh.

---

## 1. Giải thích Cấu trúc Thư mục `src/`

```text
src/
├── components          # Các UI component nhỏ dùng chung (button, thẻ, code block...)
│   ├── CodeCopy.astro
│   ├── Comments.astro
│   ├── Pagination.astro
│   ├── SocialLinks.astro
│   └── StructuredData.astro
├── consts.ts           # Lưu các hằng số chung (site title, author, link mạng xã hội,...)
├── content             # Chứa nội dung dạng Markdown/MDX (Blog posts, Works/Portfolio)
│   ├── blog            # Các bài viết blog + hình ảnh đi kèm (như blog-hero.jpg)
│   └── works           # Các dự án cá nhân + hình ảnh đi kèm (như keel-portfolio.jpg)
├── content.config.ts   # Định nghĩa Schema (kiểu dữ liệu) cho phần content ở trên
├── i18n                # Đa ngôn ngữ (English, Japanese, index chung)
├── layouts             # Khung bố cục chung cho trang (Header, Footer, thẻ <head>...)
│   └── BaseLayout.astro
├── lib                 # Các hàm tiện ích (utility functions) hỗ trợ logic
│   └── url.ts
├── pages               # Các trang chính của website (mỗi file .astro ở đây tương ứng với 1 URL)
│   ├── 404.astro
│   ├── about           # Trang giới thiệu cá nhân (thường là nơi chứa Avatar)
│   │   └── index.astro
│   ├── blog            # Trang danh sách và chi tiết blog ([slug].astro)
│   ├── index.astro     # Trang chủ (Bio chính, thường chứa Avatar & Banner nổi bật)
│   ├── og              # Xử lý tự động tạo ảnh Open Graph động
│   ├── rss.xml.ts      # Tạo RSS feed
│   ├── search.astro    # Trang tìm kiếm
│   └── works           # Trang portfolio các dự án cá nhân
└── styles              # CSS toàn cục (Tailwind hoặc custom CSS)
    └── global.css
```

---

## 2. Xác định vị trí cần tối ưu "Avatar / Banner"

Dựa trên cấu trúc trên, hình ảnh Avatar hoặc Banner của trang Bio/Portfolio thường nằm ở các vị trí cốt lõi sau:

1. **Trang chủ (`src/pages/index.astro`):** Nơi hiển thị thông tin giới thiệu ngắn gọn, avatar chính và banner của bạn.
2. **Trang Giới thiệu (`src/pages/about/index.astro`):** Nơi có thể chứa tiểu sử chi tiết kèm theo ảnh cá nhân (Avatar lớn hơn).
3. **Layout chung (`src/layouts/BaseLayout.astro`):** Nơi định nghĩa khung trang, có thể chứa ảnh profile nhỏ (ở thanh header/footer).

---

## 3. Lộ trình từng bước thực hiện với Aider

Để đạt hiệu quả tối ưu điểm Lighthouse và tận dụng `astro:assets`, chúng ta sẽ đi qua các bước nhỏ sau:

### Bước 1: Kiểm tra file cấu hình hình ảnh

Đảm bảo Astro đã mở tính năng assets (mặc định các phiên bản Astro mới đã bật sẵn).

### Bước 2: Thêm/Di chuyển ảnh gốc vào thư mục chuẩn

- Đưa ảnh gốc (avatar, banner) vào thư mục `src/assets/` (nếu chưa có, bạn hãy tạo thư mục này). Component `<Image />` của Astro yêu cầu ảnh phải nằm trong `src/assets/` thì mới có thể tự động resize, chuyển đổi sang WebP/AVIF khi build.

### Bước 3: Cập nhật code tại trang chủ (`src/pages/index.astro`)

- Thay thế thẻ `<img>` thô bằng cú pháp Astro:
  ```astro
  ---
  import { Image } from 'astro:assets';
  import myAvatar from '../assets/avatar.png'; // đường dẫn tới ảnh gốc
  ---

  <Image
    src={myAvatar}
    alt="Tên của bạn - Bio"
    width={150}
    height={150}
    quality={80}
    loading="eager"
  />
  ```

### Bước 4: Kiểm tra và Build thử

- Chạy lệnh `npm run build` để kiểm tra xem Astro có tự động sinh ra các định dạng WebP/AVIF tối ưu hay không.
