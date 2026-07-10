import { Inter } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { ADMIN_APP_NAME } from '@repo/shared';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: `${ADMIN_APP_NAME} | AI Pipeline`,
  description: 'Admin portal for the AI publishing pipeline',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${GeistSans.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.className} thin-scrollbar font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
