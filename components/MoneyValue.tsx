"use client";

interface MoneyValueProps {
  value: number | string;
  currency?: 'RUB' | 'USD' | 'USDT';
  locale?: string;
}

export default function MoneyValue({ value, currency = 'RUB', locale = 'ru-RU' }: MoneyValueProps) {
  const num = typeof value === 'string' ? parseFloat(value) || 0 : value;
  
  if (currency === 'RUB') {
    return (
      <span>
        {new Intl.NumberFormat(locale, { 
          style: 'currency', 
          currency: 'RUB' 
        }).format(num)}
      </span>
    );
  }
  
  return (
    <span>
      {new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD' 
      }).format(num)}
    </span>
  );
}
