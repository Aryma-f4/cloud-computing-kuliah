"use client";
import { useState } from "react";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Card } from "@/src/components/ui/Card";
import { getItem, setItem, keys } from "@/src/lib/storage";
import { getStatus } from "@/src/lib/api";
import type { StatusResponse } from "@/src/types/presence";

export default function Status() {
  const [courseId, setCourseId] = useState(() => getItem(keys.last_course_id) ?? "");
  const [sessionId, setSessionId] = useState(() => getItem(keys.last_session_id) ?? "");
  const [resp, setResp] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(false);

  function onChangeCourse(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.trim();
    setCourseId(v);
    setItem(keys.last_course_id, v);
  }
  function onChangeSession(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.trim();
    setSessionId(v);
    setItem(keys.last_session_id, v);
  }

  async function check() {
    const user_id = getItem(keys.user_id);
    if (!user_id) return;
    setLoading(true);
    const r = await getStatus({ user_id, course_id: courseId, session_id: sessionId });
    setResp(r);
    setLoading(false);
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-4">
      <h1 className="text-2xl font-semibold">Status Presensi</h1>

      <div className="space-y-3">
        <label className="text-sm font-medium">Course ID</label>
        <Input value={courseId} onChange={onChangeCourse} />
      </div>
      <div className="space-y-3">
        <label className="text-sm font-medium">Session ID</label>
        <Input value={sessionId} onChange={onChangeSession} />
      </div>
      <Button onClick={check} disabled={!courseId || !sessionId}>
        Cek Status
      </Button>

      {loading && (
        <Card>
          <div className="flex items-center justify-center p-6">
            <div className="size-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black dark:border-neutral-700 dark:border-t-white" />
          </div>
        </Card>
      )}

      {!loading && resp && resp.ok && (
        <Card>
          <div className="flex items-center gap-3">
            <span
              className={
                "inline-flex items-center rounded-full px-3 py-1 text-sm " +
                (resp.data.status === "checked_in"
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                  : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200")
              }
            >
              {resp.data.status === "checked_in" ? "✓ HADIR" : "✗ BELUM HADIR"}
            </span>
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              {resp.data.presence_id ? `ID: ${resp.data.presence_id}` : ""}
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}
