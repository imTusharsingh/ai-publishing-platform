import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Admin | AI Publishing Platform',
  description: 'Admin portal for content management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
