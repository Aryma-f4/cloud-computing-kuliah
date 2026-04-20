"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getItem, setItem, keys } from "@/src/lib/storage";
import { ChevronLeft, Server, Globe, CheckCircle2, Save } from "lucide-react";
import { PageTransition } from "@/src/components/PageTransition";
import toast from "react-hot-toast";

type GasMode = "own" | "external";

export default function SettingsPage() {
  const router = useRouter();
  const [mode, setMode] = useState<GasMode>("own");
  const [externalUrl, setExternalUrl] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!getItem(keys.user_id)) { router.replace("/login"); return; }
    const m = (getItem(keys.swap_mode) as GasMode) || "own";
    const u = getItem(keys.swap_gas_url) || "";
    setMode(m);
    setExternalUrl(u);
    setIsLoaded(true);
  }, [router]);

  function save() {
    if (mode === "external") {
      const u = externalUrl.trim();
      if (!u) { toast.error("URL GAS eksternal tidak boleh kosong"); return; }
      try { new URL(u); } catch { toast.error("Format URL tidak valid"); return; }
      setItem(keys.swap_gas_url, u);
    }
    setItem(keys.swap_mode, mode);
    toast.success("Pengaturan disimpan!");
    setTimeout(() => router.replace("/"), 800);
  }

  if (!isLoaded) return null;

  return (
    <PageTransition>
      <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-[#F2F2F7] dark:bg-neutral-950">

        {/* ── HEADER ── */}
        <div className="relative bg-primary px-6 pt-14 pb-8 overflow-hidden rounded-b-3xl">
          <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/10" />
          <div className="relative">
            <button
              onClick={() => router.replace("/")}
              className="flex items-center gap-2 text-white/70 text-sm mb-6 hover:text-white transition"
            >
              <ChevronLeft className="h-4 w-4" />
              Kembali
            </button>
            <h1 className="text-2xl font-bold text-white">Pengaturan</h1>
            <p className="text-sm text-white/60 mt-0.5">Konfigurasi API & mode presensi</p>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="flex-1 px-4 py-6 space-y-4">

          {/* GAS Mode Selector */}
          <div className="rounded-2xl bg-white dark:bg-neutral-900 shadow-sm ring-1 ring-black/5 dark:ring-white/5 overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                Tujuan API Presensi
              </p>
            </div>

            {/* Option: GAS Sendiri */}
            <button
              onClick={() => setMode("own")}
              className={[
                "w-full flex items-center gap-4 px-4 py-4 border-b border-neutral-100 dark:border-neutral-800 text-left transition",
                mode === "own" ? "bg-primary/5 dark:bg-primary/10" : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
              ].join(" ")}
            >
              <div className={[
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                mode === "own" ? "bg-primary" : "bg-neutral-100 dark:bg-neutral-800",
              ].join(" ")}>
                <Server className={`h-5 w-5 ${mode === "own" ? "text-white" : "text-neutral-500"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold leading-tight ${mode === "own" ? "text-primary" : "text-neutral-800 dark:text-neutral-200"}`}>
                  GAS Sendiri
                </p>
                <p className="text-xs text-neutral-400 mt-0.5">Presensi dikirim ke sheet milikmu</p>
              </div>
              {mode === "own" && (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
              )}
            </button>

            {/* Option: GAS Eksternal */}
            <button
              onClick={() => setMode("external")}
              className={[
                "w-full flex items-center gap-4 px-4 py-4 text-left transition",
                mode === "external" ? "bg-amber-50 dark:bg-amber-900/10" : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
              ].join(" ")}
            >
              <div className={[
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                mode === "external" ? "bg-amber-500" : "bg-neutral-100 dark:bg-neutral-800",
              ].join(" ")}>
                <Globe className={`h-5 w-5 ${mode === "external" ? "text-white" : "text-neutral-500"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold leading-tight ${mode === "external" ? "text-amber-700 dark:text-amber-400" : "text-neutral-800 dark:text-neutral-200"}`}>
                  GAS Eksternal
                </p>
                <p className="text-xs text-neutral-400 mt-0.5">Presensi dikirim ke sheet kelompok lain</p>
              </div>
              {mode === "external" && (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-amber-500" />
              )}
            </button>
          </div>

          {/* URL Input — hanya muncul jika mode external */}
          {mode === "external" && (
            <div className="rounded-2xl bg-white dark:bg-neutral-900 shadow-sm ring-1 ring-black/5 dark:ring-white/5 overflow-hidden">
              <div className="px-4 py-3 border-b border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-900/10">
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                  URL GAS Kelompok Lain
                </p>
              </div>
              <div className="px-4 py-4">
                <textarea
                  rows={4}
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder={"Paste URL GAS kelompok lain di sini\ncontoh: https://script.google.com/macros/s/.../exec"}
                  className="w-full resize-none rounded-xl bg-neutral-50 dark:bg-neutral-800 px-3 py-3 text-xs text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-300 dark:placeholder:text-neutral-600 outline-none ring-1 ring-neutral-200 dark:ring-neutral-700 focus:ring-amber-400 transition font-mono leading-relaxed"
                />
                {externalUrl && (
                  <p className="mt-2 text-[11px] text-neutral-400 font-mono truncate">
                    → {externalUrl.slice(0, 60)}{externalUrl.length > 60 ? "…" : ""}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Info box */}
          <div className="rounded-2xl bg-white dark:bg-neutral-900 px-4 py-4 ring-1 ring-black/5 dark:ring-white/5">
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              {mode === "own"
                ? "✅ Semua check-in akan dikirim ke sheet presensi milikmu sendiri."
                : "⚡ Semua check-in akan dikirim ke URL eksternal yang kamu tentukan. Pastikan URL sudah benar sebelum menyimpan."}
            </p>
          </div>

          {/* Save Button */}
          <button
            onClick={save}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-bold text-white shadow-lg shadow-primary/25 transition hover:bg-hover active:scale-[0.98]"
          >
            <Save className="h-4 w-4" />
            Simpan Pengaturan
          </button>
        </div>
      </div>
    </PageTransition>
  );
}
