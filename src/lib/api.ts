import { BASE_URL as ENV_BASE_URL } from "@/src/lib/constants";
import type {
  CheckInRequest,
  CheckInResponse,
  StatusQuery,
  StatusResponse,
} from "@/src/types/presence";
import type {
  PostAccelRequest,
  PostAccelResponse,
  GetAccelLatestResponse,
  PostGpsRequest,
  PostGpsResponse,
  GetGpsLatestResponse,
  GetGpsHistoryResponse,
} from "@/src/types/telemetry";

const HARDCODED_GAS_URL = "https://script.google.com/macros/s/AKfycbyzQCDKxqnL61aK1tAdnw22j6SZwU1HPFR694rqhtIS4lzmJYrXM6H6gKXTqD5W1vvQ/exec";
const BASE_URL = ENV_BASE_URL || HARDCODED_GAS_URL;

async function requestJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`http_${res.status}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json") && !ct.includes("text/plain")) {
    throw new Error("invalid_response");
  }
  return res.json();
}

export async function checkIn(payload: CheckInRequest): Promise<CheckInResponse> {
  return requestJson(`${BASE_URL}?path=presence/checkin`, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(payload),
  });
}

export async function getStatus(query: StatusQuery): Promise<StatusResponse> {
  const params = new URLSearchParams(query as Record<string, string>);
  return requestJson(`${BASE_URL}?path=presence/status&${params.toString()}`, {
    method: "GET",
  });
}

export async function generateQrToken(payload: { course_id: string, session_id: string, ts: string }): Promise<{ ok: boolean, data: { qr_token: string, expires_at: string } }> {
  return requestJson(`${BASE_URL}?path=presence/qr/generate`, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(payload),
  });
}

export async function postAccel(payload: PostAccelRequest): Promise<PostAccelResponse> {
  return requestJson(`${BASE_URL}?path=telemetry/accel`, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(payload),
  });
}

export async function getAccelLatest(device_id: string): Promise<GetAccelLatestResponse> {
  const params = new URLSearchParams({ device_id });
  return requestJson(`${BASE_URL}?path=telemetry/accel/latest&${params.toString()}`, {
    method: "GET",
  });
}

export async function postGps(payload: PostGpsRequest): Promise<PostGpsResponse> {
  return requestJson(`${BASE_URL}?path=telemetry/gps`, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(payload),
  });
}

export async function getGpsLatest(device_id: string): Promise<GetGpsLatestResponse> {
  const params = new URLSearchParams({ device_id });
  return requestJson(`${BASE_URL}?path=telemetry/gps/latest&${params.toString()}`, {
    method: "GET",
  });
}

export async function getGpsHistory(device_id: string, limit = 100): Promise<GetGpsHistoryResponse> {
  const params = new URLSearchParams({ device_id, limit: String(limit) });
  return requestJson(`${BASE_URL}?path=telemetry/gps/history&${params.toString()}`, {
    method: "GET",
  });
}
