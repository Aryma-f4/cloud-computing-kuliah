"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { QrScanner } from "@/src/components/QrScanner";
import { getItem, keys } from "@/src/lib/storage";
import { ChevronLeft, ScanLine, BadgeCheck } from "lucide-react";
import { PageTransition } from "@/src/components/PageTransition";

export default function Scan() {
  const router = useRouter();

  const userId  = useMemo(() => getItem(keys.user_id), []);
  const courseId  = useMemo(() => getItem(keys.last_course_id), []);
  const sessionId = useMemo(() => getItem(keys.last_session_id), []);

  useEffect(() => {
    if (!userId || !courseId || !sessionId) router.replace("/");
  }, [router, userId, courseId, sessionId]);

  return (
    <PageTransition>
      {/* ── FULL-SCREEN IMMERSIVE LAYOUT ── */}
      <div className="relative flex h-dvh w-full max-w-md mx-auto flex-col overflow-hidden bg-neutral-950">

        {/* ── CAMERA AREA (full background) ── */}
        <div className="absolute inset-0">
          <QrScanner
            onToken={(token) =>
              router.replace(`/result?token=${encodeURIComponent(token)}`)
            }
          />
        </div>

        {/* ── DARK VIGNETTE OVERLAY (top & bottom) ── */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-52 bg-gradient-to-b from-black/70 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/80 to-transparent" />

        {/* ── TOP BAR ── */}
        <div className="relative z-10 flex items-center justify-between px-5 pt-14 pb-4">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition hover:bg-white/25 active:scale-95"
            aria-label="Kembali"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Title */}
          <div className="text-center">
            <p className="text-[11px] font-medium uppercase tracking-widest text-white/60">
              Laman Presensi
            </p>
            <p className="text-base font-bold text-white">Scan QR Code</p>
          </div>

          {/* Safe badge */}
          <div className="flex h-10 items-center gap-1 rounded-full bg-white/15 px-3 text-xs font-medium text-white backdrop-blur-md">
            <BadgeCheck className="h-3.5 w-3.5 text-green-400" />
            Aman
          </div>
        </div>

        {/* ── USER INFO CHIP (below top bar) ── */}
        <div className="relative z-10 mx-5 mt-1">
          <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-md ring-1 ring-white/10">
            {/* Avatar */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-white text-xs font-bold">
              {(userId ?? "?")[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {userId || "User"}
              </p>
              <p className="text-[11px] text-white/60">
                {courseId || "-"} · {sessionId || "-"}
              </p>
            </div>
          </div>
        </div>

        {/* ── SCAN FRAME (center of screen) ── */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10">
          {/* Dim mask with cutout feel */}
          <div className="relative flex h-64 w-64 items-center justify-center">
            {/* Animated scan line */}
            <div
              className="absolute inset-x-4 h-0.5 bg-primary/80 blur-[1px] animate-[scan_2s_ease-in-out_infinite]"
              style={{
                animation: "scan 2.5s ease-in-out infinite",
              }}
            />
            <style>{`
              @keyframes scan {
                0%   { top: 16px; opacity: 1; }
                50%  { top: calc(100% - 16px); opacity: 0.6; }
                100% { top: 16px; opacity: 1; }
              }
            `}</style>

            {/* Corner brackets */}
            <div className="absolute left-0  top-0    h-10 w-10 rounded-tl-2xl border-l-[3px] border-t-[3px] border-white" />
            <div className="absolute right-0 top-0    h-10 w-10 rounded-tr-2xl border-r-[3px] border-t-[3px] border-white" />
            <div className="absolute left-0  bottom-0 h-10 w-10 rounded-bl-2xl border-b-[3px] border-l-[3px] border-white" />
            <div className="absolute right-0 bottom-0 h-10 w-10 rounded-br-2xl border-b-[3px] border-r-[3px] border-white" />

            {/* Center hint */}
            <div className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-[11px] text-white backdrop-blur-sm">
              <ScanLine className="h-3.5 w-3.5" />
              Arahkan QR ke sini
            </div>
          </div>
        </div>

        {/* ── BOTTOM ACTIONS ── */}
        <div className="relative z-10 mt-auto px-5 pb-10">
          <p className="mb-4 text-center text-xs text-white/50">
            Pastikan QR terlihat jelas dan ada pencahayaan yang cukup
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => router.replace("/status")}
              className="flex h-13 items-center justify-center gap-2 rounded-2xl bg-white/15 py-3.5 text-sm font-semibold text-white backdrop-blur-md ring-1 ring-white/10 transition hover:bg-white/25 active:scale-[0.97]"
            >
              <BadgeCheck className="h-4 w-4" />
              Cek Status
            </button>

            <button
              onClick={() => router.back()}
              className="flex h-13 items-center justify-center rounded-2xl bg-white py-3.5 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100 active:scale-[0.97]"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}