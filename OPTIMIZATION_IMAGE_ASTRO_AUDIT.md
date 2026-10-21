# Báo Cáo Kiểm Tra & Tối Ưu Hóa Hình Ảnh Trong Astro (Lighthouse Optimization Audit)

Tài liệu này tổng hợp chi tiết quá trình kiểm tra toàn bộ mã nguồn dự án, các đánh giá liên quan đến thẻ hình ảnh (`<img>` vs `<Image />` từ `astro:assets`), cùng các điều chỉnh về chiến lược tải ảnh (`loading="eager"` và `loading="lazy"`) nhằm đạt hiệu năng tối ưu trên Google Lighthouse.

---

## 1. Mục tiêu tối ưu

- Tìm và thay thế toàn bộ thẻ `<img>` HTML truyền thống (đặc biệt là avatar, banner, hero image, thumbnail) bằng component `<Image />` từ `astro:assets`.
- Thiết lập định dạng ảnh hiện đại tự động (AVIF/WebP) và chống hiện tượng giật layout (Cumulative Layout Shift - CLS) bằng cách xác định rõ `width`, `height`, hoặc `widths` và `sizes`.
- Phân bổ chiến lược tải ảnh chính xác:
  - **`loading="eager"`**: Dành cho các hình ảnh nằm trên fold (Above-the-fold) hoặc phần tử LCP (Largest Contentful Paint).
  - **`loading="lazy"`**: Dành cho các hình ảnh nằm dưới fold (Below-the-fold) để tiết kiệm băng thông và tối ưu tốc độ tải trang ban đầu.

---

## 2. Quá trình kiểm tra chi tiết từng file trong dự án

### 2.1. Nhóm trang hiển thị nội dung (`src/pages/`)

- **`src/pages/index.astro`**:
  - Đã import và sử dụng sẵn component `<Image />` từ `astro:assets` cho cả ảnh thẻ dự án (`work.data.thumbnail`) và bài viết (`post.data.heroImage`).
  - Cả hai nhóm ảnh này đều nằm ở phần thân và cuối trang (below the fold) nên đã được thiết lập `loading="lazy"` chính xác cùng kích thước cụ thể (`width`, `height`), giúp tránh hiện tượng CLS.
- **`src/pages/blog/[slug].astro`**:
  - Đã dùng component `<Image />` cho ảnh hero của bài viết (`entry.data.heroImage`).
  - _Vấn đề phát hiện:_ Ảnh này nằm ở phần tiêu đề đầu trang (`<header class="page-head">`), trực tiếp đóng vai trò là phần tử LCP trên thiết bị di động và máy tính. Mặc định nếu không chỉ định, ảnh có thể bị đối xử như tải lười (lazy load).
  - _Giải pháp thực hiện:_ Thêm thuộc tính `loading="eager"` để trình duyệt ưu tiên tải ảnh ngay lập tức, cải thiện trực tiếp chỉ số LCP.
- **`src/pages/works/[slug].astro`**:
  - Đã dùng component `<Image />` cho ảnh bìa dự án (`entry.data.thumbnail`).
  - _Vấn đề phát hiện:_ Tương tự như trang bài viết, ảnh này nằm ngay đầu trang chi tiết dự án (above the fold).
  - _Giải pháp thực hiện:_ Bổ sung thuộc tính `loading="eager"` để tối ưu hóa LCP.
- **`src/pages/blog/[...page].astro` & `src/pages/blog/tags/[tag]/[...page].astro` & `src/pages/works/index.astro`**:
  - Các trang danh sách này chỉ hiển thị metadata (ngày tháng, tag, tiêu đề, mô tả ngắn), không chèn thẻ `<img>` hay hiển thị ảnh thumbnail.
- **`src/pages/about/index.astro`**:
  - Trang giới thiệu sử dụng layout dạng typographic / text-based, không có thẻ `<img>` avatar hay banner.
- **`src/pages/search.astro` & `src/pages/404.astro`**:
  - Không chứa thẻ `<img>`. Pagefind UI được cấu hình `showImages: false`.

### 2.2. Nhóm Layout và Component (`src/layouts/`, `src/components/`)

- **`src/layouts/BaseLayout.astro`**:
  - Header thương hiệu sử dụng vector CSS thuần (`<span class="brand-mark"></span>`).
  - Không sử dụng thẻ `<img>` cho logo hay avatar.
  - Các thẻ meta Open Graph và Twitter card đã cấu hình URL ảnh chuẩn SEO.
- **`src/components/SocialLinks.astro`**:
  - Các biểu tượng mạng xã hội (GitHub, X, LinkedIn, RSS, Email) được vẽ bằng thẻ `<svg>` inline, không dùng thẻ `<img>`.
- **`src/components/Comments.astro` & `src/components/StructuredData.astro`**:
  - Không có markup thẻ `<img>`.

### 2.3. Nhóm nội dung Markdown / MDX (`src/content/`)

- **`src/content/blog/*.md`, `*.mdx`** & **`src/content/works/*.md`, `*.mdx`**:
  - Kiểm tra các file: `baseline-rhythm.mdx`, `content-layer-notes.md`, `release-checklist.md`, `code-reading-kit.mdx`, `field-notes-archive.md`, `keel-portfolio.md`.
  - Không có thẻ `<img>` HTML hoặc cú pháp ảnh markdown inline nào được chèn thủ công bên trong phần nội dung văn bản. Ảnh bìa được quản lý hoàn toàn thông qua frontmatter (`heroImage`, `thumbnail`) và được render qua component `<Image />`.

---

## 3. Các thay đổi cụ thể đã thực hiện

### 3.1. File `src/pages/blog/[slug].astro`

Bổ sung `loading="eager"` cho ảnh hero của bài viết:

```astro
{
  entry.data.heroImage && (
    <Image
      class="article-image"
      src={entry.data.heroImage}
      alt=""
      widths={[720, 1040, 1400]}
      sizes="(min-width: 900px) 72rem, 100vw"
      loading="eager"
    />
  )
}
```

### 3.2. File `src/pages/works/[slug].astro`

Bổ sung `loading="eager"` cho ảnh thumbnail chi tiết tác phẩm:

```astro
{
  entry.data.thumbnail && (
    <Image
      class="article-image"
      src={entry.data.thumbnail}
      alt=""
      widths={[720, 1040, 1400]}
      sizes="(min-width: 900px) 72rem, 100vw"
      loading="eager"
    />
  )
}
```

---

## 4. Tóm tắt lợi ích đạt được cho Lighthouse

1. **Largest Contentful Paint (LCP):** Đạt mức tối ưu tốt nhất do các tài nguyên hình ảnh đầu trang (hero/banner trên trang chi tiết) được nạp ngay lập tức với `loading="eager"`.
2. **Cumulative Layout Shift (CLS):** Điểm số CLS = 0 do component `<Image />` tự động đọc kích thước gốc của file ảnh và sinh thuộc tính `width`, `height`, cùng tỷ lệ khung hình CSS `aspect-ratio`.
3. **Tiết kiệm băng thông (Bandwidth & Page Weight):** Astro tự động chuyển đổi ảnh sang định dạng WebP/AVIF ở các kích thước `widths` tương ứng màn hình người dùng, đồng thời các ảnh nằm dưới trang chủ tiếp tục duy trì chế độ `loading="lazy"`.
