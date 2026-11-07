// Bộ giao diện công cụ xử lý đa ngôn ngữ động theo cấu hình hệ thống
export interface LocaleSwitchHelpers {
  // Lấy các phân đoạn (segments) từ đường dẫn URL hiện tại
  getSegments(): string[];

  // Kiểm tra xem phân đoạn có phải là một ngôn ngữ hợp lệ trong danh sách hỗ trợ không
  isValidLocale(seg?: string | null, locales: readonly string[]): boolean;

  // Xác định mã ngôn ngữ hiện tại của URL dựa trên việc phân đoạn đầu tiên có hợp lệ hay không
  getCurrentLocale(pathSegments: string[], hasLocalePrefix: boolean, defaultLocale: string): string;

  // Bóc tách mã ngôn ngữ cũ ra khỏi pathSegments để thu về mảng đường dẫn nội dung thuần túy
  cleanSegments(pathSegments: string[], hasLocalePrefix: boolean): string[];

  // Xây dựng đường dẫn mới: giấu tiền tố nếu trùng với ngôn ngữ hệ thống, thêm tiền tố nếu là ngôn ngữ phụ
  buildPath(preferredLocale: string, cleanSegments: string[], defaultLocale: string): string;
}

// Hàm khởi tạo bộ công cụ
export function createLocaleSwitchHelpers(): LocaleSwitchHelpers;
