export const PAYOUT_METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
  BANK_TRANSFER_VN: 'Chuyển khoản ngân hàng',
  WIRE_TRANSFER: 'Chuyển khoản quốc tế',
  PAYPAL: 'PayPal',
  CRYPTO: 'Tiền mã hóa',
};

export function payoutMethodLabel(method?: string | null) {
  if (!method) return 'Chưa xác định';
  return PAYOUT_METHOD_LABELS[method] || method;
}
