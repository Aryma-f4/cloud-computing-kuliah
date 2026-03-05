"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Card } from "@/src/components/ui/Card";
import { getItem, setItem, keys } from "@/src/lib/storage";
import { getStatus } from "@/src/lib/api";
import type { StatusResponse } from "@/src/types/presence";
import { BadgeCheck, BookOpen, CalendarDays, User, Hash, AlertCircle, RefreshCw, QrCode } from "lucide-react";

export default function Status() {
  const router = useRouter();
  const [courseId, setCourseId] = useState(() => getItem(keys.last_course_id) ?? "");
  const [sessionId, setSessionId] = useState(() => getItem(keys.last_session_id) ?? "");
  const [resp, setResp] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const u = getItem(keys.user_id);
    if (!u) router.replace("/login");
  }, [router]);

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
    const r = await getStatus({ user_id, course_id: courseId.trim(), session_id: sessionId.trim() });
    setResp(r);
    setLoading(false);
  }

  return (
    <section className="bg-gray-100 dark:bg-neutral-950 min-h-dvh">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-8 p-6">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
            Laman Presensi
          </div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Status Presensi
          </div>
          <div className="mt-3 inline-flex items-center justify-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
            <User className="h-4 w-4" />
            NIM: <span className="font-semibold">{getItem(keys.user_id) || "User"}</span>
          </div>
        </div>

        <div className="space-y-6 mt-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 ml-1 inline-flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Course ID
            </label>
            <Input
              placeholder="cloud-101"
              value={courseId}
              onChange={onChangeCourse}
              className="h-12 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 ml-1 inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Session ID
            </label>
            <Input
              placeholder="sesi-01"
              value={sessionId}
              onChange={onChangeSession}
              className="h-12 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          <Button
            className="h-14 w-full rounded-xl bg-neutral-900 text-white shadow-none hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
            onClick={check}
            disabled={!courseId || !sessionId || loading}
          >
            <BadgeCheck className="mr-2 h-5 w-5" />
            Cek Status Presensi
          </Button>
        </div>

        {loading && (
          <Card>
            <div className="flex items-center justify-center p-6">
              <div className="size-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black dark:border-neutral-700 dark:border-t-white" />
            </div>
          </Card>
        )}

        {!loading && resp && resp.ok && (
          <>
            {resp.data.status === "checked_in" ? (
              <Card>
                <div className="space-y-2">
                  <div className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700 dark:bg-green-900 dark:text-green-200">
                    ✓ HADIR
                  </div>
                  {resp.data.presence_id && (
                    <div className="inline-flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                      <Hash className="h-4 w-4" />
                      ID: {resp.data.presence_id}
                    </div>
                  )}
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">
                    Presensi Anda telah tercatat. Terima kasih.
                  </div>
                </div>
              </Card>
            ) : (
              <Card>
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-700 dark:bg-red-900 dark:text-red-200">
                    <AlertCircle className="h-4 w-4" />
                    Belum Hadir
                  </div>
                  <div className="text-sm text-neutral-700 dark:text-neutral-300">
                    Anda belum tercatat hadir untuk
                    <span className="font-semibold"> {courseId}</span> •
                    <span className="font-semibold"> {sessionId}</span>.
                  </div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400">
                    Tips: Pastikan scan QR sesi yang aktif, atau refresh status setelah berhasil check-in.
                  </div>
                  <div className="flex gap-3 pt-1">
                    <Button
                      onClick={() => router.push("/scan")}
                      className="h-11 rounded-lg bg-neutral-900 text-white shadow-none hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
                    >
                      <QrCode className="mr-2 h-5 w-5" />
                      Scan QR Presensi
                    </Button>
                    <Button
                      variant="outline"
                      onClick={check}
                      className="h-11 rounded-lg border-neutral-200 text-neutral-700 shadow-none hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900 transition-colors"
                    >
                      <RefreshCw className="mr-2 h-5 w-5" />
                      Refresh Status
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </section>
  );
}
