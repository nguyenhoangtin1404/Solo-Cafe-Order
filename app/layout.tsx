import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
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
    default: "Vibe Coffee — Phin. Prompt. Pickup.",
  },
  description:
    "Cà phê truyền thống, đặt hàng thông minh. Quét QR → chọn đồ → nhận ngay.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Vibe Coffee",
    description: "Phin. Prompt. Pickup.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#1C0A00",
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
      className={`${spaceGrotesk.variable} ${plusJakartaSans.variable}`}
    >
      <body className="min-h-screen bg-surface">{children}</body>
    </html>
  );
}
