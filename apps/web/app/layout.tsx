import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Publishing Platform',
  description: 'Automated AI-powered news and article publishing',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
