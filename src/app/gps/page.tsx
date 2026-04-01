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
import { getItem, keys } from "@/src/lib/storage";
import { logGps, getLatest, getHistory, readBrowserGps } from "@/src/lib/gpsService";

// ── Map Real (Leaflet) ──
const GpsMapNoSSR = dynamic(() => import("@/src/components/GpsMap"), {
  ssr    : false,
  loading: () => <div className="h-full w-full bg-neutral-900 animate-pulse flex items-center justify-center text-xs text-neutral-500">Menyiapkan Peta...</div>,
});

const POLL_INTERVAL = 10_000;
const HISTORY_LIMIT = 200;

type Status = "idle" | "loading" | "success" | "error";

export default function GpsPage() {
  const router = useRouter();

  // --- State ---
  const [marker, setMarker] = useState<[number, number] | null>(null);
  const [polyline, setPolyline] = useState<[number, number][]>([]);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [lastTs, setLastTs] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [isOnline,  setIsOnline]  = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [deviceId,   setDeviceId]   = useState<string>("");
  const [userId,     setUserId]     = useState<string>("");
  const [now,        setNow]        = useState(new Date());
  const [isLoaded,   setIsLoaded]   = useState(false);

  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProcessingRef = useRef(false);

  // --- 1. Jam Real-time ---
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- 2. Helper Fungsi ---
  const showStatus = useCallback((s: Status, msg: string) => {
    setStatus(s);
    setStatusMsg(msg);
    if (s === "success" || s === "error") {
      if (statusRef.current) clearTimeout(statusRef.current);
      statusRef.current = setTimeout(() => {
        setStatus("idle");
        setStatusMsg("");
      }, 3000);
    }
  }, []);

  const loadMapData = useCallback(async (d: string, u: string) => {
    if (!d || !u) return;
    try {
      const [latest, items] = await Promise.all([
        getLatest(d, u),
        getHistory(d, u, HISTORY_LIMIT),
      ]);

      if (latest && latest.lat !== 0 && latest.lat !== null) {
        setMarker([latest.lat, latest.lng]);
        setLastTs(latest.ts);
        if (latest.accuracy_m != null) setAccuracy(Math.round(latest.accuracy_m));
      }

      if (items && items.length > 0) {
        // Balik urutan jika perlu, pastikan [terlama, ..., terbaru] untuk polyline Leaflet
        const sortedItems = [...items].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
        setPolyline(sortedItems.map(p => [p.lat, p.lng]));
      }
    } catch (err) {
      console.warn("Gagal load data peta:", err);
    }
  }, []);

  const sendOnce = useCallback(async (isAuto = false) => {
    if (isProcessingRef.current) return;
    
    const d = getItem(keys.device_id);
    const u = getItem(keys.user_id);
    if (!d || !u) {
      showStatus("error", "Data login tidak ditemukan");
      return;
    }

    if (!isOnline) {
      showStatus("error", "Offline - Cek internet");
      return;
    }

    isProcessingRef.current = true;
    if (!isAuto) showStatus("loading", "Membaca GPS HP...");

    try {
      const coords = await readBrowserGps();
      const payload = {
        device_id: d,
        user_id: u,
        ts: new Date().toISOString(),
        lat: coords.latitude,
        lng: coords.longitude,
        accuracy_m: coords.accuracy ?? undefined,
      };

      if (!isAuto) showStatus("loading", "Mengirim ke Sheets...");
      await logGps(payload);

      // Update UI Instan dengan waktu yang benar
      const point: [number, number] = [payload.lat, payload.lng];
      setMarker(point);
      setLastTs(payload.ts);
      if (payload.accuracy_m != null) setAccuracy(Math.round(payload.accuracy_m));
      
      // Tambahkan ke polyline (di akhir karena data terbaru)
      setPolyline(prev => [...prev, point].slice(-HISTORY_LIMIT));

      if (!isAuto) showStatus("success", "Lokasi Terkirim!");
    } catch (err) {
      console.error(err);
      let msg = "Gagal kirim lokasi";
      if (err && typeof err === "object" && "code" in err) {
        const code = (err as { code: number }).code;
        if (code === 1) msg = "Izin lokasi ditolak";
        else if (code === 2) msg = "Sinyal GPS lemah";
        else if (code === 3) msg = "Timeout (30s habis)";
      }
      
      if (!isAuto) showStatus("error", msg);
    } finally {
      isProcessingRef.current = false;
    }
  }, [isOnline, showStatus]);

  const stopTracking = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    setIsTracking(false);
    showStatus("idle", "");
  }, [showStatus]);

  const startTracking = useCallback(() => {
    setIsTracking(true);
    void sendOnce();
    pollRef.current = setInterval(() => void sendOnce(true), POLL_INTERVAL);
  }, [sendOnce]);

  // --- 2. Lifecycle Effects ---
  useEffect(() => {
    const u = getItem(keys.user_id);
    const d = getItem(keys.device_id);
    if (!u || !d) {
      router.replace("/login");
      return;
    }

    const frameId = requestAnimationFrame(() => {
      setDeviceId(d);
      setUserId(u);
      setIsLoaded(true);
      void loadMapData(d, u);
    });

    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      cancelAnimationFrame(frameId);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [router, loadMapData]);

  if (!isLoaded) return null;

  // --- UI Logic ---
  const displayPos = marker ?? [-7.2504, 112.7688];
  const badge = (() => {
    if (!isOnline) return { color: "red", icon: <WifiOff className="h-3 w-3" />, label: "Offline" };
    if (status === "loading") return { color: "yellow", icon: <Loader2 className="h-3 w-3 animate-spin" />, label: "Proses..." };
    if (status === "success") return { color: "emerald", icon: <CheckCircle2 className="h-3 w-3" />, label: "Berhasil" };
    if (status === "error") return { color: "red", icon: <AlertCircle className="h-3 w-3" />, label: "Error" };
    if (isTracking) return { color: "emerald", icon: <div className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />, label: "Live" };
    return { color: "neutral", icon: <div className="h-1.5 w-1.5 rounded-full bg-current" />, label: "Siap" };
  })();

  return (
    <PageTransition>
      <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-[#F2F2F7] dark:bg-neutral-950 rounded-2xl overflow-hidden shadow-xl">
        {/* HEADER */} 
        <div className="relative bg-primary px-6 pt-12 pb-8 overflow-hidden rounded-b-[2rem]"> 
          <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/10" /> 
          <div className="relative flex items-center gap-4 text-white"> 
            <button 
              onClick={() => router.back()}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm active:scale-95 transition-all"
            > 
              <ChevronLeft className="h-6 w-6" /> 
            </button> 
            <div> 
               <h1 className="text-xl font-bold tracking-tight">Live Tracking</h1> 
               <p className="text-[10px] opacity-60 uppercase tracking-widest">
                 {now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} • GAS API
               </p> 
             </div> 
           </div> 
         </div> 

        {/* MAIN BODY */} 
        <div className="flex-1 px-4 py-6 space-y-4"> 
            
          {/* Badge Status */} 
          <div className="flex flex-col items-center gap-1"> 
            <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-white dark:bg-neutral-900 shadow-sm ring-1 ring-black/5`}> 
              <span className={`text-${badge.color}-500 flex items-center gap-1.5`}> 
                {badge.icon} 
                {badge.label} 
              </span> 
            </div> 
            {statusMsg && <p className="text-[10px] text-neutral-500 font-medium">{statusMsg}</p>} 
          </div> 

          {/* Map Area */} 
          <div className="h-72 w-full rounded-2xl bg-white dark:bg-neutral-900 shadow-inner ring-1 ring-black/5 overflow-hidden"> 
            <GpsMapNoSSR latest={displayPos} history={polyline} />
          </div> 

          {/* Koordinat Info */} 
          <div className="grid grid-cols-2 gap-3"> 
            <div className="rounded-2xl bg-white dark:bg-neutral-900 p-4 shadow-sm ring-1 ring-black/5"> 
              <MapPin className="h-4 w-4 text-blue-600 mb-2" /> 
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Latitude</p> 
              <p className="text-sm font-mono font-bold text-neutral-800 dark:text-neutral-200">{displayPos[0].toFixed(6)}</p> 
            </div> 
            <div className="rounded-2xl bg-white dark:bg-neutral-900 p-4 shadow-sm ring-1 ring-black/5"> 
              <Navigation className="h-4 w-4 text-indigo-600 mb-2" /> 
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Longitude</p> 
              <p className="text-sm font-mono font-bold text-neutral-800 dark:text-neutral-200">{displayPos[1].toFixed(6)}</p> 
            </div> 
          </div> 

          {/* Akurasi & Waktu */} 
          {(accuracy != null || lastTs) && ( 
            <div className="rounded-2xl bg-white dark:bg-neutral-900 px-4 py-3 shadow-sm ring-1 ring-black/5 flex items-center justify-between text-[10px] text-neutral-500 font-bold uppercase tracking-widest"> 
              {accuracy != null && <span>Akurasi: ±{accuracy}m</span>} 
              {lastTs && <span>Update: {new Date(lastTs).toLocaleTimeString("id-ID")}</span>} 
            </div> 
           )} 
  
           {/* Polyline info */}
           {polyline.length > 0 && (
             <p className="text-center text-[10px] text-neutral-400">
               Polyline: <span className="font-semibold">{polyline.length}</span> titik tersimpan
             </p>
           )}

           {/* Controls */} 
           <div className="space-y-3 pt-4"> 
            <button 
              onClick={isTracking ? stopTracking : startTracking} 
              className={`w-full flex items-center justify-center gap-3 rounded-2xl px-5 py-5 text-white shadow-lg transition-all active:scale-[0.98] ${ 
                isTracking ? "bg-red-500 shadow-red-500/30" : "bg-blue-600 shadow-blue-600/30" 
              }`} 
            > 
              <Radio className={`h-5 w-5 ${isTracking ? "animate-pulse" : ""}`} /> 
              <span className="font-bold">{isTracking ? "Stop Tracking" : "Mulai Tracking"}</span> 
            </button> 

            <button 
              onClick={() => void sendOnce(false)} 
              disabled={status === "loading"} 
              className="w-full flex items-center justify-center gap-3 rounded-2xl bg-white dark:bg-neutral-800 px-5 py-4 text-neutral-700 dark:text-neutral-300 shadow-sm ring-1 ring-black/5 active:scale-[0.98] disabled:opacity-50" 
            > 
              {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} 
              <span className="font-semibold text-sm">Kirim Posisi Sekarang</span> 
            </button> 

            <button 
              onClick={() => void loadMapData(deviceId, userId)} 
              className="w-full flex items-center justify-center gap-3 rounded-2xl bg-neutral-200 dark:bg-neutral-800 px-5 py-4 text-neutral-700 dark:text-neutral-300 active:scale-[0.98]" 
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
