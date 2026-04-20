import { BASE_URL as ENV_BASE_URL } from "@/src/lib/constants";
import type {
  CheckInRequest,
  CheckInResponse,
  StatusQuery,
  StatusResponse,
  PresenceHistoryResponse,
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

const HARDCODED_GAS_URL = "https://script.google.com/macros/s/AKfycbyIhTyCOmVcCoq4ooTBqh1xpLwD4j5paaU1yzqjyPPEwa6X70Ho5J8Ykkf9ZoO1Of5H/exec";
const BASE_URL = ENV_BASE_URL || HARDCODED_GAS_URL;

async function requestJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`invalid_json (status ${res.status}): ${text.slice(0, 200)}`);
  }
}

export async function checkIn(
  payload: CheckInRequest,
  customBaseUrl?: string | null,
): Promise<CheckInResponse> {
  const url = (customBaseUrl?.trim() || BASE_URL);
  return requestJson(`${url}?path=presence/checkin`, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(payload),
  });
}

export async function getStatus(
  query: StatusQuery,
  customBaseUrl?: string | null,
): Promise<StatusResponse> {
  const url = (customBaseUrl?.trim() || BASE_URL);
  const params = new URLSearchParams(query as Record<string, string>);
  return requestJson(`${url}?path=presence/status&${params.toString()}`, {
    method: "GET",
  });
}

export async function getPresenceHistory(
  params: { user_id: string, course_id?: string, session_id?: string, limit?: number },
  customBaseUrl?: string | null,
): Promise<PresenceHistoryResponse> {
  const url = (customBaseUrl?.trim() || BASE_URL);
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) query.append(key, String(value));
  });
  return requestJson(`${url}?path=presence/history&${query.toString()}`, {
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

export async function getGpsLatest(device_id: string, user_id: string): Promise<GetGpsLatestResponse> {
  const params = new URLSearchParams({ device_id, user_id });
  return requestJson(`${BASE_URL}?path=telemetry/gps/latest&${params.toString()}`, {
    method: "GET",
  });
}

export async function getGpsHistory(device_id: string, user_id: string, limit = 100): Promise<GetGpsHistoryResponse> {
  const params = new URLSearchParams({ device_id, user_id, limit: String(limit) });
  return requestJson(`${BASE_URL}?path=telemetry/gps/history&${params.toString()}`, {
    method: "GET",
  });
}
