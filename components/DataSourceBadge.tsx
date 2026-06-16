const labels: Record<string, string> = {
  excel_upload: 'Данные загружены из Excel',
  linked_run: 'Расчёт выполнен из уже сохранённого run',
  database_period: 'Расчёт выполнен из БД по периоду',
};

export default function DataSourceBadge({ value }: { value?: string | null }) {
  const safe = String(value || 'database_period');
  return <span className="badge badge-info">{labels[safe] || safe}</span>;
}
