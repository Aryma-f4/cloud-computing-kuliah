"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getItem, removeItem, keys } from "@/src/lib/storage";
import { BookOpen, QrCode, ChevronRight, LogOut, Zap } from "lucide-react";
import { PageTransition } from "@/src/components/PageTransition";

export default function ChoicePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [gasMode, setGasMode] = useState<"own" | "external">("own");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const u = getItem(keys.user_id);
    const frameId = requestAnimationFrame(() => {
      setUserId(u);
      setIsLoaded(true);
    });
    if (!u) router.replace("/login");
    return () => cancelAnimationFrame(frameId);
  }, [router]);

  function handleLogout() {
    removeItem(keys.user_id);
    removeItem(keys.device_id);
    removeItem(keys.last_course_id);
    removeItem(keys.last_session_id);
    router.replace("/login");
  }

  if (!isLoaded || !userId) return null;

  return (
    <PageTransition>
      <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-[#F2F2F7] dark:bg-neutral-950">

        {/* ── HERO ── */}
        <div className="relative bg-primary px-6 pt-14 pb-10 overflow-hidden rounded-b-3xl">
          <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/10" />
          <div className="absolute top-8 -right-4 h-24 w-24 rounded-full bg-accent/20" />
          <div className="relative">
            <div className="flex items-center justify-between mb-5">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
                E-Absen
              </span>

              {/* Settings button */}
              <button
                onClick={() => router.push("/settings")}
                className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/80 transition hover:bg-white/25 active:scale-95"
              >
                <Settings className="h-3 w-3" />
                Pengaturan
              </button>
            </div>
            <p className="text-sm text-white/70 font-medium">Selamat datang,</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">{userId}</h1>
            <p className="mt-1 text-sm text-white/60">Pilih mode presensi</p>
          </div>
        </div>

        {/* ── MODE SELECTION ── */}
        <div className="flex-1 px-4 py-8 space-y-4">
          <p className="px-1 text-xs font-semibold uppercase tracking-widest text-neutral-400">
            Pilih Mode
          </p>

          {/* Option 1: Manual */}
          <button
            onClick={() => router.push("/home")}
            className="w-full flex items-center justify-between rounded-2xl bg-white dark:bg-neutral-900 px-5 py-5 text-left shadow-sm ring-1 ring-black/5 dark:ring-white/5 transition-all hover:ring-neutral-200 dark:hover:ring-neutral-700 active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40">
                <BookOpen className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="text-left">
                <p className="font-bold text-base text-neutral-900 dark:text-neutral-100 leading-tight">
                  Course ID Manual
                </p>
                <p className="text-xs text-neutral-400 mt-0.5 max-w-[210px]">
                  Atur Course ID dan Session ID secara manual
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-neutral-300 dark:text-neutral-600 shrink-0" />
          </button>

          {/* Option 2: Auto Scan */}
          <button
            onClick={() => router.push("/autoscan")}
            className="w-full flex items-center justify-between rounded-2xl bg-primary px-5 py-5 text-left shadow-lg shadow-primary/30 transition-all hover:bg-hover active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                <QrCode className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-base text-white leading-tight">
                    Scan QR Otomatis
                  </p>
                  <span className="flex items-center gap-1 rounded-full bg-yellow-400/20 px-2 py-0.5 text-[10px] font-bold text-yellow-300">
                    <Zap className="h-2.5 w-2.5" />
                    AUTO
                  </span>
                </div>
                <p className="text-xs text-white/70 mt-0.5 max-w-[210px]">
                  Course ID terisi otomatis dari QR kelompok lain
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-white/50 shrink-0" />
          </button>

          {/* Info box */}
          <div className="rounded-2xl bg-white dark:bg-neutral-900 px-4 py-4 ring-1 ring-black/5 dark:ring-white/5">
            <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-2">
              Panduan Swap Test
            </p>
            <div className="space-y-1.5 text-[11px] text-neutral-400 dark:text-neutral-500">
              <p>📋 <span className="font-medium text-neutral-600 dark:text-neutral-400">Mode Manual</span> — untuk presensi di kelas sendiri</p>
              <p>⚡ <span className="font-medium text-neutral-600 dark:text-neutral-400">Scan QR Otomatis</span> — untuk scan QR dari sheet kelompok lain saat swap test</p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
