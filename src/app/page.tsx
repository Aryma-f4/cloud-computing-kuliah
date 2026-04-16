"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getItem, removeItem, keys } from "@/src/lib/storage";
import {
  QrCode, PenLine, Settings, ChevronRight, LogOut,
  Zap, Server, Globe,
} from "lucide-react";
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
      setGasMode((getItem(keys.swap_mode) as "own" | "external") || "own");
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
              {/* GAS Mode badge */}
              <span className={[
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                gasMode === "external"
                  ? "bg-amber-400/20 text-amber-200 ring-1 ring-amber-400/30"
                  : "bg-white/20 text-white",
              ].join(" ")}>
                {gasMode === "external"
                  ? <><Globe className="h-3 w-3" />GAS Eksternal</>
                  : <><Server className="h-3 w-3" />GAS Sendiri</>}
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
            <p className="mt-1 text-sm text-white/60">E-Absen · Pilih mode presensi</p>
          </div>
        </div>

        {/* ── MAIN ── */}
        <div className="flex-1 px-4 py-8 space-y-4">

          <p className="px-1 text-xs font-semibold uppercase tracking-widest text-neutral-400">
            Mode Scan
          </p>

          {/* ── Mode 1: Input Manual ── */}
          <button
            onClick={() => router.push("/home")}
            className="w-full flex items-center justify-between rounded-2xl bg-white dark:bg-neutral-900 px-5 py-5 text-left shadow-sm ring-1 ring-black/5 dark:ring-white/5 transition hover:ring-neutral-200 dark:hover:ring-neutral-700 active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40">
                <PenLine className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="text-left">
                <p className="font-bold text-base text-neutral-900 dark:text-neutral-100 leading-tight">
                  Input Manual
                </p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Isi Course ID &amp; Session ID secara manual
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-neutral-300 dark:text-neutral-600 shrink-0" />
          </button>

          {/* ── Mode 2: Scan QR Otomatis ── */}
          <button
            onClick={() => router.push("/autoscan")}
            className="w-full flex items-center justify-between rounded-2xl bg-primary px-5 py-5 text-left shadow-lg shadow-primary/30 transition hover:bg-hover active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                <QrCode className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-base text-white leading-tight">Scan QR Otomatis</p>
                  <span className="flex items-center gap-1 rounded-full bg-yellow-400/20 px-2 py-0.5 text-[10px] font-bold text-yellow-300">
                    <Zap className="h-2.5 w-2.5" />AUTO
                  </span>
                </div>
                <p className="text-xs text-white/70 mt-0.5">
                  Tanpa input manual — Course &amp; Session dari QR
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-white/50 shrink-0" />
          </button>

          {/* ── Divider ── */}
          <div className="flex items-center gap-3 px-1">
            <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Fitur Lain</p>
            <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
          </div>

          {/* ── Settings shortcut ── */}
          <button
            onClick={() => router.push("/settings")}
            className="w-full flex items-center justify-between rounded-2xl bg-white dark:bg-neutral-900 px-5 py-4 text-left shadow-sm ring-1 ring-black/5 dark:ring-white/5 transition hover:ring-neutral-200 dark:hover:ring-neutral-700 active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <Settings className="h-5 w-5 text-neutral-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 leading-tight">Pengaturan API</p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {gasMode === "external" ? "⚡ GAS Eksternal aktif" : "✅ GAS Sendiri aktif"}
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-neutral-300 dark:text-neutral-600 shrink-0" />
          </button>

          {/* ── Logout ── */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between rounded-2xl bg-red-50 dark:bg-red-900/20 px-5 py-4 text-left ring-1 ring-red-100 dark:ring-red-900/40 transition hover:bg-red-100 dark:hover:bg-red-900/30 active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/40">
                <LogOut className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-400 leading-tight">Logout</p>
                <p className="text-xs text-red-400 dark:text-red-500 mt-0.5">Hapus sesi dan keluar</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-red-300 dark:text-red-600" />
          </button>
        </div>
      </div>
    </PageTransition>
  );
}
