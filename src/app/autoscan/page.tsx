"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Scanner } from "@yudiel/react-qr-scanner";
import { setItem, getItem, keys } from "@/src/lib/storage";
import { ChevronLeft, ScanLine, Zap } from "lucide-react";
import { PageTransition } from "@/src/components/PageTransition";
import toast from "react-hot-toast";

/**
 * Parse QR dari sheet kelompok lain.
 * Format yang didukung:
 *   AUTOSCAN|TKN-XXXXXX|course_id|session_id   ← format utama swap test
 *   TKN-XXXXXX                                  ← format lama (butuh course+session sudah di-set)
 */
function parseQR(raw: string): { token: string; courseId: string; sessionId: string } | null {
  // Format utama autoscan
  if (raw.startsWith("AUTOSCAN|")) {
    const parts = raw.split("|");
    if (parts.length >= 4 && parts[1].startsWith("TKN-")) {
      return { token: parts[1], courseId: parts[2], sessionId: parts[3] };
    }
    toast.error("Format AUTOSCAN QR tidak lengkap");
    return null;
  }
  // Format lama — fallback jika course/session sudah ada di localStorage
  if (raw.startsWith("TKN-")) {
    const courseId = getItem(keys.last_course_id);
    const sessionId = getItem(keys.last_session_id);
    if (courseId && sessionId) {
      return { token: raw, courseId, sessionId };
    }
    toast.error("QR lama: Course/Session ID belum diset");
    return null;
  }
  return null;
}

export default function AutoScan() {
  const router = useRouter();
  const userId = useMemo(() => getItem(keys.user_id), []);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    if (!userId) router.replace("/login");
  }, [router, userId]);

  function handleScan(raw: string) {
    if (!scanning) return;
    const parsed = parseQR(raw);
    if (!parsed) return; // toast sudah ditampilkan di parseQR
    setScanning(false);
    // Simpan course dan session ke localStorage agar result page bisa baca
    setItem(keys.last_course_id, parsed.courseId);
    setItem(keys.last_session_id, parsed.sessionId);
    router.replace(`/result?token=${encodeURIComponent(parsed.token)}`);
  }

  return (
    <PageTransition>
      <div className="relative mx-auto flex h-dvh max-w-md flex-col overflow-hidden bg-black">

        {/* ── KAMERA FULL SCREEN ── */}
        <div className="absolute inset-0 z-0">
          <style>{`
            [data-qr-scanner] video,
            [data-qr-scanner] > div,
            [data-qr-scanner] {
              width: 100% !important;
              height: 100% !important;
              object-fit: cover !important;
              aspect-ratio: unset !important;
              max-width: unset !important;
            }
          `}</style>
          <Scanner
            onScan={(codes) => {
              const val = codes?.[0]?.rawValue;
              if (val) handleScan(val);
            }}
            onError={() => toast.error("Gagal membaca kamera")}
            constraints={{ facingMode: "environment" }}
            styles={{
              container: { width: "100%", height: "100%" },
              video: { width: "100%", height: "100%", objectFit: "cover" },
            }}
          />
        </div>

        {/* ── VIGNETTE ── */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-52 bg-gradient-to-b from-black/80 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-60 bg-gradient-to-t from-black/90 to-transparent" />

        {/* ── UI LAYER ── */}
        <div className="relative z-20 flex h-full flex-col">

          {/* TOP BAR */}
          <div className="flex items-center justify-between px-5 pt-14">
            <button
              onClick={() => router.replace("/")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/50 active:scale-95"
              aria-label="Kembali"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">E-Absen</p>
              <p className="text-sm font-bold text-white">Scan QR Otomatis</p>
            </div>

            {/* AUTO badge */}
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
                <p className="text-[11px] text-white/50 leading-tight">
                  Course &amp; Session otomatis dari QR
                </p>
              </div>
            </div>
          </div>

          {/* SCAN FRAME — kuning untuk beda dari scan biasa */}
          <div className="flex flex-1 items-center justify-center">
            <div className="relative h-60 w-60">
              {/* Animated scan line kuning */}
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

              {/* Corner brackets kuning */}
              <div className="absolute left-0  top-0    h-9 w-9 rounded-tl-xl border-l-[3px] border-t-[3px] border-yellow-400" />
              <div className="absolute right-0 top-0    h-9 w-9 rounded-tr-xl border-r-[3px] border-t-[3px] border-yellow-400" />
              <div className="absolute left-0  bottom-0 h-9 w-9 rounded-bl-xl border-b-[3px] border-l-[3px] border-yellow-400" />
              <div className="absolute right-0 bottom-0 h-9 w-9 rounded-br-xl border-b-[3px] border-r-[3px] border-yellow-400" />

              {/* Center hint */}
              <div className="absolute inset-x-0 bottom-3 flex justify-center">
                <div className="flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-[11px] text-white backdrop-blur-sm">
                  <ScanLine className="h-3.5 w-3.5 text-yellow-400" />
                  Scan QR dari sheet kelompok lain
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM — info + back button */}
          <div className="px-5 pb-12">
            {/* Info card */}
            <div className="mb-4 rounded-2xl bg-yellow-400/10 px-4 py-3 backdrop-blur-sm ring-1 ring-yellow-400/20">
              <p className="text-xs font-bold text-yellow-300 mb-1">⚡ Mode Autoscan Aktif</p>
              <p className="text-[11px] text-white/60 leading-relaxed">
                Scan QR dari sheet kelompok lain. Course ID dan Session ID
                akan diisi otomatis dari data yang tertanam di QR.
              </p>
              <p className="mt-1.5 text-[10px] font-mono text-yellow-400/60">
                Format: AUTOSCAN|TKN-xxx|course_id|session_id
              </p>
            </div>

            <button
              onClick={() => router.replace("/")}
              className="w-full flex items-center justify-center rounded-2xl bg-white/15 py-3.5 text-sm font-semibold text-white backdrop-blur-sm ring-1 ring-white/10 transition hover:bg-white/25 active:scale-[0.97]"
            >
              Kembali ke Pilihan Mode
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
