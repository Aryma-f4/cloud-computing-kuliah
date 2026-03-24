"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ChevronLeft, MapPin, Navigation, History,
  RefreshCw, Loader2, CheckCircle2, AlertCircle,
  Radio, WifiOff,
} from "lucide-react";
import { PageTransition } from "@/src/components/PageTransition";
import { logGps, getLatest, getHistory, readBrowserGps, GpsPoint } from "@/src/lib/gpsService";

// ── Ganti sesuai device / user yang sedang login ──
const DEVICE_ID      = "dev-001";
const POLL_INTERVAL  = 10_000; // kirim GPS setiap 10 detik (ms)
const HISTORY_LIMIT  = 200;

const GpsMapNoSSR = dynamic(() => import("@/src/components/GpsMap"), {
  ssr    : false,
  loading: () => (
    <div className="h-full w-full bg-neutral-900 animate-pulse flex items-center justify-center text-xs text-neutral-500">
      Menyiapkan Peta...
    </div>
  ),
});

type Status = "idle" | "loading" | "success" | "error";

export default function GpsPage() {
  const router = useRouter();

  // ── State ──────────────────────────────────────────────────
  const [marker,    setMarker]    = useState<[number, number] | null>(null);
  const [polyline,  setPolyline]  = useState<[number, number][]>([]);
  const [accuracy,  setAccuracy]  = useState<number | null>(null);
  const [lastTs,    setLastTs]    = useState<string>("");
  const [status,    setStatus]    = useState<Status>("idle");
  const [statusMsg, setStatusMsg] = useState<string>("");
  const [isOnline,  setIsOnline]  = useState<boolean>(true);
  const [isTracking, setIsTracking] = useState<boolean>(false);

  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Monitor koneksi ────────────────────────────────────────
  useEffect(() => {
    const on  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online",  on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  // ── Load data awal dari server ─────────────────────────────
  useEffect(() => {
    loadMapData();
  }, []);

  // ── Bersihkan interval saat unmount ───────────────────────
  useEffect(() => () => { stopTracking(); }, []);

  // ── Ambil latest + history → update Marker & Polyline ─────
  const loadMapData = useCallback(async () => {
    try {
      const [latest, items] = await Promise.all([
        getLatest(DEVICE_ID),
        getHistory(DEVICE_ID, HISTORY_LIMIT),
      ]);

      if (latest) {
        setMarker([latest.lat, latest.lng]);
        setLastTs(latest.ts);
        if (latest.accuracy_m != null) setAccuracy(latest.accuracy_m);
      }

      if (items.length > 0) {
        setPolyline(items.map(p => [p.lat, p.lng]));
      }
    } catch (err) {
      console.warn("Gagal load data peta:", err);
    }
  }, []);

  // ── Satu siklus: baca GPS → POST → reload peta ────────────
  const sendOnce = useCallback(async () => {
    if (!isOnline) {
      showStatus("error", "Tidak ada koneksi internet");
      return;
    }

    showStatus("loading", "Membaca GPS...");

    try {
      const coords = await readBrowserGps();

      const payload = {
        device_id  : DEVICE_ID,
        ts         : new Date().toISOString(),
        lat        : coords.latitude,
        lng        : coords.longitude,
        accuracy_m : coords.accuracy ?? undefined,
      };

      showStatus("loading", "Mengirim ke server...");
      await logGps(payload);

      // Update UI langsung tanpa tunggu server round-trip
      setMarker([payload.lat, payload.lng]);
      setLastTs(payload.ts);
      if (payload.accuracy_m != null) setAccuracy(Math.round(payload.accuracy_m));

      showStatus("loading", "Memuat ulang riwayat...");
      await loadMapData();

      showStatus("success", "Lokasi terkirim!");
    } catch (err: any) {
      const msg =
        err?.code === 1 ? "Izin GPS ditolak — aktifkan di pengaturan browser"
        : err?.code === 2 ? "Sinyal GPS tidak tersedia"
        : err?.code === 3 ? "Timeout membaca GPS"
        : err?.message   || "Gagal mengirim lokasi";
      showStatus("error", msg);
    }
  }, [isOnline, loadMapData]);

  // ── Mulai tracking periodik ────────────────────────────────
  const startTracking = useCallback(() => {
    setIsTracking(true);
    sendOnce(); // langsung kirim pertama
    pollRef.current = setInterval(sendOnce, POLL_INTERVAL);
  }, [sendOnce]);

  // ── Stop tracking ──────────────────────────────────────────
  const stopTracking = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    setIsTracking(false);
    showStatus("idle", "");
  }, []);

  // ── Status display helper ──────────────────────────────────
  function showStatus(s: Status, msg: string) {
    setStatus(s);
    setStatusMsg(msg);
    if (s === "success" || s === "error") {
      if (statusRef.current) clearTimeout(statusRef.current);
      statusRef.current = setTimeout(() => {
        setStatus("idle");
        setStatusMsg("");
      }, 3000);
    }
  }

  // ── Derived ───────────────────────────────────────────────
  const displayPos = marker ?? [-7.2504, 112.7688];

  const badge = (() => {
    if (!isOnline)          return { color: "red",     icon: <WifiOff className="h-3 w-3" />,                    label: "Offline" };
    if (status === "loading") return { color: "yellow",  icon: <Loader2 className="h-3 w-3 animate-spin" />,      label: "Memproses..." };
    if (status === "success") return { color: "emerald", icon: <CheckCircle2 className="h-3 w-3" />,              label: "Tersimpan!" };
    if (status === "error")   return { color: "red",     icon: <AlertCircle className="h-3 w-3" />,               label: "Error" };
    if (isTracking)           return { color: "emerald", icon: <div className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />, label: "Live Tracking" };
    return                           { color: "neutral", icon: <div className="h-1.5 w-1.5 rounded-full bg-current" />,              label: "Siap" };
  })();

  return (
    <PageTransition>
      <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-[#F2F2F7] dark:bg-neutral-950 rounded-2xl overflow-hidden">

        {/* ── HEADER ── */}
        <div className="relative bg-primary dark:bg-[#4a7da0] px-6 pt-14 pb-8 overflow-hidden rounded-b-3xl">
          <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/10" />
          <div className="relative flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-sm active:scale-95 transition-all"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Live Tracking</h1>
              <p className="text-xs text-white/60">Marker · Polyline · Google Sheets</p>
            </div>
          </div>
        </div>

        {/* ── MAIN ── */}
        <div className="flex-1 px-4 py-6 space-y-4">

          {/* Status badge */}
          <div className="flex flex-col items-center gap-1">
            <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider
              bg-${badge.color}-500/10 text-${badge.color}-500 ring-1 ring-${badge.color}-500/20`}>
              {badge.icon}
              {badge.label}
            </span>
            {statusMsg && (
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400">{statusMsg}</p>
            )}
          </div>

          {/* Map Card */}
          <div className="h-72 w-full rounded-2xl bg-white dark:bg-neutral-900 shadow-sm ring-1 ring-black/5 dark:ring-white/5 overflow-hidden">
            <GpsMapNoSSR latest={displayPos} history={polyline} />
          </div>

          {/* Koordinat */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white dark:bg-neutral-900 p-4 shadow-sm ring-1 ring-black/5 dark:ring-white/5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40 mb-3">
                <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Latitude</p>
              <p className="text-sm font-mono font-bold text-neutral-900 dark:text-neutral-100">{displayPos[0].toFixed(6)}</p>
            </div>
            <div className="rounded-2xl bg-white dark:bg-neutral-900 p-4 shadow-sm ring-1 ring-black/5 dark:ring-white/5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40 mb-3">
                <Navigation className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Longitude</p>
              <p className="text-sm font-mono font-bold text-neutral-900 dark:text-neutral-100">{displayPos[1].toFixed(6)}</p>
            </div>
          </div>

          {/* Meta info */}
          {(accuracy != null || lastTs) && (
            <div className="rounded-2xl bg-white dark:bg-neutral-900 px-4 py-3 shadow-sm ring-1 ring-black/5 dark:ring-white/5 flex items-center justify-between text-xs text-neutral-500">
              {accuracy != null && (
                <span>Akurasi: <span className="font-semibold text-neutral-800 dark:text-neutral-200">±{accuracy} m</span></span>
              )}
              {lastTs && (
                <span className="ml-auto">
                  Update: <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    {new Date(lastTs).toLocaleTimeString("id-ID")}
                  </span>
                </span>
              )}
            </div>
          )}

          {/* Polyline info */}
          {polyline.length > 0 && (
            <p className="text-center text-[10px] text-neutral-400">
              Polyline: <span className="font-semibold">{polyline.length}</span> titik tersimpan
            </p>
          )}

          {/* Action buttons */}
          <div className="space-y-3">
            {/* Toggle Tracking */}
            <button
              onClick={isTracking ? stopTracking : startTracking}
              disabled={status === "loading" && !isTracking}
              className={`w-full flex items-center justify-center gap-3 rounded-2xl px-5 py-5 text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-60
                ${isTracking
                  ? "bg-red-500 shadow-red-500/20"
                  : "bg-primary shadow-primary/20"
                }`}
            >
              {isTracking
                ? <><Radio className="h-5 w-5 animate-pulse" /><span className="font-bold">Stop Tracking</span></>
                : <><Radio className="h-5 w-5" /><span className="font-bold">Mulai Tracking</span></>
              }
            </button>

            {/* Kirim sekali manual */}
            <button
              onClick={sendOnce}
              disabled={status === "loading"}
              className="w-full flex items-center justify-center gap-3 rounded-2xl bg-white dark:bg-neutral-800 px-5 py-4 text-neutral-700 dark:text-neutral-300 shadow-sm ring-1 ring-black/5 dark:ring-white/5 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {status === "loading"
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <RefreshCw className="h-4 w-4" />
              }
              <span className="font-semibold text-sm">Kirim Posisi Sekarang</span>
            </button>

            {/* Muat ulang dari server */}
            <button
              onClick={loadMapData}
              className="w-full flex items-center justify-center gap-3 rounded-2xl bg-neutral-200 dark:bg-neutral-800 px-5 py-4 text-neutral-700 dark:text-neutral-300 active:scale-[0.98] transition-all"
            >
              <History className="h-4 w-4" />
              <span className="font-semibold text-sm">Muat Ulang Riwayat</span>
            </button>
          </div>

        </div>
      </div>
    </PageTransition>
  );
}