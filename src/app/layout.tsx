import type { Metadata, Viewport } from 'next';
import { Poppins } from 'next/font/google';
import { PwaRegister } from '@/components/pwa/pwa-register';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'WASATIFY - Belajar Islam Wasathiyah',
  description: 'Platform microlearning Islam Wasathiyah untuk siswa dan guru.',
  verification: {
    google: 'Qu22mbnX8hETZAIqQWmDFpMM4VJT1-REUmWp3XcJoDI',
  },
  manifest: '/manifest.webmanifest',
  applicationName: 'WASATIFY',
  appleWebApp: {
    capable: true,
    title: 'WASATIFY',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
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
    <html lang="id">
      <body className={`${poppins.variable} min-h-screen bg-background font-sans text-foreground antialiased`}>
        <PwaRegister />
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
