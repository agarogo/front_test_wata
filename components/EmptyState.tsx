"use client";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="card">
      <div className="empty-state" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{title}</div>
        {description && (
          <div style={{ color: 'var(--muted)', marginBottom: '1rem' }}>{description}</div>
        )}
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
