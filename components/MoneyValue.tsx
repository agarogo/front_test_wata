function isEmpty(value: unknown) {
  return value === undefined || value === null || value === '' || Number.isNaN(Number(value));
}

function formatNumber(value: string | number, digits: number) {
  const num = Number(value);
  if (Number.isNaN(num)) return '—';
  return num.toFixed(digits).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
}

export default function MoneyValue({ value, currency = 'RUB' }: { value?: string | number | null; currency?: 'RUB' | 'USDT' }) {
  if (isEmpty(value)) return <span className="muted">—</span>;
  if (currency === 'USDT') return <span>{formatNumber(value as string | number, 6)} USDT</span>;
  return <span>{formatNumber(value as string | number, 2)} ₽</span>;
}
