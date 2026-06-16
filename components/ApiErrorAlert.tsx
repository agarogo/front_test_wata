export default function ApiErrorAlert({ error, title = 'Ошибка', onRetry }: { error: unknown; title?: string; onRetry?: () => void }) {
  const message = typeof error === 'string'
    ? error
    : error && typeof error === 'object' && 'message' in error
      ? String((error as { message?: unknown }).message)
      : 'Не удалось выполнить запрос.';

  return (
    <div className="alert alert-danger">
      <div>
        <strong>{title}</strong>
        <p>{message}</p>
      </div>
      {onRetry && <button className="btn btn-primary" onClick={onRetry}>Повторить</button>}
    </div>
  );
}
