import { currencySymbolFor } from './money';

export async function getCurrencySymbol(): Promise<string> {
    return currencySymbolFor('VND');
}

export function formatCurrency(cents: number, symbol: string): string {
    const isVnd = symbol === '₫';
    const amount = isVnd ? cents : cents / 100;
    return `${symbol}${amount.toLocaleString(undefined, {
        minimumFractionDigits: isVnd ? 0 : 2,
        maximumFractionDigits: isVnd ? 0 : 2,
    })}`;
}

export async function formatAmount(cents: number): Promise<string> {
    const symbol = await getCurrencySymbol();
    return formatCurrency(cents, symbol);
}
