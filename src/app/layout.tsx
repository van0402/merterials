import React from 'react';
import { ScrollToTopButton } from '@/components/scroll-to-top-button';
import { MascotNotifications } from '@/components/mascot-notifications';
import { Toaster } from '@/components/ui/sonner';
import { I18nProvider } from '@/components/i18n-provider';
import './globals.css';

export const metadata = {
  title: 'Supply Merterial',
  description: 'Danh bạ doanh nghiệp cung cấp nguyên vật liệu.',
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
