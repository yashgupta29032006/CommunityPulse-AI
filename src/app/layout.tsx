import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'CommunityPulse AI - Singapore Decision Intelligence Platform',
  description: 'An AI-powered urban analytics, predictive risk mapping, and decision orchestration platform for Singapore. Grounded in Gemini.',
  keywords: ['Singapore', 'Decision Intelligence', 'Gemini AI', 'APAC Challenge', 'Urban Planning', 'Sustainability'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
