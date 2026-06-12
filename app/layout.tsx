import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OnliPay Reconciliation',
  description: 'Frontend dashboard для сверки OnliPay/WATA',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
