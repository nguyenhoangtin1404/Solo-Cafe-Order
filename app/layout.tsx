import type { Metadata, Viewport } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Vibe Coffee",
    default: "Vibe Coffee — Chill. Order. Sip.",
  },
  description: "Quét QR, gọi đồ, nhận thông báo khi xong — đơn giản vậy thôi.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Vibe Coffee",
    description: "Chill. Order. Sip.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#3D1C02",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${playfairDisplay.variable} ${plusJakartaSans.variable}`}
    >
      <body className="min-h-screen bg-foam">{children}</body>
    </html>
  );
}
