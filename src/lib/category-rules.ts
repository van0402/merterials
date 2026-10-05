export interface CategorySuggestions {
    slug: string;
    matched: string[];
}
const MAX_CATEGORIES = 3;
const CATEGORY_RULES: { slug: string; keywords: string[] }[] = [
  { slug: 'nhua-polymer', keywords: ['nhua', 'polymer', 'masterbatch', 'hat mau', 'tpe', 'tpr', 'pvc'] },
  { slug: 'may-moc-thiet-bi', keywords: ['may', 'thiet bi', 'equipment', 'machine'] },
  { slug: 'tu-dong-hoa', keywords: ['tu dong hoa', 'robot', 'automation'] },
  { slug: 'khuon-mau-co-khi', keywords: ['khuon', 'mold', 'mould', 'co khi', 'cnc', 'tooling'] },
  { slug: 'in-an', keywords: ['in an', 'ban in', 'phim in', 'bon in', 'vat lieu in', 'flexo', 'rfid'] },
  { slug: 'hoa-chat-hoa-dau', keywords: ['hoa chat', 'chemical', 'hoa dau', 'phu gia'] },
    { slug: 'vat-lieu-moi', keywords: ['vat lieu moi', 'new material', 'quang dien', 'optoelectronic', 'ptfe', 'vai khong det', 'nonwoven'] },
  { slug: 'dien-dien-tu-cap', keywords: ['dien tu', 'day cap', 'cap dien', 'cam bien', 'sensor', 'chieu sang'] },
  { slug: 'do-luong-kiem-tra', keywords: ['do luong', 'kiem tra', 'kiem dinh', 'machine vision', '3d scan', 'laser'] },
  { slug: 'kho-van-nang-ha', keywords: ['xe nang', 'kho van', 'nang ha', 'forklift', 'ac quy'] },
  { slug: 'an-toan-nang-luong', keywords: ['an toan', 'pccc', 'nang luong', 'solar'] },
  { slug: 'cntt-phan-mem-ai', keywords: ['phan mem', 'software', 'cntt'] },
  { slug: 'vat-lieu-xay-dung', keywords: ['xay dung', 'gach', 'xi mang'] },
];

export function normalizeText(text: string): string {
    return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

export function suggestCategories(input: {
  industryRaw?: string | null;
  companyName?: string | null;
}): CategorySuggestions[] {
  const text = normalizeText(`${input.industryRaw ?? ''} ${input.companyName ?? ''}`);

  return CATEGORY_RULES.map((rule) => ({
    slug: rule.slug,
    matched: rule.keywords.filter((kw) => new RegExp(`\\b${kw}\\b`).test(text)),
  }))
    .filter((r) => r.matched.length > 0)
    .sort((a, b) => b.matched.length - a.matched.length)
    .slice(0, MAX_CATEGORIES);
}