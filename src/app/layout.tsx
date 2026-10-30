import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Poppins } from 'next/font/google';
import { PwaRegister } from '@/components/pwa/pwa-register';
import { CopyGuard } from '@/components/shared/copy-guard';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Wasatify - Belajar Islam Wasathiyah',
  description: 'Wasathiyah Smart Learning for Youth',
  verification: {
    google: 'Qu22mbnX8hETZAIqQWmDFpMM4VJT1-REUmWp3XcJoDI',
  },
  manifest: '/manifest.webmanifest?v=20260521',
  applicationName: 'Wasatify',
  appleWebApp: {
    capable: true,
    title: 'Wasatify',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icons/favicon-16-v2.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32-v2.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/wasatify-web-icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/wasatify-web-icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: [{ url: '/favicon.ico' }],
    apple: [{ url: '/icons/apple-touch-icon-v2.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#006B4F',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" data-scroll-behavior="smooth">
      <body className={`${poppins.variable} min-h-screen bg-background font-sans text-foreground antialiased`}>
        <PwaRegister />
        <CopyGuard />
        {children}
        {process.env.NODE_ENV === 'development' && (
          <Script src="/feedback-widget.js" strategy="afterInteractive" />
        )}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
