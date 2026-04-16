"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Scanner } from "@yudiel/react-qr-scanner";
import { setItem, getItem, keys } from "@/src/lib/storage";
import {
  ChevronLeft, ScanLine, Zap, Link2, CheckCircle2,
  AlertTriangle, Pencil, X, ArrowRight,
} from "lucide-react";
import { PageTransition } from "@/src/components/PageTransition";
import toast from "react-hot-toast";

/* ── parse QR ── */
function parseQR(raw: string): { token: string; courseId: string; sessionId: string } | null {
  if (raw.startsWith("AUTOSCAN|")) {
    const parts = raw.split("|");
    if (parts.length >= 4 && parts[1].startsWith("TKN-")) {
      return { token: parts[1], courseId: parts[2], sessionId: parts[3] };
    }
    toast.error("Format AUTOSCAN QR tidak lengkap");
    return null;
  }
  if (raw.startsWith("TKN-")) {
    const courseId = getItem(keys.last_course_id);
    const sessionId = getItem(keys.last_session_id);
    if (courseId && sessionId) return { token: raw, courseId, sessionId };
    toast.error("QR biasa: Course/Session ID belum diset");
    return null;
  }
  return null;
}

/* ── validate URL ── */
function isValidUrl(u: string): boolean {
  try { new URL(u.trim()); return true; } catch { return false; }
}

/* ── shorten URL for display ── */
function shortenUrl(u: string): string {
  try {
    const url = new URL(u);
    return url.hostname + (url.pathname.length > 20 ? url.pathname.slice(0, 18) + "…" : url.pathname);
  } catch { return u.slice(0, 40) + "…"; }
}

