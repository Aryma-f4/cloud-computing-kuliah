// src/lib/gpsService.ts
// ============================================================
// GPS Telemetry Service - JALUR PAKSA (Bypass .env Vercel)
// ============================================================

const HARDCODED_GAS_URL = "https://script.google.com/macros/s/AKfycbyzQCDKxqnL61aK1tAdnw22j6SZwU1HPFR694rqhtIS4lzmJYrXM6H6gKXTqD5W1vvQ/exec";
const BASE_URL = process.env.NEXT_PUBLIC_GPS_GAS_URL || HARDCODED_GAS_URL;

// ── Helpers ──────────────────────────────────────────────────

/** Tambah ?path= ke BASE_URL */
function endpoint(path: string, params?: Record<string, string>) {
  if (!BASE_URL) {
    console.warn("NEXT_PUBLIC_GPS_GAS_URL tidak didefinisikan!");
    return "";
  }
  try {
    const url = new URL(BASE_URL);
    url.searchParams.set("path", path);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    return url.toString();
  } catch (e) {
    console.error("URL Error:", e);
    return "";
  }
}

/** GAS butuh Content-Type: text/plain agar tidak trigger CORS preflight */
async function gasPost<T>(path: string, body: object): Promise<T> {
  const url = endpoint(path);
  if (!url) throw new Error("URL Endpoint tidak valid");

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
  if (!url) throw new Error("URL Endpoint tidak valid");

  const res = await fetch(url);
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
  try {
    const res = await gasGet<LatestResponse>("telemetry/gps/latest", { device_id: deviceId });
    return res.data;
  } catch (e) {
    console.warn("Gagal get latest:", e);
    return null;
  }
}

/**
 * GET /telemetry/gps/history?device_id=...&limit=...
 * Daftar titik — dipakai untuk Polyline di peta.
 */
export async function getHistory(deviceId: string, limit = 200): Promise<GpsPoint[]> {
  try {
    const res = await gasGet<HistoryResponse>("telemetry/gps/history", {
      device_id: deviceId,
      limit    : String(limit),
    });
    return res.data?.items ?? [];
  } catch (e) {
    console.warn("Gagal get history:", e);
    return [];
  }
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
      { 
        enableHighAccuracy: true, 
        timeout: 30000, // Timeout 30 detik agar lebih stabil (sesuai request)
        maximumAge: 0   // Selalu ambil data paling fresh
      }
    );
  });
}