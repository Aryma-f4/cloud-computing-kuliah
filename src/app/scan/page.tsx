"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/Button";
import { QrScanner } from "@/src/components/QrScanner";

export default function Scan() {
  const router = useRouter();
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-4">
      <h1 className="text-2xl font-semibold">Scan QR Presensi</h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Arahkan kamera ke QR Code di layar.
      </p>
      <QrScanner
        onToken={(token) => {
          router.replace(`/result?token=${encodeURIComponent(token)}`);
        }}
      />
      <Button variant="outline" onClick={() => router.back()}>
        Batal
      </Button>
    </div>
  );
}
