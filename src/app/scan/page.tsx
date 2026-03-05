"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/Button";
import { QrScanner } from "@/src/components/QrScanner";
import { getItem, keys } from "@/src/lib/storage";
import { User, QrCode, Camera } from "lucide-react";

export default function Scan() {
  const router = useRouter();
  useEffect(() => {
    const u = getItem(keys.user_id);
    const c = getItem(keys.last_course_id);
    const s = getItem(keys.last_session_id);
    if (!u || !c || !s) {
      router.replace("/");
    }
  }, [router]);
  return (
    <section className="bg-gray-100 dark:bg-neutral-950 min-h-dvh">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-8 p-6">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
            Laman Presensi
          </div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Scan QR Presensi
          </div>
          <div className="mt-3 inline-flex items-center justify-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
            <User className="h-4 w-4" />
            NIM: <span className="font-semibold">{getItem(keys.user_id) || "User"}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-4 inline-flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
            <Camera className="h-4 w-4" />
            Arahkan kamera ke QR Code di layar kelas.
          </div>
          <div className="overflow-hidden rounded-xl">
            <QrScanner
              onToken={(token) => {
                router.replace(`/result?token=${encodeURIComponent(token)}`);
              }}
            />
          </div>
        </div>

        <div className="mt-2 flex gap-4">
          <Button
            onClick={() => router.replace("/status")}
            className="h-14 w-full rounded-xl bg-neutral-900 text-white shadow-none hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
          >
            <QrCode className="mr-2 h-5 w-5" />
            Cek Status Presensi
          </Button>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="h-14 w-full rounded-xl border-neutral-200 text-neutral-700 shadow-none hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900 transition-colors"
          >
            Batal
          </Button>
        </div>
      </div>
    </section>
  );
}
