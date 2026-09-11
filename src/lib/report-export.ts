export interface ReportSheet {
  name: string;
  rows: Record<string, unknown>[];
}

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function escapeXml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function humanizeHeader(header: string) {
  const dictionary: Record<string, string> = {
    affiliateId: 'ID KOL/KOC',
    affiliateName: 'Tên KOL/KOC',
    affiliateEmail: 'Email KOL/KOC',
    affiliateCode: 'Mã KOL/KOC',
    referralCode: 'Mã giới thiệu',
    referralId: 'ID giới thiệu',
    leadName: 'Tên lead',
    leadEmail: 'Email lead',
    leadPhone: 'SĐT lead',
    company: 'Công ty',
    status: 'Trạng thái',
    notes: 'Ghi chú',
    totalReferrals: 'Tổng giới thiệu',
    approvedReferrals: 'Giới thiệu đã duyệt',
    pendingReferrals: 'Giới thiệu chờ duyệt',
    totalCommissions: 'Số hoa hồng',
    totalEarnings: 'Tổng thu nhập',
    paidEarnings: 'Đã thanh toán',
    balance: 'Số dư',
    joinedDate: 'Ngày tham gia',
    submittedDate: 'Ngày gửi',
    reviewedDate: 'Ngày duyệt',
    reviewedBy: 'Người duyệt',
    reviewNotes: 'Ghi chú duyệt',
    commissionId: 'ID hoa hồng',
    amount: 'Số tiền',
    rate: 'Tỷ lệ',
    conversionAmount: 'Giá trị chuyển đổi',
    createdDate: 'Ngày tạo',
    approvedDate: 'Ngày duyệt',
    paidDate: 'Ngày thanh toán',
    payoutId: 'ID thanh toán',
    method: 'Phương thức',
    requestedDate: 'Ngày yêu cầu',
    processedDate: 'Ngày xử lý',
    totalAffiliates: 'Tổng KOL/KOC',
    totalPayouts: 'Tổng lượt thanh toán',
    totalPayoutAmount: 'Tổng tiền thanh toán',
    totalCommissionAmount: 'Tổng tiền hoa hồng',
    conversionRate: 'Tỷ lệ chuyển đổi (%)',
    utmCode: 'UTM code',
    totalClicks: 'Tổng click',
    uniqueClicks: 'Click duy nhất',
    conversions: 'Chuyển đổi',
    estimatedRevenueCents: 'Doanh thu dự tính',
    estimatedCommissionCents: 'Hoa hồng dự tính',
    smeeInDiscussion: 'SMEE đang trao đổi',
    convertedCustomers: 'Khách đã chuyển đổi',
    conversionCount: 'Số chuyển đổi',
    createdAt: 'Ngày tạo',
    month: 'Tháng',
  };
  return dictionary[header] ?? header.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase());
}

function columnName(index: number) {
  let name = '';
  let value = index + 1;
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

function sheetName(name: string, fallback: string) {
  const cleaned = name.replace(/[\\/?*:[\]]/g, ' ').trim() || fallback;
  return cleaned.slice(0, 31);
}

function normalizeValue(header: string, value: unknown) {
  if (header.endsWith('Cents') && typeof value === 'number') return value / 100;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'bigint') return Number(value);
  return value ?? '';
}

function buildWorksheet(sheet: ReportSheet) {
  const sourceRows = sheet.rows.length ? sheet.rows : [{ empty: 'Không có dữ liệu' }];
  const headers = Object.keys(sourceRows[0]);
  const displayHeaders = headers.map(humanizeHeader);
  const rows = [displayHeaders, ...sourceRows.map((row) => headers.map((header) => normalizeValue(header, row[header])))];
  const widths = headers.map((_, colIndex) => Math.min(Math.max(
    rows.reduce((max, row) => Math.max(max, String(row[colIndex] ?? '').length), 12) + 2,
    12,
  ), 42));

  const colsXml = widths.map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`).join('');
  const rowXml = rows.map((row, rowIndex) => {
    const cells = row.map((value, colIndex) => {
      const ref = `${columnName(colIndex)}${rowIndex + 1}`;
      if (typeof value === 'number' && Number.isFinite(value)) return `<c r="${ref}"><v>${value}</v></c>`;
      return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
    }).join('');
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join('');
  const endRef = `${columnName(headers.length - 1)}${rows.length}`;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols>${colsXml}</cols>
  <sheetData>${rowXml}</sheetData>
  <autoFilter ref="A1:${endRef}"/>
</worksheet>`;
}

function dosDateTime(date = new Date()) {
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosDate, dosTime };
}

function createZip(files: { path: string; content: string }[]) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;
  const { dosDate, dosTime } = dosDateTime();

  for (const file of files) {
    const name = Buffer.from(file.path, 'utf8');
    const data = Buffer.from(file.content, 'utf8');
    const crc = crc32(data);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(data.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, name, data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(data.length, 20);
    centralHeader.writeUInt32LE(data.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, name);

    offset += localHeader.length + name.length + data.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDirectory, end]);
}

export function buildXlsxBuffer(sheets: ReportSheet[]) {
  const safeSheets = sheets.length ? sheets : [{ name: 'Report', rows: [] }];
  const sheetEntries = safeSheets.map((sheet, index) => ({ ...sheet, safeName: sheetName(sheet.name, `Sheet ${index + 1}`), id: index + 1 }));

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  ${sheetEntries.map((sheet) => `<Override PartName="/xl/worksheets/sheet${sheet.id}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}
</Types>`;

  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${sheetEntries.map((sheet) => `<sheet name="${escapeXml(sheet.safeName)}" sheetId="${sheet.id}" r:id="rId${sheet.id}"/>`).join('')}</sheets>
</workbook>`;

  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sheetEntries.map((sheet) => `<Relationship Id="rId${sheet.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${sheet.id}.xml"/>`).join('')}
</Relationships>`;

  const files = [
    { path: '[Content_Types].xml', content: contentTypes },
    { path: '_rels/.rels', content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
    { path: 'xl/workbook.xml', content: workbook },
    { path: 'xl/_rels/workbook.xml.rels', content: workbookRels },
    ...sheetEntries.map((sheet) => ({ path: `xl/worksheets/sheet${sheet.id}.xml`, content: buildWorksheet(sheet) })),
  ];

  return createZip(files);
}
