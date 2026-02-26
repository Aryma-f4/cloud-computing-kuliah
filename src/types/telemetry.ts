export type AccelSample = {
  t: string;
  x: number;
  y: number;
  z: number;
};

export type PostAccelRequest = {
  device_id: string;
  ts: string;
  samples: AccelSample[];
};

export type PostAccelResponse = {
  ok: boolean;
  data?: { accepted: number };
  error?: string;
};

export type GetAccelLatestResponse = {
  ok: boolean;
  data?: { t: string; x: number; y: number; z: number } | null;
  error?: string;
};

export type PostGpsRequest = {
  device_id: string;
  ts: string;
  lat: number;
  lng: number;
  accuracy_m?: number | null;
};

export type PostGpsResponse = {
  ok: boolean;
  data?: { accepted: boolean };
  error?: string;
};

export type GetGpsLatestResponse = {
  ok: boolean;
  data?: { ts: string; lat: number; lng: number; accuracy_m: number | null } | null;
  error?: string;
};

export type GetGpsHistoryResponse = {
  ok: boolean;
  data?: { device_id: string; items: Array<{ ts: string; lat: number; lng: number }> };
  error?: string;
};
