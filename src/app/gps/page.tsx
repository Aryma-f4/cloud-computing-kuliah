"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ChevronLeft, MapPin, Navigation, History, Wifi } from "lucide-react";
import { PageTransition } from "@/src/components/PageTransition";

// Import Peta tanpa SSR (Penting untuk Leaflet)
const GpsMapNoSSR = dynamic(() => import("@/src/components/GpsMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-neutral-900 animate-pulse flex items-center justify-center text-xs text-neutral-500">
      Menyiapkan Peta...
    </div>
  )
});

export default function GpsPage() {
  const router = useRouter();
  
  // Data Dummy
  const [latestPos] = useState<[number, number]>([-7.2504, 112.7688]);
  const [history] = useState<[number, number][]>([
    [-7.2520, 112.7705],
    [-7.2510, 112.7695],
    [-7.2504, 112.7688],
  ]);

  return (
    <PageTransition>
      <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-[#F2F2F7] dark:bg-neutral-950 rounded-2xl overflow-hidden">
        
        {/* ── HEADER (Mirip Hero Home) ── */}
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
              <p className="text-xs text-white/60">GPS + Peta Riwayat</p>
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="flex-1 px-4 py-6 space-y-4">
          
          {/* Status Badge */}
          <div className="flex justify-center">
             <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-500 ring-1 ring-emerald-500/20">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Sinyal GPS Aktif
              </span>
          </div>

          {/* Map Card */}
          <div className="h-72 w-full rounded-2xl bg-white dark:bg-neutral-900 shadow-sm ring-1 ring-black/5 dark:ring-white/5 overflow-hidden relative">
            <GpsMapNoSSR latest={latestPos} history={history} />
          </div>

          {/* Info Cards Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white dark:bg-neutral-900 p-4 shadow-sm ring-1 ring-black/5 dark:ring-white/5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40 mb-3">
                <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Latitude</p>
              <p className="text-sm font-mono font-bold text-neutral-900 dark:text-neutral-100">{latestPos[0]}</p>
            </div>

            <div className="rounded-2xl bg-white dark:bg-neutral-900 p-4 shadow-sm ring-1 ring-black/5 dark:ring-white/5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40 mb-3">
                <Navigation className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Longitude</p>
              <p className="text-sm font-mono font-bold text-neutral-900 dark:text-neutral-100">{latestPos[1]}</p>
            </div>
          </div>

          {/* Action Button */}
          <button className="w-full flex items-center justify-center gap-3 rounded-2xl bg-primary px-5 py-5 text-white shadow-lg shadow-primary/20 active:scale-[0.98] transition-all">
            <History className="h-5 w-5" />
            <span className="font-bold">Update Lokasi</span>
          </button>

        </div>
      </div>
    </PageTransition>
  );
}