"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { ErrorAlert } from "@/src/components/ErrorAlert";
import { checkIn, postGps } from "@/src/lib/api";
import { getItem, keys, getISOTime } from "@/src/lib/storage";
import type { CheckInResponse } from "@/src/types/presence";

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
        } catch {}
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
        <>
          <ErrorAlert>Terjadi kesalahan data, coba lagi</ErrorAlert>
          <Button onClick={() => router.replace("/")}>Kembali ke Home</Button>
        </>
      )}

      {payload && stage === "gather" && (
        <Card>
          <div className="flex items-center justify-center p-6">
            <div className="size-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black dark:border-neutral-700 dark:border-t-white" />
          </div>
        </Card>
      )}

      {payload && stage === "confirm" && (
        <Card>
          <div className="space-y-3">
            <div className="text-sm text-neutral-700 dark:text-neutral-300">Konfirmasi lokasi sebelum kirim presensi</div>
            {loc?.lat != null && loc?.lng != null ? (
              <div className="overflow-hidden rounded-lg">
                <iframe title="Lokasi Anda" src={makeOsmEmbed(loc.lat, loc.lng)} className="h-64 w-full border-0" />
              </div>
            ) : (
              <ErrorAlert>Lokasi tidak tersedia (izinkan akses lokasi)</ErrorAlert>
            )}
            {loc?.acc != null && (
              <div className="text-xs text-neutral-600 dark:text-neutral-400">Akurasi ±{Math.round(loc.acc)} m</div>
            )}
            <div className="flex gap-3 pt-2">
              <Button onClick={submit}>Kirim Presensi</Button>
              <Button variant="outline" onClick={() => router.replace("/")}>Batal</Button>
            </div>
          </div>
        </Card>
      )}

      {payload && stage === "sending" && (
        <Card>
          <div className="flex items-center justify-center p-6">
            <div className="size-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black dark:border-neutral-700 dark:border-t-white" />
          </div>
        </Card>
      )}

      {payload && resp && resp.ok && (
        <Card>
          <div className="space-y-2">
            <div className="text-green-600 dark:text-green-400">Sukses</div>
            <div className="text-sm">
              ID: {resp.data.presence_id} • Status: {resp.data.status}
            </div>
          </div>
        </Card>
      )}

      {payload && resp && !resp.ok && (
        <>
          <ErrorAlert>
            {resp.error === "token_invalid" && "QR Code tidak valid"}
            {resp.error === "token_expired" &&
              "QR Code sudah kedaluwarsa, minta dosen refresh"}
            {resp.error === "already_checked_in" &&
              "Anda sudah melakukan presensi untuk sesi ini"}
            {resp.error?.startsWith("missing_field") &&
              "Terjadi kesalahan data, coba lagi"}
            {resp.error?.startsWith("server_error") &&
              "Server error, coba beberapa saat lagi"}
            {![
              "token_invalid",
              "token_expired",
              "already_checked_in",
            ].includes(resp.error) &&
              !resp.error?.startsWith("missing_field") &&
              !resp.error?.startsWith("server_error") &&
              "Gagal melakukan presensi"}
          </ErrorAlert>
          <Button onClick={() => router.replace("/scan")}>Scan Ulang</Button>
        </>
      )}
    </div>
  );
}

export default function Result() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-4">
          <Card>
            <div className="flex items-center justify-center p-6">
              <div className="size-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black dark:border-neutral-700 dark:border-t-white" />
            </div>
          </Card>
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
