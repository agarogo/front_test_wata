'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Обзор' },
  { href: '/reconciliation/new', label: 'Новая сверка' },
  { href: '/reconciliation/history', label: 'История' },
  { href: '/reference/commissions', label: 'Комиссии' },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <span className="brand-mark">W</span>
          <span>
            <strong>OnliPay</strong>
            <small>WATA reconciliation</small>
          </span>
        </Link>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)) ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        <header className="top-bar">
          <div>
            <strong>Сверка WATA ↔ OnliPay</strong>
            <span>API: http://10.129.0.9:5050</span>
          </div>
        </header>
        <div className="content-area">{children}</div>
      </main>
    </div>
  );
}
