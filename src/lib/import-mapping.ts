export interface ImportableField {
  key: string;
  label: string;
  required?: boolean;
}

export const IMPORTABLE_FIELDS: ImportableField[] = [
  { key: 'companyName', label: 'Tên công ty', required: true },
  { key: 'phone', label: 'Số điện thoại', required: true },
  { key: 'contactName', label: 'Người đại diện' },
  { key: 'contactEmail', label: 'Email' },
  { key: 'website', label: 'Website' },
  { key: 'address', label: 'Địa chỉ' },
  { key: 'province', label: 'Tỉnh/thành' },
  { key: 'taxCode', label: 'Mã số thuế' },
  { key: 'country', label: 'Quốc gia' },
  { key: 'industryRaw', label: 'Ngành nghề' },
];

const FIELD_ALIASES: Record<string, string[]> = {
  companyName: ['ten cong ty', 'cong ty', 'company', 'doanh nghiep'],
  phone: ['dien thoai', 'phone', 'sdt', 'tel'],
  contactName: ['nguoi dai dien', 'contact', 'lien he'],
  contactEmail: ['email', 'e-mail'],
  website: ['website', 'trang web'],
  address: ['dia chi', 'address'],
  province: ['tinh', 'thanh pho', 'province'],
  taxCode: ['ma so thue', 'mst', 'tax code'],
  country: ['quoc gia', 'nuoc', 'country'],
  industryRaw: ['nganh nghe', 'nganh', 'industry', 'linh vuc'],
};

function normalize(str: string) {
  return str
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function guessMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const header of headers) {
    const normalized = normalize(header);
    for (const field of IMPORTABLE_FIELDS) {
      const aliases = FIELD_ALIASES[field.key] || [];
      if (aliases.some((a) => normalized.includes(a))) {
        mapping[header] = field.key;
        break;
      }
    }
  }
  return mapping;
}