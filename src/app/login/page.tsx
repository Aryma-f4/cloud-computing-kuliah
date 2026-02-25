"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { getItem, setItem, keys } from "@/src/lib/storage";
import toast from "react-hot-toast";

function makeDeviceId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `dev-${Math.random().toString(36).slice(2, 10)}`;
}

export default function Login() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [deviceId, setDeviceId] = useState(makeDeviceId());

  useEffect(() => {
    const u = getItem(keys.user_id);
    const d = getItem(keys.device_id);
    if (u && d) router.replace("/");
  }, [router]);

  function handleSave() {
    const u = userId.trim();
    const d = deviceId.trim();
    if (!u || !d) {
      toast.error("Semua field wajib diisi");
      return;
    }
    setItem(keys.user_id, u);
    setItem(keys.device_id, d);
    router.push("/");
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-4">
      <h1 className="text-2xl font-semibold">Selamat Datang</h1>
      <div className="space-y-3">
        <label className="text-sm font-medium">NIM / User ID</label>
        <Input
          placeholder="Masukkan NIM"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
      </div>
      <div className="space-y-3">
        <label className="text-sm font-medium">Device ID</label>
        <Input
          placeholder="Device ID"
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
        />
      </div>
      <Button size="lg" onClick={handleSave}>
        Simpan & Mulai
      </Button>
    </div>
  );
}
