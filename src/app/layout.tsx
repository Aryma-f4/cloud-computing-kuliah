import type { Metadata, Viewport } from "next";
import "./globals.css";
import ClientLayout from "@/src/components/ClientLayout";

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
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}