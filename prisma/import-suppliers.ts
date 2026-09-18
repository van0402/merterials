import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

if (!process.env.IMPORT_FILE) {
  throw new Error('Thiếu biến môi trường IMPORT_FILE — chạy: IMPORT_FILE="đường/dẫn/file.xlsx" npx tsx prisma/import-suppliers.ts');
}
const FILE_PATH: string = process.env.IMPORT_FILE;

function cleanPhone(raw: unknown): string {
  const str = String(raw ?? '').trim();
  return str.replace(/\s+/g, ' ');
}

function cleanText(raw: unknown): string {
  return String(raw ?? '').trim();
}

async function main() {
  const wb = XLSX.readFile(FILE_PATH);
  const sheetName = wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheetName], { defval: '' });

  console.log(`Đọc được ${rows.length} dòng từ sheet "${sheetName}"`);

  let created = 0;
  let skipped = 0;
  const skippedRows: string[] = [];

  for (const row of rows) {
    const companyName = cleanText(row['Tên công ty']);
    const contactName = cleanText(row['Tên người đại diện']);
    const phone = cleanPhone(row['Số điện thoại']);
    const country = cleanText(row['Quốc gia']) || 'Việt Nam';
    const industryRaw = cleanText(row['Ngành nghề']);

    if (!companyName || !phone) {
      skipped++;
      skippedRows.push(companyName || '(không tên)');
      continue;
    }

    const existing = await prisma.supplierProfile.findFirst({
      where: { companyName, phone },
    });
    if (existing) {
      skipped++;
      skippedRows.push(`${companyName} (đã tồn tại)`);
      continue;
    }

    await prisma.supplierProfile.create({
      data: {
        userId: null,
        companyName,
        contactName: contactName || null,
        phone,
        country,
        industryRaw: industryRaw || null,
        status: 'APPROVED',
        isVerified: false,
      },
    });
    created++;
  }

  console.log(`\nHoàn tất: tạo mới ${created} hồ sơ, bỏ qua ${skipped} dòng.`);
  if (skippedRows.length) {
    console.log('Danh sách bỏ qua:');
    skippedRows.forEach((s) => console.log(' -', s));
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
