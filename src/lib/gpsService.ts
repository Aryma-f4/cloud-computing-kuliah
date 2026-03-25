// src/lib/gpsService.ts
// ============================================================
// GPS Telemetry Service - JALUR PAKSA (Bypass .env Vercel)
// ============================================================

/** * URL GAS milikmu. 
 */ 
const HARDCODED_GAS_URL = "https://script.google.com/macros/s/AKfycbyzQCDKxqnL61aK1tAdnw22j6SZwU1HPFR694rqhtIS4lzmJYrXM6H6gKXTqD5W1vvQ/exec";

// Gunakan variabel lingkungan jika ada, jika tidak pakai yang di atas
const BASE_URL = process.env.NEXT_PUBLIC_GPS_GAS_URL || HARDCODED_GAS_URL;

function endpoint(path: string, params?: Record<string, string>) {
  if (!BASE_URL) return "";
  try {
    const url = new URL(BASE_URL);
    url.searchParams.set("path", path);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    return url.toString();
  } catch (e) {
    return "";
  }
}

async function gasPost<T>(path: string, body: object): Promise<T> {
  const url = endpoint(path);
  if (!url) throw new Error("URL API tidak valid.");

  const res = await fetch(url, {
    method : "POST",
    headers: { "Content-Type": "text/plain" },
    body   : JSON.stringify(body),
  });
  
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "GAS error");
  return json;
}

async function gasGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = endpoint(path, params);
  if (!url) throw new Error("URL API tidak valid.");

  const res = await fetch(url);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "GAS error");
  return json;
}

export interface GpsPoint {
  ts         : string;
  lat        : number;
  lng        : number;
  accuracy_m?: number;
}

export interface LogGpsPayload extends GpsPoint {
  device_id: string;
}

export const logGps = (payload: LogGpsPayload) => gasPost("telemetry/gps", payload);

export async function getLatest(deviceId: string): Promise<GpsPoint | null> {
  try {
    const res = await gasGet<any>("telemetry/gps/latest", { device_id: deviceId });
    return res.data;
  } catch (e) {
    return null;
  }
}

export async function getHistory(deviceId: string, limit = 200): Promise<GpsPoint[]> {
  try {
    const res = await gasGet<any>("telemetry/gps/history", { device_id: deviceId, limit: String(limit) });
    return res.data?.items ?? [];
  } catch (e) {
    return [];
  }
}

export function readBrowserGps(): Promise<GeolocationCoordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("GPS tidak didukung"));
    
    navigator.geolocation.getCurrentPosition(
      pos => resolve(pos.coords),
      err => reject(err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}