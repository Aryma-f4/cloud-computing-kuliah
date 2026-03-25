"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { QrScanner } from "@/src/components/QrScanner";
import { getItem, keys } from "@/src/lib/storage";
import { ChevronLeft, ScanLine, BadgeCheck } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { PageTransition } from "@/src/components/PageTransition";

export default function Scan() {
  const router = useRouter();

  const userId    = useMemo(() => getItem(keys.user_id), []);
  const courseId  = useMemo(() => getItem(keys.last_course_id), []);
  const sessionId = useMemo(() => getItem(keys.last_session_id), []);

  useEffect(() => {
    if (!userId || !courseId || !sessionId) router.replace("/");
  }, [router, userId, courseId, sessionId]);

  return (
    <PageTransition>
      <div className="relative mx-auto flex h-dvh max-w-md flex-col overflow-hidden bg-black">

        {/* ── CAMERA: fills the full screen ── */}
        <div className="absolute inset-0 z-0">
          <QrScanner
            onToken={(token) =>
              router.replace(`/result?token=${encodeURIComponent(token)}`)
            }
          />
        </div>

        {/* ── TOP VIGNETTE ── */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-48 bg-gradient-to-b from-neutral-950/80 to-transparent" />

        {/* ── BOTTOM VIGNETTE ── */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-56 bg-gradient-to-t from-neutral-950/90 to-transparent" />

        {/* ── UI LAYER ── */}
        <div className="relative z-20 flex h-full flex-col">

          {/* TOP BAR */}
          <div className="flex items-center justify-between px-5 pt-14">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="rounded-full bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/50"
              aria-label="Kembali"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <div className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
                E-Absen
              </p>
              <p className="text-sm font-bold text-white">Scan QR Code</p>
            </div>

            <div className="flex h-8 items-center gap-1 rounded-full bg-black/30 px-3 text-[11px] font-medium text-white backdrop-blur-sm">
              <BadgeCheck className="h-3.5 w-3.5 text-green-400" />
              Aman
            </div>
          </div>

          {/* USER CHIP */}
          <div className="mt-3 px-5">
            <div className="flex items-center gap-2.5 rounded-2xl bg-black/30 px-4 py-2.5 backdrop-blur-sm ring-1 ring-white/10">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-xs font-bold text-white">
                {(userId ?? "?")[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white leading-tight">
                  {userId || "User"}
                </p>
                <p className="text-[11px] text-white/50 leading-tight">
                  {courseId || "-"} · Sesi {sessionId || "-"}
                </p>
              </div>
            </div>
          </div>

          {/* SCAN FRAME — centered in the remaining middle space */}
          <div className="flex flex-1 items-center justify-center">
            <div className="relative h-60 w-60">
              {/* animated scan line */}
              <div
                className="absolute inset-x-3 h-0.5 rounded-full bg-primary shadow-[0_0_8px_2px_var(--color-primary)] opacity-60"
                style={{ animation: "scanline 2.2s ease-in-out infinite" }}
              />
              <style>{`
                @keyframes scanline {
                  0%   { top: 12px; opacity: 1; }
                  48%  { top: calc(100% - 12px); opacity: 0.5; }
                  50%  { top: calc(100% - 12px); opacity: 0.5; }
                  100% { top: 12px; opacity: 1; }
                }
              `}</style>

              {/* Corner brackets */}
              <div className="absolute left-0  top-0    h-9 w-9 rounded-tl-xl border-l-[3px] border-t-[3px] border-primary" />
              <div className="absolute right-0 top-0    h-9 w-9 rounded-tr-xl border-r-[3px] border-t-[3px] border-primary" />
              <div className="absolute left-0  bottom-0 h-9 w-9 rounded-bl-xl border-b-[3px] border-l-[3px] border-primary" />
              <div className="absolute right-0 bottom-0 h-9 w-9 rounded-br-xl border-b-[3px] border-r-[3px] border-primary" />

              {/* Center hint chip */}
              <div className="absolute inset-x-0 bottom-3 flex justify-center">
                <div className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-[11px] text-white backdrop-blur-sm">
                  <ScanLine className="h-3.5 w-3.5" />
                  Arahkan QR ke sini
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM ACTIONS */}
          <div className="px-5 pb-12">
            <p className="mb-4 text-center text-[11px] text-white/40">
              Pastikan QR terlihat jelas dan pencahayaan cukup
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="ghost"
                onClick={() => router.replace("/status")}
                className="rounded-2xl bg-white/15 py-3.5 text-sm font-semibold text-white backdrop-blur-sm ring-1 ring-white/10 transition hover:bg-white/25"
              >
                <BadgeCheck className="h-4 w-4 mr-2" />
                Cek Status
              </Button>

              <Button
                onClick={() => router.back()}
                className="rounded-2xl bg-white py-3.5 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100"
              >
                Batal
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}