export default function AutoScan() {
  const router = useRouter();
  const userId = useMemo(() => getItem(keys.user_id), []);

  const [swapUrl, setSwapUrl]     = useState("");
  const [savedUrl, setSavedUrl]   = useState<string | null>(null);
  const [editing, setEditing]     = useState(false);
  const [scanning, setScanning]   = useState(false);   // scanner hanya aktif setelah URL disimpan
  const inputRef                  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!userId) { router.replace("/login"); return; }
    const stored = getItem(keys.swap_gas_url);
    if (stored) { setSavedUrl(stored); setScanning(true); }
  }, [router, userId]);

  // Fokus input ketika editing
  useEffect(() => {
    if (editing) setTimeout(() => inputRef.current?.focus(), 50);
  }, [editing]);

  function saveUrl() {
    const u = swapUrl.trim();
    if (!u) { toast.error("URL tidak boleh kosong"); return; }
    if (!isValidUrl(u)) { toast.error("Format URL tidak valid"); return; }
    setItem(keys.swap_gas_url, u);
    setSavedUrl(u);
    setSwapUrl("");
    setEditing(false);
    setScanning(true);
    toast.success("URL disimpan! Scanner siap");
  }

  function clearUrl() {
    setItem(keys.swap_gas_url, "");
    setSavedUrl(null);
    setScanning(false);
    setEditing(false);
    setSwapUrl("");
  }

  function handleScan(raw: string) {
    if (!scanning) return;
    const parsed = parseQR(raw);
    if (!parsed) return;
    setScanning(false);
    setItem(keys.last_course_id, parsed.courseId);
    setItem(keys.last_session_id, parsed.sessionId);
    // mode=swap → result page akan pakai swapUrl
    router.replace(`/result?token=${encodeURIComponent(parsed.token)}&mode=swap`);
  }

  const urlReady = !!savedUrl && !editing;

  return (
    <PageTransition>
      <div className="relative mx-auto flex h-dvh max-w-md flex-col overflow-hidden bg-black">

        {/* ── KAMERA (selalu di-mount, hidden saat belum ready) ── */}
        <div className={`absolute inset-0 z-0 transition-opacity duration-500 ${urlReady ? "opacity-100" : "opacity-40"}`}>
          <style>{`
            [data-qr-scanner] video,
            [data-qr-scanner] > div,
            [data-qr-scanner] {
              width: 100% !important; height: 100% !important;
              object-fit: cover !important; aspect-ratio: unset !important;
              max-width: unset !important;
            }
          `}</style>
          <Scanner
            onScan={(codes) => { const v = codes?.[0]?.rawValue; if (v) handleScan(v); }}
            onError={() => {}}
            constraints={{ facingMode: "environment" }}
            styles={{
              container: { width: "100%", height: "100%" },
              video: { width: "100%", height: "100%", objectFit: "cover" },
            }}
          />
        </div>

        {/* ── VIGNETTE ── */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-52 bg-gradient-to-b from-black/85 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-64 bg-gradient-to-t from-black/95 to-transparent" />

        {/* ── UI LAYER ── */}
        <div className="relative z-20 flex h-full flex-col">

          {/* TOP BAR */}
          <div className="flex items-center justify-between px-5 pt-14">
            <button
              onClick={() => router.replace("/")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/50 active:scale-95"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">E-Absen</p>
              <p className="text-sm font-bold text-white">Scan QR Otomatis</p>
            </div>
            <div className="flex h-8 items-center gap-1.5 rounded-full bg-yellow-400/20 px-3 text-[11px] font-bold text-yellow-300 backdrop-blur-sm ring-1 ring-yellow-400/20">
              <Zap className="h-3.5 w-3.5" />
              AUTO
            </div>
          </div>

          {/* USER CHIP */}
          <div className="mt-3 px-5">
            <div className="flex items-center gap-2.5 rounded-2xl bg-black/30 px-4 py-2.5 backdrop-blur-sm ring-1 ring-white/10">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-xs font-bold text-white">
                {(userId ?? "?")[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white leading-tight">{userId}</p>
                <p className="text-[11px] text-white/50">Check-in ke sheet kelompok lain</p>
              </div>
              {urlReady && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
                  <CheckCircle2 className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
          </div>

          {/* SCAN FRAME — kuning untuk beda dari scan biasa */}
          <div className="flex flex-1 items-center justify-center">
            {urlReady ? (
              <div className="relative h-60 w-60">
                <div
                  className="absolute inset-x-3 h-0.5 rounded-full bg-yellow-400 shadow-[0_0_10px_3px_rgba(250,204,21,0.5)]"
                  style={{ animation: "autoscanline 2.2s ease-in-out infinite" }}
                />
                <style>{`
                  @keyframes autoscanline {
                    0%   { top: 12px; opacity: 1; }
                    48%  { top: calc(100% - 12px); opacity: 0.5; }
                    50%  { top: calc(100% - 12px); opacity: 0.5; }
                    100% { top: 12px; opacity: 1; }
                  }
                `}</style>
                <div className="absolute left-0  top-0    h-9 w-9 rounded-tl-xl border-l-[3px] border-t-[3px] border-yellow-400" />
                <div className="absolute right-0 top-0    h-9 w-9 rounded-tr-xl border-r-[3px] border-t-[3px] border-yellow-400" />
                <div className="absolute left-0  bottom-0 h-9 w-9 rounded-bl-xl border-b-[3px] border-l-[3px] border-yellow-400" />
                <div className="absolute right-0 bottom-0 h-9 w-9 rounded-br-xl border-b-[3px] border-r-[3px] border-yellow-400" />
                <div className="absolute inset-x-0 bottom-3 flex justify-center">
                  <div className="flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-[11px] text-white backdrop-blur-sm">
                    <ScanLine className="h-3.5 w-3.5 text-yellow-400" />
                    Arahkan ke QR kelompok lain
                  </div>
                </div>
              </div>
            ) : (
              /* Locked state — URL belum diset */
              <div className="flex flex-col items-center gap-3 px-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-400/15 ring-1 ring-yellow-400/30">
                  <AlertTriangle className="h-8 w-8 text-yellow-400" />
                </div>
                <p className="text-sm font-semibold text-white">URL API belum diset</p>
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Paste URL GAS kelompok lain di bawah agar presensi dikirim ke sheet mereka
                </p>
              </div>
            )}
          </div>

          {/* BOTTOM PANEL */}
          <div className="px-4 pb-10 space-y-3">

            {/* URL Config Card */}
            <div className="rounded-2xl bg-black/50 backdrop-blur-md ring-1 ring-white/10 overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                <div className="flex items-center gap-2">
                  <Link2 className="h-3.5 w-3.5 text-yellow-400" />
                  <p className="text-xs font-bold text-white">URL API Kelompok Lain</p>
                </div>
                {savedUrl && !editing && (
                  <button
                    onClick={() => { setEditing(true); setSwapUrl(savedUrl); }}
                    className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-medium text-white/70 transition hover:bg-white/20"
                  >
                    <Pencil className="h-3 w-3" />
                    Ubah
                  </button>
                )}
              </div>

              {/* Saved state */}
              {savedUrl && !editing ? (
                <div className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
                      <p className="text-[10px] font-semibold text-green-400">Tersimpan · Siap digunakan</p>
                    </div>
                    <p className="text-xs text-white/60 font-mono truncate">{shortenUrl(savedUrl)}</p>
                  </div>
                  <button
                    onClick={clearUrl}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-400 transition hover:bg-red-500/30"
                    title="Hapus URL"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                /* Input state */
                <div className="px-4 py-3 space-y-2.5">
                  <textarea
                    ref={inputRef}
                    rows={3}
                    value={swapUrl}
                    onChange={(e) => setSwapUrl(e.target.value)}
                    placeholder="Paste URL GAS kelompok lain di sini&#10;contoh: https://script.google.com/macros/s/..."
                    className="w-full resize-none rounded-xl bg-white/8 px-3 py-2.5 text-xs text-white placeholder:text-white/30 outline-none ring-1 ring-white/10 focus:ring-yellow-400/50 transition font-mono leading-relaxed"
                  />
                  <div className="flex gap-2">
                    {editing && (
                      <button
                        onClick={() => { setEditing(false); setSwapUrl(""); }}
                        className="flex-1 rounded-xl bg-white/10 py-2.5 text-xs font-semibold text-white/70 transition hover:bg-white/15"
                      >
                        Batal
                      </button>
                    )}
                    <button
                      onClick={saveUrl}
                      disabled={!swapUrl.trim()}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-yellow-400 py-2.5 text-xs font-bold text-black transition hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                      Simpan &amp; Aktifkan Scanner
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Back button */}
            <button
              onClick={() => router.replace("/")}
              className="w-full flex items-center justify-center rounded-2xl bg-white/10 py-3 text-sm font-semibold text-white backdrop-blur-sm ring-1 ring-white/10 transition hover:bg-white/20 active:scale-[0.97]"
            >
              Kembali ke Pilihan Mode
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
