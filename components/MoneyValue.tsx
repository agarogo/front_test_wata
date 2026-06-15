function isEmpty(value: unknown) {
  return value === undefined || value === null || value === '' || Number.isNaN(Number(value));
}

export default function MoneyValue({ value, currency = 'RUB' }: { value?: string | number | null; currency?: 'RUB' | 'USDT' }) {
  if (isEmpty(value)) return <span className="muted">—</span>;
  const num = Number(value);
  if (currency === 'USDT') return <span>{num.toLocaleString('ru-RU', { maximumFractionDigits: 6 })} USDT</span>;
  return <span>{num.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽</span>;
}
