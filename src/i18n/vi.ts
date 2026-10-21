// Vietnamese UI dictionary — shipped as a reference translation alongside `en`.
// Copy this file to add your own locale; `UIStrings` makes a missing key a
// type error, so nothing can silently fall back to English.
//
// Scope is UI chrome only — see the note at the top of `en.ts`.
import type { UIStrings } from './en';

export const vi: UIStrings = {
  // Header, footer, and other chrome
  'nav.home': 'Trang chủ',
  'nav.about': 'Giới thiệu',
  'nav.works': 'Dự án',
  'nav.blog': 'Bài viết',
  'nav.search': 'Tìm kiếm',
  'nav.label': 'Điều hướng chính',
  'nav.brandHome': 'Trang chủ {site}',
  'theme.toggle': 'Chuyển đổi giao diện',
  'footer.notes': 'Ghi chú',
  'social.label': 'Liên kết mạng xã hội',

  // Pagination
  'pagination.label': 'Phân trang',
  'pagination.newer': '← Mới hơn',
  'pagination.older': 'Cũ hơn →',
  'pagination.status': 'Trang {current} / {total}',

  // Home
  'home.primaryLinks': 'Liên kết chính',
  'home.viewWorks': 'Xem dự án',
  'home.readNotes': 'Đọc ghi chú',
  'home.overviewLabel': 'Tổng quan chủ đề',
  'home.latestWorksEyebrow': 'Dự án mới nhất',
  'home.allWorks': 'Tất cả dự án',
  'home.workTech': 'Công nghệ của {title}',
  'home.worksEmpty':
    'Thêm dự án vào thư mục <code>src/content/works</code> để hiển thị các dự án mới nhất ở đây.',
  'home.latestBlogEyebrow': 'Bài viết mới nhất',
  'home.allPosts': 'Tất cả bài viết',
  'home.postsEmpty':
    'Thêm bài viết vào thư mục <code>src/content/blog</code> để hiển thị các ghi chú mới nhất ở đây.',

  // Blog index
  'blog.title': 'Blog',
  'blog.titlePaged': 'Blog · Trang {page}',
  'blog.eyebrow': 'Blog',
  'blog.listLabel': 'Danh sách bài viết',
  'blog.tagsEyebrow': 'Thẻ',
  'blog.tagsNavLabel': 'Thẻ bài viết',

  // Tag archive
  'tag.title': 'Bài viết có thẻ “{tag}”',
  'tag.titlePaged': 'Bài viết có thẻ “{tag}” · Trang {page}',
  'tag.description': 'Các bài viết gắn thẻ {tag} trên {site}.',
  'tag.eyebrow': 'Thẻ',
  'tag.lead': 'Các ghi chú được tổng hợp dưới thẻ {tag}.',
  'tag.listLabel': 'Bài viết thẻ {tag}',
  'tag.moreTagsEyebrow': 'Thẻ khác',
  'tag.otherTagsNavLabel': 'Các thẻ blog khác',
  'tag.allPosts': 'Tất cả bài viết',

  // Blog post
  'post.eyebrow': 'Blog',
  'post.readingTime': 'Đọc trong {minutes} phút',
  'post.tocLabel': 'Mục lục',
  'post.contentsEyebrow': 'Nội dung',
  'post.adjacentLabel': 'Bài viết liền kề',
  'post.previous': 'Bài trước',
  'post.next': 'Bài sau',
  'post.relatedEyebrow': 'Liên quan',
  'post.breadcrumbHome': 'Trang chủ',
  'post.breadcrumbBlog': 'Blog',

  // Comments (rendered only when GISCUS.enabled)
  'comments.eyebrow': 'Bình luận',
  'comments.failed': 'Không thể tải bình luận. Đọc luồng thảo luận tại {link}.',
  'comments.failedLink': 'GitHub Discussions ↗',
  'comments.noscript': 'Bình luận yêu cầu JavaScript. Chúng được lưu trữ trên GitHub Discussions.',

  // Works
  'works.title': 'Dự án',
  'works.eyebrow': 'Dự án',
  'works.listLabel': 'Dự án tiêu biểu',
  'work.eyebrow': 'Dự án',
  'work.visit': 'Xem dự án',
  'work.repository': 'Xem mã nguồn',
  'work.stackEyebrow': 'Công nghệ',

  // About
  'about.title': 'Giới thiệu',
  'about.eyebrow': 'Giới thiệu',
  'about.ledgerLabel': 'Tóm tắt kinh nghiệm',

  // Search
  'search.title': 'Tìm kiếm',
  'search.eyebrow': 'Tìm kiếm',
  'search.sectionLabel': 'Tìm kiếm trang web',
  'search.fallback':
    'Chỉ mục tìm kiếm được tạo lúc build. Chạy lệnh <code>npm run build</code> và xem trước trang web để thử nghiệm — tính năng này không khả dụng trên máy chủ phát triển.',

  // 404
  'notFound.title': 'Không tìm thấy trang',
  'notFound.description': 'Trang bạn đang tìm kiếm không tồn tại.',
  'notFound.eyebrow': '404 — Không tìm thấy',
  'notFound.heading': 'Trang này đã trôi đi mất hướng.',
  'notFound.lead':
    'Địa chỉ có thể đã thay đổi hoặc chưa từng tồn tại. Các đường dẫn bên dưới sẽ đưa bạn trở lại vùng nước yên bình.',
  'notFound.linksLabel': 'Liên kết khôi phục',
  'notFound.home': 'Về trang chủ',
  'notFound.blog': 'Đọc blog',
  'notFound.works': 'Xem dự án',
};
