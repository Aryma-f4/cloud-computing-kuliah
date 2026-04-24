'use client';

import { Toaster } from "react-hot-toast";
import dynamic from "next/dynamic";

// Dynamically import BackendModeToggle to avoid SSR issues
const BackendModeToggle = dynamic(
  () => import("@/src/components/BackendModeToggle"),
  { 
    ssr: false,
    loading: () => null // Don't show loading state
  }
);

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Toaster position="top-center" />
      {children}
      <BackendModeToggle />
    </>
  );
}