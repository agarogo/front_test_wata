'use client';

import { useEffect, useState } from 'react';
import { getHealth } from '../lib/api';

export default function BackendStatus() {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    getHealth()
      .then(() => { if (!cancelled) setOnline(true); })
      .catch(() => { if (!cancelled) setOnline(false); });
    return () => { cancelled = true; };
  }, []);

  if (online === null) return <span>Backend checking...</span>;
  return <span>{online ? 'Backend online' : 'Backend offline'} · API: 5050</span>;
}
