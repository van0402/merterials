import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import pdfMake from 'pdfmake';
import { buildAffiliateContractDocument } from '../src/lib/affiliate-contract';

const outputDirectory = path.resolve('output/pdf');
const outputFile = path.join(outputDirectory, 'hop-dong-kol-koc-smee-mau.pdf');
const fontDirectory = path.resolve('node_modules/pdfmake/fonts/Roboto');

const definition = buildAffiliateContractDocument({
  contractNumber: 'SMEE-AFF-2026-DEMO',
  signedDate: '29/07/2026',
  fullName: 'KOL/KOC Dữ Liệu Mẫu',
  phone: '0900000000',
  loginEmail: 'kol.demo@example.com',
  contractEmail: 'kol.demo@example.com',
  affiliateCode: 'DEMO',
  address: 'Địa chỉ dữ liệu mẫu, Việt Nam',
  position: 'Đối tác nội dung',
  citizenId: '000000000000',
  citizenIdIssuedAt: '01/01/2026',
  citizenIdIssuedBy: 'Cơ quan cấp dữ liệu mẫu',
  bankName: 'Ngân hàng dữ liệu mẫu',
  bankBranch: 'Chi nhánh dữ liệu mẫu',
  bankProvince: 'Tỉnh dữ liệu mẫu',
  bankAccountNumber: '0000000000',
  bankAccountHolder: 'KOL KOC DU LIEU MAU',
  signatureData: null,
  creatorType: 'KOC',
  tier: 'STANDARD',
  referralRatePercent: 5,
  cookieDurationDays: 30,
  commissionHoldDays: 30,
});

async function main() {
  await mkdir(outputDirectory, { recursive: true });
  pdfMake.addFonts({
    Roboto: {
      normal: path.join(fontDirectory, 'Roboto-Regular.ttf'),
      bold: path.join(fontDirectory, 'Roboto-Medium.ttf'),
      italics: path.join(fontDirectory, 'Roboto-Italic.ttf'),
      bolditalics: path.join(fontDirectory, 'Roboto-MediumItalic.ttf'),
    },
  });
  pdfMake.setUrlAccessPolicy(() => false);
  pdfMake.setLocalAccessPolicy((filePath) => filePath.startsWith(fontDirectory));
  await pdfMake.createPdf(definition).write(outputFile);
  console.log(outputFile);
}

void main();
