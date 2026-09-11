import { prisma } from './prisma';
import { currencySymbolFor } from './money';

export async function getCurrencySymbol(): Promise<string> {
    try {
        const settings = await prisma.programSettings.findFirst();
        const currency = settings?.currency || 'VND';
        return currencySymbolFor(currency);
    } catch (error) {
        console.error('Failed to fetch currency symbol:', error);
        return '₫';
    }
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
