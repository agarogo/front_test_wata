"use client";

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getBadgeClass = (s: string): string => {
    switch (s.toLowerCase()) {
      case 'draft':
        return 'badge-draft';
      case 'loaded':
        return 'badge-loaded';
      case 'calculated':
        return 'badge-calculated';
      case 'accepted':
        return 'badge-accepted';
      case 'failed':
        return 'badge-failed';
      case 'processing':
        return 'badge-processing';
      case 'completed':
        return 'badge-completed';
      default:
        return 'badge-default';
    }
  };

  return (
    <span className={`badge ${getBadgeClass(status)}`}>
      {status}
    </span>
  );
}
