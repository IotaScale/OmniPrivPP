import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'OmniPriv Channel Partner Portal | AI-Powered PAM Platform',
    template: '%s | OmniPriv Partner Portal',
  },
  description: 'Enterprise B2B Channel Partner Portal for OmniPriv AI-Powered Privileged Access Management. Deal Registration, AI Agent Security, and Commercial Enablement.',
  icons: {
    icon: [
      { url: '/omnipriv-icon.png?v=3', type: 'image/png' },
      { url: '/icon.svg?v=3', type: 'image/svg+xml' },
      { url: '/favicon.ico?v=3', sizes: 'any' },
    ],
    shortcut: '/omnipriv-icon.png?v=3',
    apple: '/apple-touch-icon.png?v=3',
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
