import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://leadwa.co'),
  title: {
    default: 'Leadwa — Stop Losing WhatsApp Leads',
    template: '%s | Leadwa'
  },
  description: 'Smart WhatsApp links that capture every lead. Track clicks, never miss follow-ups. One honest price, no hidden fees.',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://leadwa.co',
    siteName: 'Leadwa',
    title: 'Leadwa — Stop Losing WhatsApp Leads',
    description: 'Smart WhatsApp links that capture every lead. Track clicks, never miss follow-ups. One honest price, no hidden fees.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Leadwa — Stop Losing WhatsApp Leads',
    description: 'Smart WhatsApp links that capture every lead. Track clicks, never miss follow-ups.',
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
