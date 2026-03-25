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
        presence_id?: string;
        status: string;
        last_ts?: string | null;
      };
    }
  | {
      ok: false;
      error: string;
    };
