// Hằng số và hàm dùng chung cho tính năng "Cần mua"

export const DURATION_OPTIONS = [7, 15] as const; // số ngày bài hiển thị, tính từ lúc admin duyệt

// Khu vực ưu tiên (chọn từ danh sách để lọc được)
export const SOURCING_AREAS = [
  'Miền Bắc', 'Miền Trung', 'Miền Nam',
  'Hà Nội', 'Hải Phòng', 'Bắc Ninh', 'TP. Hồ Chí Minh', 'Bình Dương', 'Đà Nẵng','Hải Phòng'
] as const;

// "Nguyễn Văn Hùng" -> "Nguyễn H." (chỉ hiện họ + chữ cái đầu của tên, bảo vệ danh tính)
export function shortName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] || 'Thành viên';
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

// Số ngày còn lại tới hạn (làm tròn lên, thấp nhất là 0)
export function daysLeft(expiresAt: Date | string | null) {
  if (!expiresAt) return 0;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000)); // 86.400.000 ms = 1 ngày
}

// "Vừa xong", "2 giờ trước", "Hôm qua", "5 ngày trước"
export function timeAgo(date: Date | string) {
  const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'Hôm qua' : `${days} ngày trước`;
}