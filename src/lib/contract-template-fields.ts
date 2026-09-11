export const SMEE_CONTRACT_COMPANY = {
  internationalName: 'SMEE MEDIA SERVICES JOINT STOCK COMPANY',
  taxCode: '2400819252',
  taxAddress: 'Số 14 đường Đào Sư Tích 1, Phường Bắc Giang, Tỉnh Bắc Ninh, Việt Nam',
  address: 'Số 14 đường Đào Sư Tích 1, Phường Bắc Giang, Tỉnh Bắc Ninh, Việt Nam',
  phone: '0912222555',
} as const;

export interface AffiliateContractDocumentData {
  contractNumber: string;
  signedDate: string;
  fullName: string;
  phone: string;
  loginEmail: string;
  contractEmail: string;
  affiliateCode: string;
  address: string;
  position?: string | null;
  citizenId: string;
  citizenIdIssuedAt: string;
  citizenIdIssuedBy: string;
  bankName: string;
  bankBranch?: string | null;
  bankProvince?: string | null;
  bankAccountNumber: string;
  bankAccountHolder: string;
  signatureData?: string | null;
  creatorType: string;
  tier: string;
  referralRatePercent: number;
  cookieDurationDays: number;
  commissionHoldDays: number;
}

export type AffiliateContractTemplateField = keyof AffiliateContractDocumentData | 'companyName' | 'companyTaxCode' | 'companyTaxAddress' | 'companyAddress' | 'companyPhone';

export function buildAffiliateContractTemplateValues(
  data: AffiliateContractDocumentData,
): Record<AffiliateContractTemplateField, string> {
  return {
    contractNumber: data.contractNumber,
    signedDate: data.signedDate,
    fullName: data.fullName,
    phone: data.phone,
    loginEmail: data.loginEmail,
    contractEmail: data.contractEmail,
    affiliateCode: data.affiliateCode,
    address: data.address,
    position: data.position || 'Không áp dụng',
    citizenId: data.citizenId,
    citizenIdIssuedAt: data.citizenIdIssuedAt,
    citizenIdIssuedBy: data.citizenIdIssuedBy,
    bankName: data.bankName,
    bankBranch: data.bankBranch || 'Không cung cấp',
    bankProvince: data.bankProvince || 'Không cung cấp',
    bankAccountNumber: data.bankAccountNumber,
    bankAccountHolder: data.bankAccountHolder,
    signatureData: data.signatureData || '',
    creatorType: data.creatorType,
    tier: data.tier,
    referralRatePercent: String(data.referralRatePercent),
    cookieDurationDays: String(data.cookieDurationDays),
    commissionHoldDays: String(data.commissionHoldDays),
    companyName: SMEE_CONTRACT_COMPANY.internationalName,
    companyTaxCode: SMEE_CONTRACT_COMPANY.taxCode,
    companyTaxAddress: SMEE_CONTRACT_COMPANY.taxAddress,
    companyAddress: SMEE_CONTRACT_COMPANY.address,
    companyPhone: SMEE_CONTRACT_COMPANY.phone,
  };
}
