import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OmniPriv Channel Partner Portal',
  description: 'B2B Channel Sales Platform for OmniPriv Privileged Access Management',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">
        {children}
      </body>
    </html>
  );
}
