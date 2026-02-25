const isBrowser = typeof window !== "undefined";

export const keys = {
  user_id: "user_id",
  device_id: "device_id",
  last_course_id: "last_course_id",
  last_session_id: "last_session_id",
} as const;

export function getItem(key: string) {
  if (!isBrowser) return null;
  return window.localStorage.getItem(key);
}

export function setItem(key: string, value: string) {
  if (!isBrowser) return;
  window.localStorage.setItem(key, value);
}

export function removeItem(key: string) {
  if (!isBrowser) return;
  window.localStorage.removeItem(key);
}

export function getISOTime() {
  return new Date().toISOString();
}
