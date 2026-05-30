import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Solo Cafe",
  description: "Gọi món cafe nhanh chóng",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#d4821f",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-cafe-50 antialiased">
        <div className="mx-auto max-w-md min-h-screen bg-white shadow-sm">
          {children}
        </div>
      </body>
    </html>
  );
}
