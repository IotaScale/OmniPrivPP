import type { Metadata } from 'next';
import { Onest, Sora, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';

/*
 * Type system, matching omnipriv.com (OmniPriv/app/layout.tsx):
 *   Body     Onest 400-700
 *   Display  Sora 500-800 (headings: 700, -0.03em)
 *   Mono     JetBrains Mono 400-500 for IDs, codes and labels
 */
const onest = Onest({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-onest',
  weight: ['400', '500', '600', '700'],
});

const sora = Sora({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sora',
  weight: ['500', '600', '700', '800'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains',
  weight: ['400', '500'],
});

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

import { Toaster } from '@/components/ui/toast';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`h-full antialiased ${onest.variable} ${sora.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        {/* Apply the persisted theme (light by default, like omnipriv.com) before first paint. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('omnipriv-theme');if(t!=='light'&&t!=='dark'){t='light';}document.documentElement.classList.toggle('dark',t==='dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-page text-ink-soft">
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
