"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard' },
  { href: '/reconciliation/new', label: 'New Reconciliation' },
  { href: '/reconciliation/history', label: 'History' },
  { href: '/reference/commissions', label: 'Reference Data' },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>OnliPay Reconciliation</h2>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname === item.href ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        <header className="top-bar">
          <div className="top-bar-left">
            <span className="app-title">OnliPay Reconciliation</span>
          </div>
          <div className="top-bar-right">
            <span className="api-status">API: http://10.129.0.9:8055</span>
          </div>
        </header>
        <div className="content-area">
          {children}
        </div>
      </main>
    </div>
  );
}
