import React from 'react';
import { ScrollToTopButton } from '@/components/scroll-to-top-button';
import { MascotNotifications } from '@/components/mascot-notifications';
import { Toaster } from '@/components/ui/sonner';
import { I18nProvider } from '@/components/i18n-provider';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://supply.smee.vn'),
  title: {
    default: 'Supply Material – Tìm nhà cung cấp nguyên vật liệu B2B uy tín | SMEE',
    template: '%s | Supply Material – SMEE',
  },
  description:
    'Tìm nhà cung cấp nguyên vật liệu, nhà máy sản xuất đã được SMEE duyệt hồ sơ: nhựa, kim loại, hoá chất, bao bì, máy móc. Gửi yêu cầu báo giá miễn phí.',
  keywords: ['nhà cung cấp nguyên vật liệu', 'tìm nhà cung cấp', 'nguồn hàng B2B', 'nhà máy sản xuất', 'báo giá vật liệu'],
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: 'Supply Material – SMEE',
    images: [{ url: '/images/og-cover.jpg', width: 1200, height: 630 }],
  },
  icons: {
    icon: '/images/smee-logo.png',
    apple: '/images/smee-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Be+Vietnam+Pro:wght@700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased">
        <I18nProvider>
          {children}
          {/* <ScrollToTopButton /> */}
          <MascotNotifications />
          <Toaster />
        </I18nProvider>
      </body>
    </html>
  );
}
