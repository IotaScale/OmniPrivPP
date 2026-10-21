import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'OmniPriv Channel Partner Portal | Zero Trust PAM Platform',
    template: '%s | OmniPriv Partner Portal',
  },
  description: 'Enterprise B2B Channel Sales, Deal Registration, and Enablement Platform for OmniPriv Privileged Access Management.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/omnipriv-icon.png', sizes: '64x64', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
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
