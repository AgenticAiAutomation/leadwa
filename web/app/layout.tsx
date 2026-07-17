import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://leadwa.co'),
  title: {
    default: 'Leadwa — Your leads stop dying on WhatsApp',
    template: '%s | Leadwa'
  },
  description: 'No lead ever dies on your WhatsApp. Smart link generator with QR codes, click tracking, and follow-up alerts for Indian SMEs. One honest price, no hidden fees.',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://leadwa.co',
    siteName: 'Leadwa',
    title: 'Leadwa — Your leads stop dying on WhatsApp',
    description: 'No lead ever dies on your WhatsApp. Smart link generator with QR codes, click tracking, and follow-up alerts for Indian SMEs.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Leadwa — Your leads stop dying on WhatsApp',
    description: 'No lead ever dies on your WhatsApp. Smart link generator with QR codes, click tracking.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Instrument+Sans:ital,wght@0,400..700;1,400..700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        {children}
      </body>
    </html>
  );
}
