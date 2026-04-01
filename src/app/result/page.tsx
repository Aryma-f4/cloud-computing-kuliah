"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { checkIn, postGps } from "@/src/lib/api";
import { getItem, keys, getISOTime } from "@/src/lib/storage";
import type { CheckInResponse } from "@/src/types/presence";
import { PageTransition } from "@/src/components/PageTransition";
import { MapPin, CheckCircle2, XCircle, Loader2, ChevronLeft, ShieldCheck } from "lucide-react";

function getLocation(): Promise<{ lat: number | null; lng: number | null; acc: number | null }> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve({ lat: null, lng: null, acc: null });
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude ?? null, lng: pos.coords.longitude ?? null, acc: pos.coords.accuracy ?? null }),
      () => resolve({ lat: null, lng: null, acc: null }),
      { enableHighAccuracy: true, timeout: 4000, maximumAge: 0 }
    );
  });
}

function makeOsmEmbed(lat: number, lng: number) {
  const d = 0.005;
  const bbox = `${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
}

/* ── Error message map ── */
const ERROR_MSG: Record<string, string> = {
  token_invalid:    "QR Code tidak valid atau tidak dikenali.",
  token_expired:    "QR Code sudah kedaluwarsa. Silakan minta dosen untuk refresh.",
  already_checked_in: "Anda sudah melakukan presensi untuk sesi ini.",
};
function errMsg(e?: string) {
  if (!e) return "Terjadi kesalahan yang tidak diketahui.";
  if (ERROR_MSG[e]) return ERROR_MSG[e];
  if (e.startsWith("missing_field")) return "Data tidak lengkap. Silakan coba lagi.";
  if (e.startsWith("server_error")) return "Gangguan server. Coba beberapa saat lagi.";
  return "Terjadi kesalahan yang tidak diketahui.";
}

/* ─────────────────── MAIN COMPONENT ─────────────────── */
function ResultContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = useMemo(() => params.get("token") ?? "", [params]);

  const payload = useMemo(() => {
    if (!token) return null;
    const user_id   = getItem(keys.user_id);
    const device_id = getItem(keys.device_id);
    const course_id = getItem(keys.last_course_id);
    const session_id= getItem(keys.last_session_id);
    if (!user_id || !device_id || !course_id || !session_id) return null;
    return { user_id, device_id, course_id, session_id, qr_token: token, ts: getISOTime() };
  }, [token]);

  const [resp,  setResp]  = useState<CheckInResponse | null>(null);
  const [loc,   setLoc]   = useState<{ lat: number | null; lng: number | null; acc: number | null } | null>(null);
  const [stage, setStage] = useState<"gather" | "confirm" | "sending" | "done">("gather");

  useEffect(() => {
    if (!payload) return;
    (async () => {
      const l = await getLocation();
      setLoc(l);
      setStage("confirm");
    })();
  }, [payload]);

  async function submit() {
    if (!payload) return;
    setStage("sending");
    try {
      if (loc?.lat != null && loc?.lng != null) {
        try { 
          await postGps({ 
            device_id: payload.device_id, 
            user_id: payload.user_id, // Tambahkan user_id yang tadinya kurang
            ts: getISOTime(), 
            lat: loc.lat, 
            lng: loc.lng, 
            accuracy_m: loc.acc ?? null 
          }); 
        } catch (err) {
          console.warn("Gagal kirim telemetry GPS (opsional):", err);
        }
      }
      const r = await checkIn(payload);
      setResp(r);
      if (r.ok) {
        // Redirect otomatis ke status setelah 2 detik jika berhasil
        setTimeout(() => {
          router.replace(`/status?user_id=${payload.user_id}&course_id=${payload.course_id}&session_id=${payload.session_id}`);
        }, 2000);
      }
    } catch (err) {
      console.error("Gagal check-in:", err);
      setResp({ ok: false, error: "server_error: network" });
    } finally {
      setStage("done");
    }
  }

  /* ── helpers ── */
  const isSuccess = stage === "done" && resp?.ok;
  const isError   = stage === "done" && resp && !resp.ok;

  const heroColor =
    stage === "done" && resp?.ok  ? "bg-emerald-500" :
    stage === "done" && resp      ? "bg-red-500"     :
    "bg-primary";

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-[#F2F2F7] dark:bg-neutral-950">

      {/* ── HERO HEADER ── */}
      <div className={`relative px-6 pt-14 pb-10 overflow-hidden transition-colors duration-500 ${heroColor}`}>
        {/* ambient circles */}
        <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/10" />
        <div className="absolute top-8  -right-4  h-24 w-24 rounded-full bg-white/10" />

        <div className="relative">
          {/* Back button */}
          <button
            onClick={() => router.replace("/")}
            className="mb-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <p className="text-sm font-medium text-white/70">E-Absen · Presensi QR</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
            {stage === "gather"  && "Mendeteksi Lokasi"}
            {stage === "confirm" && "Konfirmasi Lokasi"}
            {stage === "sending" && "Mengirim Data"}
            {isSuccess           && "Presensi Berhasil!"}
            {isError             && "Presensi Gagal"}
          </h1>
          <p className="mt-1 text-sm text-white/60">
            {stage === "gather"  && "Mohon tunggu sebentar..."}
            {stage === "confirm" && "Pastikan lokasi Anda sudah benar"}
            {stage === "sending" && "Sedang mengirim ke server..."}
            {isSuccess           && "Kehadiran Anda telah tercatat"}
            {isError             && "Silakan coba kembali"}
          </p>
        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      <div className="flex flex-1 flex-col px-4 py-6 space-y-4">

        {/* ── NO PAYLOAD ── */}
        {!payload && (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl bg-white dark:bg-neutral-900 p-5 shadow-sm ring-1 ring-black/5">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Data sesi tidak lengkap atau QR Code tidak valid. Silakan kembali dan coba lagi.
              </p>
            </div>
            <button
              onClick={() => router.replace("/")}
              className="w-full rounded-2xl bg-primary py-4 text-sm font-semibold text-white transition hover:bg-hover active:scale-[0.98]"
            >
              Kembali ke Beranda
            </button>
          </div>
        )}

        {/* ── STAGE: GATHER ── */}
        {payload && stage === "gather" && (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white dark:bg-neutral-900 py-16 shadow-sm ring-1 ring-black/5 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-medium text-neutral-500 animate-pulse">Mendeteksi lokasi Anda...</p>
          </div>
        )}

        {/* ── STAGE: CONFIRM ── */}
        {payload && stage === "confirm" && (
          <>
            {/* Map card */}
            <div className="rounded-2xl bg-white dark:bg-neutral-900 shadow-sm ring-1 ring-black/5 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
                <MapPin className="h-4 w-4 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Lokasi Anda</p>
                {loc?.acc != null && (
                  <span className="ml-auto text-[11px] text-neutral-400">±{Math.round(loc.acc)} m</span>
                )}
              </div>

              {loc?.lat != null && loc?.lng != null ? (
                <iframe
                  title="Lokasi Anda"
                  src={makeOsmEmbed(loc.lat, loc.lng)}
                  className="h-52 w-full border-0 pointer-events-none"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center px-4">
                  <MapPin className="h-8 w-8 text-neutral-300" />
                  <p className="text-sm font-medium text-neutral-500">Lokasi tidak tersedia</p>
                  <p className="text-xs text-neutral-400">Izinkan akses lokasi di browser Anda, lalu coba lagi.</p>
                </div>
              )}
            </div>

            {/* Info card */}
            <div className="rounded-2xl bg-white dark:bg-neutral-900 shadow-sm ring-1 ring-black/5 overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Detail Presensi</p>
              </div>
              {[
                ["Mahasiswa",  payload.user_id],
                ["Mata Kuliah",payload.course_id],
                ["Sesi",       payload.session_id],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between px-4 py-3 border-b border-neutral-50 dark:border-neutral-800 last:border-0">
                  <span className="text-xs text-neutral-400">{label}</span>
                  <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{value}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={submit}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-hover active:scale-[0.98]"
              >
                <ShieldCheck className="h-4 w-4" />
                Kirim Presensi Sekarang
              </button>
              <button
                onClick={() => router.replace("/")}
                className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-800 py-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400 transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Batalkan
              </button>
            </div>
          </>
        )}

        {/* ── STAGE: SENDING ── */}
        {payload && stage === "sending" && (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white dark:bg-neutral-900 py-16 shadow-sm ring-1 ring-black/5 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-medium text-neutral-500 animate-pulse">Mengirim data presensi...</p>
          </div>
        )}

        {/* ── DONE: SUCCESS ── */}
        {isSuccess && resp && (
          <>
            <div className="flex flex-col items-center rounded-2xl bg-white dark:bg-neutral-900 shadow-sm ring-1 ring-black/5 py-10 px-6 text-center space-y-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Berhasil Terkirim!</h2>
                <p className="text-sm text-neutral-500 mt-0.5">Kehadiran Anda sudah tercatat.</p>
              </div>
            </div>

            {/* Receipt card */}
            <div className="rounded-2xl bg-white dark:bg-neutral-900 shadow-sm ring-1 ring-black/5 overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Bukti Presensi</p>
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-50 dark:border-neutral-800">
                <span className="text-xs text-neutral-400">ID Presensi</span>
                <span className="font-mono text-sm font-semibold text-neutral-900 dark:text-neutral-100">{resp.data.presence_id}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs text-neutral-400">Status</span>
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  {resp.data.status}
                </span>
              </div>
            </div>

            <button
              onClick={() => router.replace("/")}
              className="w-full rounded-2xl bg-neutral-900 dark:bg-white py-4 text-sm font-semibold text-white dark:text-neutral-900 transition hover:bg-neutral-700 dark:hover:bg-neutral-200 active:scale-[0.98]"
            >
              Selesai & Kembali
            </button>
          </>
        )}

        {/* ── DONE: ERROR ── */}
        {isError && resp && (
          <>
            <div className="flex flex-col items-center rounded-2xl bg-white dark:bg-neutral-900 shadow-sm ring-1 ring-black/5 py-10 px-6 text-center space-y-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Presensi Gagal</h2>
                <p className="mt-1 text-sm text-neutral-500">{errMsg(resp.error)}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.replace("/scan")}
                className="w-full rounded-2xl bg-primary py-4 text-sm font-semibold text-white transition hover:bg-hover active:scale-[0.98]"
              >
                Scan Ulang QR Code
              </button>
              <button
                onClick={() => router.replace("/")}
                className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-800 py-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400 transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Kembali ke Beranda
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Result() {
  return (
    <PageTransition>
      <Suspense
        fallback={
          <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 bg-[#F2F2F7] dark:bg-neutral-950">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-neutral-400">Menyiapkan halaman...</p>
          </div>
        }
      >
        <ResultContent />
      </Suspense>
    </PageTransition>
  );
}