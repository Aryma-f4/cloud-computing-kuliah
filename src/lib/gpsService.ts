// src/services/gpsService.ts
// ============================================================
//  GPS Telemetry Service
//  Semua request ke GAS lewat sini.
//  BASE_URL = NEXT_PUBLIC_GAS_URL (tanpa trailing slash)
// ============================================================

const BASE_URL = process.env.NEXT_PUBLIC_GPS_GAS_URL as string;

// ── Helpers ──────────────────────────────────────────────────

/** Tambah ?path= ke BASE_URL */
function endpoint(path: string, params?: Record<string, string>) {
  const url = new URL(BASE_URL);
  url.searchParams.set("path", path);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return url.toString();
}

/** GAS butuh Content-Type: text/plain agar tidak trigger CORS preflight */
async function gasPost<T>(path: string, body: object): Promise<T> {
  const res = await fetch(endpoint(path), {
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
  const res = await fetch(endpoint(path, params));
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "GAS error");
  return json;
}

// ── Types ────────────────────────────────────────────────────

export interface GpsPoint {
  ts         : string;       // ISO 8601
  lat        : number;
  lng        : number;
  accuracy_m?: number;
}

export interface LogGpsPayload extends GpsPoint {
  device_id: string;
}

export interface HistoryResponse {
  ok  : boolean;
  data: {
    device_id: string;
    items    : GpsPoint[];
  };
}

export interface LatestResponse {
  ok  : boolean;
  data: GpsPoint | null;
}

// ── API Functions ────────────────────────────────────────────

/**
 * POST /telemetry/gps
 * Kirim satu titik GPS ke server.
 */
export async function logGps(payload: LogGpsPayload): Promise<void> {
  await gasPost("telemetry/gps", payload);
}

/**
 * GET /telemetry/gps/latest?device_id=...
 * Posisi terbaru — dipakai untuk Marker di peta.
 */
export async function getLatest(deviceId: string): Promise<GpsPoint | null> {
  const res = await gasGet<LatestResponse>("telemetry/gps/latest", { device_id: deviceId });
  return res.data;
}

/**
 * GET /telemetry/gps/history?device_id=...&limit=...
 * Daftar titik — dipakai untuk Polyline di peta.
 */
export async function getHistory(deviceId: string, limit = 200): Promise<GpsPoint[]> {
  const res = await gasGet<HistoryResponse>("telemetry/gps/history", {
    device_id: deviceId,
    limit    : String(limit),
  });
  return res.data?.items ?? [];
}

/**
 * Baca koordinat GPS dari browser (Geolocation API).
 */
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