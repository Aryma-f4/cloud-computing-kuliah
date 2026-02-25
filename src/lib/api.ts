import { BASE_URL } from "@/src/lib/constants";
import type {
  CheckInRequest,
  CheckInResponse,
  StatusQuery,
  StatusResponse,
} from "@/src/types/presence";

export async function checkIn(payload: CheckInRequest): Promise<CheckInResponse> {
  const res = await fetch(`${BASE_URL}/presence/checkin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function getStatus(query: StatusQuery): Promise<StatusResponse> {
  const params = new URLSearchParams(query as Record<string, string>);
  const res = await fetch(`${BASE_URL}/presence/status?${params.toString()}`, {
    method: "GET",
  });
  return res.json();
}
