import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "E-Kuliah",
  description: "E-Kuliah — Web presensi mahasiswa dengan scan QR dinamis",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <Toaster position="top-center" />
        {children}
      </body>
    </html>
  );
}
