export type CheckInRequest = {
  user_id: string;
  device_id: string;
  course_id: string;
  session_id: string;
  qr_token: string;
  ts: string;
  loc_lat?: number | null;
  loc_lng?: number | null;
  loc_acc?: number | null;
  accel_x?: number | null;
  accel_y?: number | null;
  accel_z?: number | null;
  accel_m?: number | null;
};

export type CheckInSuccess = {
  ok: true;
  data: {
    presence_id: string;
    status: string;
  };
};

export type CheckInFailure = {
  ok: false;
  error: string;
};

export type CheckInResponse = CheckInSuccess | CheckInFailure;

export type StatusQuery = {
  user_id: string;
  course_id: string;
  session_id: string;
};

export type StatusResponse =
  | {
      ok: true;
      data: {
        presence_id?: string | null;
        status: string;
        last_ts?: string | null;
        stats?: {
          total_presence: number;
          percentage: number;
          max_sessions: number;
        };
        debug?: {
          total_rows: number;
          searched_user_id: string;
        };
      };
    }
  | {
      ok: false;
      error: string;
    };

export type PresenceHistoryItem = {
  presence_id: string;
  course_id: string;
  session_id: string;
  status: string;
  ts: string;
};

export type PresenceHistoryResponse =
  | {
      ok: true;
      data: {
        user_id: string;
        total: number;
        limit: number;
        records: PresenceHistoryItem[];
      };
    }
  | {
      ok: false;
      error: string;
    };
