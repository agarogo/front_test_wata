"use client";

interface ApiErrorAlertProps {
  error: string;
  title?: string;
  onRetry?: () => void;
}

export default function ApiErrorAlert({ error, title, onRetry }: ApiErrorAlertProps) {
  return (
    <div className="card error-card">
      <div className="card-header">
        <div className="card-title" style={{ color: 'var(--error)' }}>
          {title || 'Ошибка API'}
        </div>
      </div>
      <div className="card-body">
        <div className="error-message">{error}</div>
        {onRetry && (
          <button onClick={onRetry} className="secondary" style={{ marginTop: '1rem' }}>
            Повторить
          </button>
        )}
      </div>
    </div>
  );
}
