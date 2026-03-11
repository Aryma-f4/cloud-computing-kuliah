"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { User, Fingerprint, ArrowRight } from "lucide-react";

import { getItem, setItem, keys } from "@/src/lib/storage";
import { generateDeviceIdSync } from "@/src/lib/fingerprint";
import { Input } from "@/src/components/ui/Input";
import { Button } from "@/src/components/ui/Button";
import { PageTransition } from "@/src/components/PageTransition";

export default function LoginPage() {
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
      toast.error("NIM / User ID wajib diisi");
      return;
    }

    setItem(keys.user_id, u);
    setItem(keys.device_id, deviceId);
    router.push("/");
  }

  return (
    <PageTransition>
    <section className="flex min-h-dvh items-center justify-center bg-[#f7f7f7] p-0 sm:p-6">
      <div className="relative h-dvh w-full max-w-[393px] overflow-hidden bg-white sm:h-[852px] sm:rounded-[28px] sm:shadow-xl">
        {/* Top decorative area */}
        <div className="relative h-[320px] overflow-hidden bg-primary">
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage: `
                radial-gradient(circle at 20% 30%, rgba(255,255,255,0.55) 0, rgba(255,255,255,0.55) 2px, transparent 2px),
                radial-gradient(circle at 70% 20%, rgba(255,255,255,0.45) 0, rgba(255,255,255,0.45) 2px, transparent 2px),
                radial-gradient(circle at 60% 70%, rgba(255,255,255,0.4) 0, rgba(255,255,255,0.4) 2px, transparent 2px)
              `,
              backgroundSize: "120px 120px",
            }}
          />

          <svg
            className="absolute inset-0 h-full w-full opacity-30"
            viewBox="0 0 393 320"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <path
              d="M-20 40C40 0 100 20 140 60C180 100 240 110 290 80C335 55 380 55 430 95"
              stroke="white"
              strokeWidth="2"
            />
            <path
              d="M-10 120C50 90 90 110 130 145C175 185 245 195 300 160C345 132 385 136 420 165"
              stroke="white"
              strokeWidth="2"
            />
            <path
              d="M0 210C45 180 105 190 145 225C190 265 255 270 310 235C350 210 385 214 425 245"
              stroke="white"
              strokeWidth="2"
            />
            <path
              d="M50 -20C85 20 80 70 45 95C20 115 15 150 35 180C55 210 55 245 25 280"
              stroke="white"
              strokeWidth="2"
            />
            <path
              d="M210 -10C255 20 260 70 225 105C195 135 195 175 220 205C245 235 248 275 220 320"
              stroke="white"
              strokeWidth="2"
            />
          </svg>

          <div className="absolute inset-x-0 bottom-0 h-20 rounded-t-[48px] bg-white" />

          <div className="absolute left-6 top-16 z-10 max-w-[260px]">
            <p className="text-sm font-medium text-white/90">Laman Presensi</p>
            <h1 className="mt-2 text-4xl font-bold leading-tight text-white">
              E-Absen
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/85">
              Login untuk memulai presensi kuliah dengan NIM dan perangkat yang
              terdaftar.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="-mt-2 rounded-t-[32px] bg-white px-6 pb-8 pt-2">
          <form onSubmit={handleSave} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="userId"
                className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-700"
              >
                <User className="h-4 w-4" />
                NIM / User ID
              </label>

              <Input
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Masukkan NIM Anda"
                autoFocus
                required
                className="h-12 w-full rounded-xl border border-[#AACDDC] bg-white px-4 text-neutral-800 placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-[#81A6C6]"
              />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-700">
                <Fingerprint className="h-4 w-4" />
                Device ID (Otomatis)
              </div>

              <div className="rounded-xl border border-dashed border-[#AACDDC] bg-[#f0f7ff] px-4 py-3">
                <p className="text-sm font-medium break-all text-neutral-800">
                  {deviceId}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  ID perangkat dibuat otomatis dan disimpan untuk proses
                  presensi.
                </p>
              </div>
            </div>

            <Button
              type="submit"
              className="mt-2 h-12 w-full rounded-xl bg-primary text-sm font-semibold text-white shadow-none transition hover:bg-hover"
            >
              Simpan & Mulai
            </Button>
          </form>

          <div className="mt-8 flex items-center justify-end gap-3">
            {/* <span className="text-sm font-medium text-neutral-400">
              Masuk ke presensi
            </span> */}
            {/* <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#81A6C6] text-white">
              <ArrowRight className="h-5 w-5" />
            </div> */}
          </div>
        </div>
      </div>
    </section>
    </PageTransition>
  );
}