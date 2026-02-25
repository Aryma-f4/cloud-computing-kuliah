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
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-4">
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 p-5 text-white shadow-lg">
        <div className="text-xs opacity-90">Selamat datang{userId ? `, ${userId}` : ""}</div>
        <div className="mt-1 text-3xl font-bold tracking-tight">E-Kuliah</div>
        <div className="mt-1 text-sm opacity-90">Presensi QR Dinamis</div>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium">Course ID</label>
        <Input
          placeholder="CT-101"
          value={courseId}
          onChange={onChangeCourse}
        />
      </div>
      <div className="space-y-3">
        <label className="text-sm font-medium">Session ID</label>
        <Input
          placeholder="S-001"
          value={sessionId}
          onChange={onChangeSession}
        />
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <Button
          size="lg"
          onClick={() => {
            router.push("/scan");
          }}
          disabled={!courseId || !sessionId}
        >
          <QrCode className="mr-2 h-5 w-5" />
          Scan QR Presensi
        </Button>
        <Button
          variant="outline"
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
