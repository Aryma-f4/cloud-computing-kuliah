"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { ErrorAlert } from "@/src/components/ErrorAlert";
import { checkIn, postGps } from "@/src/lib/api";
import { getItem, keys, getISOTime } from "@/src/lib/storage";
import type { CheckInResponse } from "@/src/types/presence";
import { PageTransition } from "@/src/components/PageTransition";

function getLocation(): Promise<{ lat: number | null; lng: number | null; acc: number | null }> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve({ lat: null, lng: null, acc: null });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude ?? null,
          lng: pos.coords.longitude ?? null,
          acc: pos.coords.accuracy ?? null,
        });
      },
      () => resolve({ lat: null, lng: null, acc: null }),
      { enableHighAccuracy: true, timeout: 4000, maximumAge: 0 }
    );
  });
}

function ResultContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = useMemo(() => params.get("token") ?? "", [params]);
  const payload = useMemo(() => {
    if (!token) return null;
    const user_id = getItem(keys.user_id);
    const device_id = getItem(keys.device_id);
    const course_id = getItem(keys.last_course_id);
    const session_id = getItem(keys.last_session_id);
    if (!user_id || !device_id || !course_id || !session_id) return null;
    return {
      user_id,
      device_id,
      course_id,
      session_id,
      qr_token: token,
      ts: getISOTime(),
    };
  }, [token]);
  
  const [resp, setResp] = useState<CheckInResponse | null>(null);
  const [loc, setLoc] = useState<{ lat: number | null; lng: number | null; acc: number | null } | null>(null);
  const [stage, setStage] = useState<"gather" | "confirm" | "sending" | "done">("gather");

  useEffect(() => {
    if (!payload) return;
    (async () => {
      const l = await getLocation();
      setLoc(l);
      setStage("confirm");
    })();
  }, [payload]);

  function makeOsmEmbed(lat: number, lng: number) {
    const delta = 0.005;
    const left = lng - delta;
    const right = lng + delta;
    const bottom = lat - delta;
    const top = lat + delta;
    const bbox = `${left}%2C${bottom}%2C${right}%2C${top}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
  }

  async function submit() {
    if (!payload) return;
    setStage("sending");
    try {
      if (loc?.lat != null && loc?.lng != null) {
        try {
          await postGps({
            device_id: payload.device_id,
            ts: getISOTime(),
            lat: loc.lat,
            lng: loc.lng,
            accuracy_m: loc.acc ?? null,
          });
        } catch { }
      }
      const r = await checkIn(payload);
      setResp(r);
    } catch {
      setResp({ ok: false, error: "server_error: network" });
    } finally {
      setStage("done");
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-4">
      <h1 className="text-2xl font-semibold">Hasil Check-in</h1>
      {!payload && (
        <div className="flex flex-col gap-4 mt-4">
          <ErrorAlert>Data sesi tidak lengkap atau QR Code tidak valid. Silakan coba lagi.</ErrorAlert>
          <Button onClick={() => router.replace("/")} className="w-full py-3 rounded-xl font-medium">
            Kembali ke Beranda
          </Button>
        </div>
      )}

      {/* STAGE: GATHERING LOCATION */}
      {payload && stage === "gather" && (
        <Card>
          <div className="flex flex-col items-center justify-center p-10 space-y-4">
            <div className="size-10 animate-spin rounded-full border-4 border-neutral-200 border-t-blue-600 dark:border-neutral-700 dark:border-t-blue-500" />
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 animate-pulse">
              Mendeteksi lokasi Anda...
            </p>
          </div>
        </Card>
      )}

      {/* STAGE: CONFIRMATION (MAP) */}
      {payload && stage === "confirm" && (
        <Card>
          <div className="flex flex-col p-5 space-y-5">
            <div className="flex flex-col space-y-1">
              <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                Konfirmasi Lokasi
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Lokasi ini akan dikirim sebagai bukti presensi Anda.
              </p>
            </div>

            {loc?.lat != null && loc?.lng != null ? (
              <div className="relative overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 shadow-inner">
                {loc?.acc != null && (
                  <div className="absolute top-2 right-2 z-10 bg-white/90 dark:bg-black/80 backdrop-blur-sm px-2.5 py-1 rounded-md text-[11px] font-medium text-neutral-700 dark:text-neutral-300 shadow-sm border border-neutral-200 dark:border-neutral-700">
                    Akurasi ±{Math.round(loc.acc)} m
                  </div>
                )}
                <iframe title="Lokasi Anda" src={makeOsmEmbed(loc.lat, loc.lng)} className="h-56 w-full border-0 pointer-events-none" />
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 text-center">
                <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">Lokasi Tidak Tersedia</p>
                <p className="text-xs text-red-500 dark:text-red-500/80">Mohon izinkan akses lokasi pada browser Anda.</p>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2">
              <Button onClick={submit} className="w-full py-3 rounded-xl font-medium shadow-sm bg-blue-600 hover:bg-blue-700 text-white">
                Kirim Presensi Sekarang
              </Button>
              <Button variant="outline" onClick={() => router.replace("/")} className="w-full py-3 rounded-xl">
                Batalkan
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* STAGE: SENDING DATA */}
      {payload && stage === "sending" && (
        <Card>
          <div className="flex flex-col items-center justify-center p-10 space-y-4">
            <div className="size-10 animate-spin rounded-full border-4 border-neutral-200 border-t-blue-600 dark:border-neutral-700 dark:border-t-blue-500" />
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 animate-pulse">
              Mengirim data presensi...
            </p>
          </div>
        </Card>
      )}

      {/* STAGE: DONE - SUCCESS */}
      {payload && resp && resp.ok && (
        <Card>
          <div className="flex flex-col items-center text-center p-8 space-y-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 dark:text-green-500">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Berhasil Terkirim!</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Kehadiran Anda sudah tercatat.</p>
            </div>

            <div className="w-full mt-2 bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 border border-neutral-100 dark:border-neutral-800 text-left space-y-3 text-sm">
              <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-800 pb-2">
                <span className="text-neutral-500">ID Presensi</span>
                <span className="font-mono font-semibold text-neutral-900 dark:text-white">{resp.data.presence_id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Status</span>
                <span className="font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-2.5 py-0.5 rounded-full text-xs uppercase tracking-wider">
                  {resp.data.status}
                </span>
              </div>
            </div>

            <Button onClick={() => router.replace("/")} className="w-full mt-4 py-3 rounded-xl font-medium">
              Selesai & Kembali
            </Button>
          </div>
        </Card>
      )}

      {/* STAGE: DONE - ERROR */}
      {payload && resp && !resp.ok && (
        <Card>
           <div className="flex flex-col items-center text-center p-6 space-y-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 dark:text-red-500">
                <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
              </svg>
            </div>
            
            <div className="space-y-1 w-full">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Presensi Gagal</h3>
              <ErrorAlert>
                {resp.error === "token_invalid" && "QR Code tidak valid atau tidak dikenali."}
                {resp.error === "token_expired" && "QR Code sudah kedaluwarsa. Silakan minta dosen untuk refresh."}
                {resp.error === "already_checked_in" && "Anda sudah melakukan presensi untuk sesi ini sebelumnya."}
                {resp.error?.startsWith("missing_field") && "Terjadi kesalahan kelengkapan data. Silakan coba lagi."}
                {resp.error?.startsWith("server_error") && "Terjadi gangguan pada server. Coba beberapa saat lagi."}
                {![
                  "token_invalid",
                  "token_expired",
                  "already_checked_in",
                ].includes(resp.error) &&
                  !resp.error?.startsWith("missing_field") &&
                  !resp.error?.startsWith("server_error") &&
                  "Gagal melakukan presensi. Terjadi kesalahan yang tidak diketahui."}
              </ErrorAlert>
            </div>

            <Button onClick={() => router.replace("/scan")} className="w-full mt-2 py-3 rounded-xl font-medium">
              Scan Ulang QR Code
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function Result() {
  return (
    <PageTransition>
      <Suspense
        fallback={
          <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-5 bg-neutral-50 dark:bg-neutral-950">
            <Card>
              <div className="flex flex-col items-center justify-center p-10 space-y-4">
                <div className="size-10 animate-spin rounded-full border-4 border-neutral-200 border-t-blue-600 dark:border-neutral-700 dark:border-t-blue-500" />
                <p className="text-sm font-medium text-neutral-500">Menyiapkan halaman...</p>
              </div>
            </Card>
          </div>
        }
      >
        <ResultContent />
      </Suspense>
    </PageTransition>
  );
}