const labels: Record<string, string> = {
  draft: 'Черновик',
  data_loaded: 'Данные загружены',
  loaded: 'Данные загружены',
  calculated: 'Рассчитано',
  accepted: 'Принято',
  failed: 'Ошибка',
  pending: 'В обработке',
  processing: 'В обработке',
  completed: 'Завершено',
  success: 'Успешно',
  healthy: 'Online',
};

export default function StatusBadge({ status }: { status?: string | null }) {
  const safe = String(status || 'draft');
  const tone = safe.includes('fail') ? 'danger' : safe.includes('accept') || safe.includes('complete') || safe.includes('calculated') ? 'success' : safe.includes('loaded') ? 'info' : 'muted';
  return <span className={`badge badge-${tone}`}>{labels[safe] || safe}</span>;
}
