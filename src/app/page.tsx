"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { setItem, getItem, keys } from "@/src/lib/storage";
import { QrCode, BadgeCheck, User, BookOpen, CalendarDays, Activity } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [courseId, setCourseId] = useState(() => getItem(keys.last_course_id) ?? "");
  const [sessionId, setSessionId] = useState(() => getItem(keys.last_session_id) ?? "");
  const [userId] = useState<string | null>(() => getItem(keys.user_id));

  useEffect(() => {
    if (!userId) {
      router.replace("/login");
    }
  }, [router, userId]);

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

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 p-6 bg-gray-100 dark:bg-neutral-950 ">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
          Laman Presensi
        </div>
        <div className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          E-Absen
        </div>
        <div className="mt-3 inline-flex items-center justify-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
          <User className="h-4 w-4" />
          NIM: <span className="font-semibold">{userId || "User"}</span>
        </div>
      </div>

      <div className="space-y-6 mt-4">
        <div className="space-y-2">
          <label className="text-xs md:text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 ml-1 inline-flex items-center gap-2">
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
          <label className="text-xs md:text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 ml-1 inline-flex items-center gap-2">
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

      <div className="mt-8 flex flex-col gap-4">
        <Button
          className="h-14 w-full rounded-xl bg-neutral-900 text-white shadow-none hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
          onClick={() => router.push("/scan")}
          disabled={!courseId || !sessionId}
        >
          <QrCode className="mr-2 h-5 w-5" />
          Scan QR Presensi
        </Button>
        <Button
          variant="outline"
          className="h-14 w-full rounded-xl border-neutral-200 text-neutral-700 shadow-none hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900 transition-colors"
          onClick={() => router.push("/status")}
          disabled={!courseId || !sessionId}
        >
          <BadgeCheck className="mr-2 h-5 w-5" />
          Cek Status Presensi
        </Button>
        <Button
          variant="outline"
          className="h-14 w-full rounded-xl border-neutral-200 text-neutral-700 shadow-none hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900 transition-colors"
          onClick={() => router.push("/accelerometer")}
          disabled={!courseId || !sessionId}
        >
          <Activity className="mr-2 h-5 w-5" />
          Accelerometer
        </Button>
      </div>
    </div>
  );
}
