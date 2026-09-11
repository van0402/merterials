import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildAffiliateContractDocument,
  SMEE_CONTRACT_COMPANY,
} from '../../src/lib/affiliate-contract';

const sample = {
  contractNumber: 'SMEE-AFF-2026-DEMO',
  signedDate: '29/07/2026',
  fullName: 'KOL/KOC Dữ Liệu Mẫu',
  phone: '0900000000',
  loginEmail: 'kol.demo@example.com',
  contractEmail: 'kol.demo@example.com',
  affiliateCode: 'DEMO',
  address: 'Địa chỉ dữ liệu mẫu, Việt Nam',
  position: null,
  citizenId: '000000000000',
  citizenIdIssuedAt: '01/01/2026',
  citizenIdIssuedBy: 'Cơ quan cấp dữ liệu mẫu',
  bankName: 'Ngân hàng dữ liệu mẫu',
  bankBranch: null,
  bankProvince: null,
  bankAccountNumber: '0000000000',
  bankAccountHolder: 'KOL KOC DU LIEU MAU',
  signatureData: null,
  creatorType: 'KOC',
  tier: 'STANDARD',
  referralRatePercent: 5,
  cookieDurationDays: 30,
  commissionHoldDays: 30,
};

test('contract contains the requested SMEE legal identity and service wording', () => {
  const serialized = JSON.stringify(buildAffiliateContractDocument(sample));

  assert.equal(SMEE_CONTRACT_COMPANY.taxCode, '2400819252');
  assert.match(serialized, /SMEE MEDIA SERVICES JOINT STOCK COMPANY/);
  assert.match(serialized, /Đào Sư Tích 1/);
  assert.match(serialized, /0912222555/);
  assert.match(serialized, /quảng cáo và tiếp thị trực tuyến/i);
  assert.doesNotMatch(serialized, /khóa học/i);
});

test('contract reflects KOL/KOC commission and seller precedence rules', () => {
  const serialized = JSON.stringify(buildAffiliateContractDocument(sample));

  assert.match(serialized, /5%/);
  assert.match(serialized, /VIP 6%/);
  assert.match(serialized, /SVIP 7%/);
  assert.match(serialized, /chỉ nhận quyền lợi theo vai trò người bán/);
});
