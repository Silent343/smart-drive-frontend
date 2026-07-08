import { Currency } from '../domain/model/credit-config';

export const DEFAULT_USD_TO_PEN_RATE = 3.75;

export function amountFromPen(amount: number, currency: Currency, usdToPenRate = DEFAULT_USD_TO_PEN_RATE): number {
  return currency === 'USD' ? amount / usdToPenRate : amount;
}

export function moneySymbol(currency: Currency | string | undefined): string {
  return currency === 'USD' ? '$' : 'S/';
}
