"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Scanner } from "@yudiel/react-qr-scanner";
import { setItem, getItem, keys } from "@/src/lib/storage";
import {
  ChevronLeft, ScanLine, Zap, BookOpen, CalendarDays, ArrowRight,
} from "lucide-react";
import { PageTransition } from "@/src/components/PageTransition";
import toast from "react-hot-toast";

/* ── Parse QR ── */
type ParsedQR = { token: string; courseId: string | null; sessionId: string | null };

function parseQR(raw: string): ParsedQR | null {
  // Format 1: AUTOSCAN|TKN-xxx|course_id|session_id
  if (raw.startsWith("AUTOSCAN|")) {
    const parts = raw.split("|");
    if (parts.length >= 4 && parts[1].startsWith("TKN-")) {
      return { token: parts[1], courseId: parts[2], sessionId: parts[3] };
    }
    toast.error("Format AUTOSCAN tidak lengkap");
    return null;
  }

  // Format 2: JSON — {"qr_token":"TKN-xxx","course_id":"...","session_id":"..."}
  if (raw.startsWith("{")) {
    try {
      const obj = JSON.parse(raw);
      const token = obj.qr_token || obj.token || "";
      if (!token) { toast.error("JSON QR: field qr_token tidak ditemukan"); return null; }
      return {
        token,
        courseId:  obj.course_id  || null,
        sessionId: obj.session_id || null,
      };
    } catch {
      toast.error("JSON QR tidak valid");
      return null;
    }
  }

  // Format 3: TKN-xxx biasa (course/session perlu diinput manual)
  if (raw.startsWith("TKN-")) {
    return { token: raw, courseId: null, sessionId: null };
  }

  toast.error("QR tidak dikenali");
  return null;
}

export default function AutoScan() {
  const router = useRouter();
  const userId = useMemo(() => getItem(keys.user_id), []);

  const [scanning, setScanning] = useState(true);
  /* Saat QR biasa (TKN- tanpa embedded data) → tampilkan form */
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [courseId, setCourseId]         = useState("");
  const [sessionId, setSessionId]       = useState("");
  const courseRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!userId) router.replace("/login");
  }, [router, userId]);

  /* Fokus ke Course ID input ketika form muncul */
  useEffect(() => {
    if (pendingToken) setTimeout(() => courseRef.current?.focus(), 100);
  }, [pendingToken]);

  function handleScan(raw: string) {
    if (!scanning) return;
    const parsed = parseQR(raw);
    if (!parsed) return;

    setScanning(false);

    if (parsed.courseId && parsed.sessionId) {
      /* AUTOSCAN format — langsung lanjut */
      setItem(keys.last_course_id, parsed.courseId);
      setItem(keys.last_session_id, parsed.sessionId);
      router.replace(`/result?token=${encodeURIComponent(parsed.token)}`);
    } else {
      /* TKN biasa — tampilkan form */
      setPendingToken(parsed.token);
      const savedCourse  = getItem(keys.last_course_id) ?? "";
      const savedSession = getItem(keys.last_session_id) ?? "";
      setCourseId(savedCourse);
      setSessionId(savedSession);
    }
  }

  function submitManual() {
    if (!pendingToken) return;
    const c = courseId.trim();
    const s = sessionId.trim();
    if (!c || !s) { toast.error("Course ID & Session ID wajib diisi"); return; }
    setItem(keys.last_course_id, c);
    setItem(keys.last_session_id, s);
    router.replace(`/result?token=${encodeURIComponent(pendingToken)}`);
  }

  function retryScanner() {
    setPendingToken(null);
    setCourseId("");
    setSessionId("");
    setScanning(true);
  }

  return (
    <PageTransition>
      <div className="relative mx-auto flex h-dvh max-w-md flex-col overflow-hidden bg-black">

        {/* ── KAMERA FULL SCREEN ── */}
        <div className={`absolute inset-0 z-0 transition-opacity duration-500 ${!pendingToken ? "opacity-100" : "opacity-30"}`}>
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
              <Zap className="h-3.5 w-3.5" />AUTO
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
                <p className="text-[11px] text-white/50">
                  {pendingToken ? "QR terdeteksi — lengkapi data sesi" : "Arahkan kamera ke QR Code"}
                </p>
              </div>
            </div>
          </div>

          {/* SCAN FRAME / OR PENDING STATE */}
          <div className="flex flex-1 items-center justify-center">
            {!pendingToken ? (
              /* Scan Frame */
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
                    Scan QR — Course &amp; Session otomatis
                  </div>
                </div>
              </div>
            ) : (
              /* Token terdeteksi — waiting for manual input (handled below) */
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400/15 ring-1 ring-yellow-400/30">
                  <Zap className="h-7 w-7 text-yellow-400" />
                </div>
                <p className="text-sm font-semibold text-white">QR Terdeteksi</p>
                <p className="text-[11px] text-white/50 font-mono">{pendingToken}</p>
              </div>
            )}
          </div>

          {/* BOTTOM PANEL */}
          <div className="px-4 pb-8">
            {pendingToken ? (
              /* ── FORM: QR biasa tanpa embedded course/session ── */
              <div className="rounded-2xl bg-black/60 backdrop-blur-md ring-1 ring-white/10 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/8 bg-yellow-400/10">
                  <p className="text-xs font-bold text-yellow-300">
                    QR tidak memiliki data sesi — isi manual
                  </p>
                </div>
                <div className="px-4 py-4 space-y-3">
                  {/* Course ID */}
                  <div className="flex items-center gap-3 rounded-xl bg-white/8 px-3 py-3 ring-1 ring-white/10 focus-within:ring-yellow-400/50 transition">
                    <BookOpen className="h-4 w-4 text-white/40 shrink-0" />
                    <input
                      ref={courseRef}
                      type="text"
                      value={courseId}
                      onChange={(e) => setCourseId(e.target.value)}
                      placeholder="Course ID (contoh: cloud-101)"
                      className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
                    />
                  </div>
                  {/* Session ID */}
                  <div className="flex items-center gap-3 rounded-xl bg-white/8 px-3 py-3 ring-1 ring-white/10 focus-within:ring-yellow-400/50 transition">
                    <CalendarDays className="h-4 w-4 text-white/40 shrink-0" />
                    <input
                      type="text"
                      value={sessionId}
                      onChange={(e) => setSessionId(e.target.value)}
                      placeholder="Session ID (contoh: sesi-01)"
                      onKeyDown={(e) => e.key === "Enter" && submitManual()}
                      className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
                    />
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={retryScanner}
                      className="rounded-xl bg-white/10 px-4 py-2.5 text-xs font-semibold text-white/70 transition hover:bg-white/20"
                    >
                      Scan Ulang
                    </button>
                    <button
                      onClick={submitManual}
                      disabled={!courseId.trim() || !sessionId.trim()}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-yellow-400 py-2.5 text-xs font-bold text-black transition hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                      Lanjut Check-in
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Info saat scanner aktif */
              <div className="rounded-2xl bg-black/40 backdrop-blur-sm px-4 py-3 ring-1 ring-white/10">
                <p className="text-[11px] text-white/50 text-center leading-relaxed">
                  Jika QR mengandung data sesi (format AUTOSCAN), check-in berjalan otomatis.
                  Jika QR biasa, form akan muncul untuk melengkapi data.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
