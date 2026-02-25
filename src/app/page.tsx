"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { setItem, getItem, keys } from "@/src/lib/storage";

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
      <h1 className="text-2xl font-semibold">
        {userId ? `Halo, ${userId}` : "Memuat..."}
      </h1>

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
          Scan QR Presensi
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push("/status")}
          disabled={!courseId || !sessionId}
        >
          Cek Status Presensi
        </Button>
      </div>
    </div>
  );
}
