"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { setItem, getItem, keys } from "@/src/lib/storage";
import { QrCode, BadgeCheck } from "lucide-react";

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
      <div className="space-y-2 text-center bg-black rounded-2xl p-6">
        <h1 className="text-3xl font-light tracking-tight text-white dark:text-neutral-50">
          E-Absen
        </h1>
        <p className="text-sm text-white dark:text-neutral-400">
          Laman Presensi Mahasiswa
        </p>
        <div className="pt-2 text-xs font-medium text-white dark:text-neutral-500">
          selamat datang <br /> {userId || "User"}
        </div>
      </div>

      <div className="space-y-6 mt-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 ml-1">
            Course ID
          </label>
          <Input
            placeholder="CT-101"
            value={courseId}
            onChange={onChangeCourse}
            className="h-12 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 ml-1">
            Session ID
          </label>
          <Input
            placeholder="S-001"
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
      </div>
    </div>
  );
}
