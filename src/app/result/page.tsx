"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { ErrorAlert } from "@/src/components/ErrorAlert";
import { checkIn } from "@/src/lib/api";
import { getItem, keys, getISOTime } from "@/src/lib/storage";
import type { CheckInResponse } from "@/src/types/presence";
import toast from "react-hot-toast";

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

async function getAccel(): Promise<{ x: number | null; y: number | null; z: number | null; m: number | null }> {
  try {
    // iOS permission
    const DMObj = (window as unknown as { DeviceMotionEvent?: { requestPermission?: () => Promise<string> } }).DeviceMotionEvent;
    if (DMObj && typeof DMObj.requestPermission === "function") {
      try {
        const perm = await DMObj.requestPermission();
        if (perm !== "granted") return { x: null, y: null, z: null, m: null };
      } catch {
        return { x: null, y: null, z: null, m: null };
      }
    }
    return await new Promise((resolve) => {
      let resolved = false;
      const handler = (ev: DeviceMotionEvent) => {
        const a = ev.accelerationIncludingGravity;
        if (!a) {
          cleanup();
          if (!resolved) resolve({ x: null, y: null, z: null, m: null });
          resolved = true;
          return;
        }
        const x = a.x ?? 0;
        const y = a.y ?? 0;
        const z = a.z ?? 0;
        const m = Math.sqrt(x * x + y * y + z * z);
        cleanup();
        if (!resolved) resolve({ x, y, z, m });
        resolved = true;
      };
      const cleanup = () => {
        window.removeEventListener("devicemotion", handler);
      };
      window.addEventListener("devicemotion", handler, { once: true });
      setTimeout(() => {
        cleanup();
        if (!resolved) resolve({ x: null, y: null, z: null, m: null });
      }, 1500);
    });
  } catch {
    return { x: null, y: null, z: null, m: null };
  }
}

export default function Result() {
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

  useEffect(() => {
    if (!payload) return;
    (async () => {
      const [loc, acc] = await Promise.all([getLocation(), getAccel()]);
      const body = {
        ...payload,
        loc_lat: loc.lat,
        loc_lng: loc.lng,
        loc_acc: loc.acc,
        accel_x: acc.x,
        accel_y: acc.y,
        accel_z: acc.z,
        accel_m: acc.m,
      };
      checkIn(body)
        .then((r) => setResp(r))
        .catch(() => setResp({ ok: false, error: "server_error: network" }));
    })();
  }, [payload]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-4">
      <h1 className="text-2xl font-semibold">Hasil Check-in</h1>
      {!payload && (
        <>
          {toast.error("Terjadi kesalahan data, coba lagi")}
          <ErrorAlert>Terjadi kesalahan data, coba lagi</ErrorAlert>
          <Button onClick={() => router.replace("/")}>Kembali ke Home</Button>
        </>
      )}

      {payload && !resp && (
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
