import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import { buildAffiliateContractDocument } from './affiliate-contract';
import {
  buildAffiliateContractTemplateValues,
  type AffiliateContractDocumentData,
} from './contract-template-fields';

export type ContractTemplateSource =
  | {
      kind: 'pdfmake-code';
      templateId: 'affiliate-default';
      name: string;
    }
  | {
      kind: 'external-docx';
      templateId: string;
      name: string;
      fileUrl: string;
      placeholderSyntax?: 'double-curly';
    }
  | {
      kind: 'external-pdf';
      templateId: string;
      name: string;
      fileUrl: string;
      placeholderSyntax?: 'acroform' | 'double-curly';
    };

export const DEFAULT_AFFILIATE_CONTRACT_TEMPLATE: ContractTemplateSource = {
  kind: 'pdfmake-code',
  templateId: 'affiliate-default',
  name: 'Mẫu hợp đồng KOL/KOC mặc định',
};

export interface ContractRenderOptions {
  template?: ContractTemplateSource;
}

export function buildAffiliateContractPdfDefinition(
  data: AffiliateContractDocumentData,
  options: ContractRenderOptions = {},
): TDocumentDefinitions {
  const template = options.template || DEFAULT_AFFILIATE_CONTRACT_TEMPLATE;

  if (template.kind === 'pdfmake-code') {
    return buildAffiliateContractDocument(data);
  }

  throw new Error(
    `Template ${template.kind} cần renderer server-side riêng trước khi tạo PDF trực tiếp từ mẫu ngoài.`,
  );
}

export function buildAffiliateContractExternalTemplatePayload(
  data: AffiliateContractDocumentData,
) {
  return buildAffiliateContractTemplateValues(data);
}
