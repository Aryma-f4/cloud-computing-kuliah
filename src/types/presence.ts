export type CheckInRequest = {
  user_id: string;
  device_id: string;
  course_id: string;
  session_id: string;
  qr_token: string;
  ts: string;
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
      };
    }
  | {
      ok: false;
      error: string;
    };
