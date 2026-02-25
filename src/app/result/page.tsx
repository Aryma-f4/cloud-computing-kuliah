"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { ErrorAlert } from "@/src/components/ErrorAlert";
import { checkIn } from "@/src/lib/api";
import { getItem, keys, getISOTime } from "@/src/lib/storage";
import type { CheckInResponse } from "@/src/types/presence";
import toast from "react-hot-toast";

export default function Result() {
  const router = useRouter();
  const params = useSearchParams();
  const token = useMemo(() => params.get("token") ?? "", [params]);
  const [resp, setResp] = useState<CheckInResponse | null>(null);

  useEffect(() => {
    if (!token) return;
    const user_id = getItem(keys.user_id);
    const device_id = getItem(keys.device_id);
    const course_id = getItem(keys.last_course_id);
    const session_id = getItem(keys.last_session_id);
    if (!user_id || !device_id || !course_id || !session_id) {
      toast.error("Terjadi kesalahan data, coba lagi");
      return;
    }
    checkIn({
      user_id,
      device_id,
      course_id,
      session_id,
      qr_token: token,
      ts: getISOTime(),
    })
      .then((r) => setResp(r));
  }, [token]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-4">
      <h1 className="text-2xl font-semibold">Hasil Check-in</h1>
      {!resp && (
        <Card>
          <div className="flex items-center justify-center p-6">
            <div className="size-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black dark:border-neutral-700 dark:border-t-white" />
          </div>
        </Card>
      )}

      {resp && resp.ok && (
        <Card>
          <div className="space-y-2">
            <div className="text-green-600 dark:text-green-400">Sukses</div>
            <div className="text-sm">
              ID: {resp.data.presence_id} • Status: {resp.data.status}
            </div>
          </div>
        </Card>
      )}

      {resp && !resp.ok && (
        <>
          <ErrorAlert>
            {resp.error === "token_invalid" && "QR Code tidak valid"}
            {resp.error === "token_expired" &&
              "QR Code sudah kedaluwarsa, minta dosen refresh"}
            {resp.error === "already_checked_in" &&
              "Anda sudah melakukan presensi untuk sesi ini"}
            {resp.error?.startsWith("missing_field") &&
              "Terjadi kesalahan data, coba lagi"}
            {resp.error?.startsWith("server_error") &&
              "Server error, coba beberapa saat lagi"}
            {![
              "token_invalid",
              "token_expired",
              "already_checked_in",
            ].includes(resp.error) &&
              !resp.error?.startsWith("missing_field") &&
              !resp.error?.startsWith("server_error") &&
              "Gagal melakukan presensi"}
          </ErrorAlert>
          <Button onClick={() => router.replace("/scan")}>Scan Ulang</Button>
        </>
      )}
    </div>
  );
}
