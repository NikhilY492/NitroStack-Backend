import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Shift-Left FinOps — Infrastructure Analysis Dashboard',
  description: 'Autonomous Infrastructure Planning Agent — review and approve AI-generated infrastructure before Terraform is written',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{
        margin: 0,
        padding: '16px',
        background: 'transparent',
        fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
      }}>
        {children}
      </body>
    </html>
  );
}
