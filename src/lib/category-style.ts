// Màu và icon theo danh mục, dùng cho ảnh bìa/ảnh sản phẩm khi chưa có ảnh thật

export type CategoryStyle = { from: string; to: string; icon: string };

export const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  'tu-dong-hoa': { from: '#dff3f1', to: '#b9e3de', icon: 'robotic-arm' },
  'nhua-polymer': { from: '#ffe8d3', to: '#fdcfa6', icon: 'molecule' },
  'may-moc-thiet-bi': { from: '#e5eaf1', to: '#c9d3e0', icon: 'mechanical' },
  'vat-lieu-moi': { from: '#ece6f8', to: '#d6c9f0', icon: 'layers' },
  'hoa-chat-hoa-dau': { from: '#e0ecfb', to: '#bcd6f4', icon: 'water-pump' },
  'khuon-mau-co-khi': { from: '#e8e9ee', to: '#d0d3de', icon: 'product-lifecycle' },
  'dien-dien-tu-cap': { from: '#fdf0cc', to: '#f8de94', icon: 'electric-panel' },
  'in-an': { from: '#fbe3ec', to: '#f4c4d6', icon: 'print' },
  'cntt-phan-mem-ai': { from: '#e3e6fb', to: '#c6cdf5', icon: 'technology' },
  'an-toan-nang-luong': { from: '#e0f3e4', to: '#bfe5c8', icon: 'energy-storage' },
  'do-luong-kiem-tra': { from: '#dff4f8', to: '#b9e6ef', icon: 'vision' },
  'kho-van-nang-ha': { from: '#f1e6dc', to: '#e2cdb9', icon: 'scissor-lift' },
};

// Chưa có danh mục, hoặc danh mục lạ
export const DEFAULT_STYLE: CategoryStyle = { from: '#fff0e2', to: '#fde3cb', icon: '' };

// 7 tông nền nhạt cho avatar chữ cái: [nền, chữ]
export const AVATAR_COLORS = [
  ['#fff1e4', '#b45309'], ['#e6f0fc', '#1d5fb4'], ['#e4f5ea', '#15803d'], ['#efe8fa', '#6d3fc0'],
  ['#fdf3d2', '#a16207'], ['#fbe6ee', '#be185d'], ['#e1f4f6', '#0e7490'],
];

// Băm chuỗi thành số cố định: cùng một tên luôn cho cùng một màu
export function hashOf(s: string) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return h;
}

export function initialsOf(name: string) {
  return name
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

// Từ chỉ loại hình / từ chung trong tên công ty: bỏ đi để chữ cái đại diện không ra toàn "CT"
const LEGAL_WORDS = new Set([
  'công', 'ty', 'tnhh', 'cp', 'cổ', 'phần', 'mtv', 'một', 'thành', 'viên', 'trách', 'nhiệm', 'hữu', 'hạn',
  'co', 'ltd', 'limited', 'company', 'corp', 'inc', 'jsc',
  'và', 'sx', 'tm', 'dv', 'sản', 'xuất', 'thương', 'mại', 'dịch', 'vụ',
]);

// Chữ cái đại diện công ty (tối đa 2 ký tự):
// - bỏ phần trong ngoặc (kể cả chữ Hán/Hàn), dấu câu và từ chỉ loại hình
// - tên chỉ còn 1 từ thì lấy 2 ký tự đầu của từ đó
export function companyInitials(name: string) {
  const plain = (s: string) => s.replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);
  let words = plain(name.replace(/\([^)]*\)/g, ' '));
  if (words.length === 0) words = plain(name);
  const core = words.filter((w) => !LEGAL_WORDS.has(w.toLocaleLowerCase('vi')));
  const use = core.length ? core : words;
  if (use.length === 0) return '?';
  if (use.length === 1) return [...use[0]].slice(0, 2).join('').toUpperCase();
  return use
    .slice(0, 2)
    .map((w) => [...w][0])
    .join('')
    .toUpperCase();
}