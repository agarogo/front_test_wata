"use client";

interface LoadingStateProps {
  label?: string;
}

export default function LoadingState({ label = "Загрузка..." }: LoadingStateProps) {
  return (
    <div className="card">
      <div className="empty-state" style={{ textAlign: 'center', padding: '2rem' }}>
        <div className="loading-spinner"></div>
        <div style={{ marginTop: '1rem' }}>{label}</div>
      </div>
    </div>
  );
}
