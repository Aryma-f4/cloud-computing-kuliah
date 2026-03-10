"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getItem, setItem, keys } from "@/src/lib/storage";
import toast from "react-hot-toast";
import { generateDeviceIdSync } from "@/src/lib/fingerprint";
import { Input } from "@/src/components/ui/Input";
import { Button } from "@/src/components/ui/Button";
import { User, Fingerprint } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [deviceId] = useState(() => generateDeviceIdSync());

  useEffect(() => {
    const u = getItem(keys.user_id);
    const d = getItem(keys.device_id);
    if (u && d) router.replace("/");
  }, [router]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const u = userId.trim();
    if (!u) {
      toast.error("User ID wajib diisi");
      return;
    }
    setItem(keys.user_id, u);
    setItem(keys.device_id, deviceId);
    router.push("/");
  }

  return (
    <section className="bg-gray-100 dark:bg-neutral-950 min-h-dvh">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-8 p-6">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
            Laman Presensi
          </div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Login Akun
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSave}>
          <div className="space-y-2">
            <label
              htmlFor="userId"
              className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 ml-1 inline-flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              NIM / User ID
            </label>
            <Input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Masukkan NIM Anda"
              required
              className="h-12 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="deviceId"
              className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 ml-1 inline-flex items-center gap-2"
            >
              <Fingerprint className="h-4 w-4" />
              Device ID (Otomatis)
            </label>
            <Input
              id="deviceId"
              value={deviceId}
              readOnly
              disabled
              className="h-12 bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 cursor-not-allowed"
            />
          </div>

          <Button
            type="submit"
            className="h-14 w-full rounded-xl bg-neutral-900 text-white shadow-none hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
          >
            Simpan & Mulai
          </Button>
        </form>
      </div>
    </section>
  );
}
