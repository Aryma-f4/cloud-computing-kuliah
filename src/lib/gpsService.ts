// src/services/gpsService.ts
// ============================================================
//  GPS Telemetry Service - FIXED
// ============================================================

const BASE_URL = process.env.NEXT_PUBLIC_GPS_GAS_URL;

/** Tambah ?path= ke BASE_URL dengan validasi */
function endpoint(path: string, params?: Record<string, string>) {
  if (!BASE_URL) {
    // Memberikan pesan error yang lebih jelas daripada "Invalid URL"
    throw new Error("Konfigurasi API (NEXT_PUBLIC_GPS_GAS_URL) belum diatur di file .env");
  }

  try {
    const url = new URL(BASE_URL);
    url.searchParams.set("path", path);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    return url.toString();
  } catch (e) {
    throw new Error("Format URL di .env tidak valid. Pastikan diawali dengan https://");
  }
}

/** GAS butuh Content-Type: text/plain agar tidak trigger CORS preflight */
async function gasPost<T>(path: string, body: object): Promise<T> {
  const url = endpoint(path);
  const res = await fetch(url, {
    method : "POST",
    headers: { "Content-Type": "text/plain" },
    body   : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "GAS error");
  return json;
}

async function gasGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = endpoint(path, params);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "GAS error");
  return json;
}

// ── Types & API Functions tetap sama ──
export interface GpsPoint {
  ts         : string;
  lat        : number;
  lng        : number;
  accuracy_m?: number;
}

export interface LogGpsPayload extends GpsPoint {
  device_id: string;
}

export async function logGps(payload: LogGpsPayload): Promise<void> {
  await gasPost("telemetry/gps", payload);
}

export async function getLatest(deviceId: string): Promise<GpsPoint | null> {
  const res = await gasGet<{ok: boolean, data: GpsPoint | null}>("telemetry/gps/latest", { device_id: deviceId });
  return res.data;
}

export async function getHistory(deviceId: string, limit = 200): Promise<GpsPoint[]> {
  const res = await gasGet<{ok: boolean, data: {items: GpsPoint[]}}>("telemetry/gps/history", {
    device_id: deviceId,
    limit    : String(limit),
  });
  return res.data?.items ?? [];
}

export function readBrowserGps(): Promise<GeolocationCoordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Browser tidak mendukung Geolocation"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve(pos.coords),
      err => reject(err),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 }
    );
  });
}