import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';

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
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <head>
        {/* Apply the persisted theme (dark by default) before first paint. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('omnipriv-theme');if(t!=='light'&&t!=='dark'){t='dark';}document.documentElement.classList.toggle('dark',t==='dark');}catch(e){document.documentElement.classList.add('dark');}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
