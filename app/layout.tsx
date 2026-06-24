import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { Toaster } from "sonner";
import { NavController } from "@/components/layout/NavController";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

const appUrl = (
  process.env.NEXT_PUBLIC_APP_URL ?? "https://vibe-cafe.vercel.app"
).replace(/\/$/, "");

export const viewport: Viewport = {
  themeColor: "#ffb000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // prevents iOS auto-zoom on input focus
  viewportFit: "cover", // allow content to extend into notch/Dynamic Island safe area
};

export const metadata: Metadata = {
  title: "Vibe Cafe",
  description: "Đặt đồ uống yêu thích tại Vibe Cafe — nhanh, dễ, không cần app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Vibe Cafe",
  },
  openGraph: {
    title: "Vibe Cafe",
    description: "Scan QR, chọn đồ, đặt ngay — không cần app",
    url: appUrl,
    siteName: "Vibe Cafe",
    locale: "vi_VN",
    type: "website",
    images: [
      {
        url: `${appUrl}/icons/icon-512.png`,
        width: 512,
        height: 512,
        alt: "Vibe Cafe",
      },
    ],
  },
  icons: {
    apple: "/icons/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${beVietnamPro.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <NavController />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
