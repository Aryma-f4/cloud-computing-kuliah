"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setItem, getItem, keys } from "@/src/lib/storage";
import {
  QrCode, BadgeCheck, BookOpen, CalendarDays,
  Activity, ChevronRight, Wifi,
} from "lucide-react";
import { PageTransition } from "@/src/components/PageTransition";

export default function Home() {
  const router = useRouter();
  const [courseId, setCourseId] = useState(() => getItem(keys.last_course_id) ?? "");
  const [sessionId, setSessionId] = useState(() => getItem(keys.last_session_id) ?? "");
  const [userId] = useState<string | null>(() => getItem(keys.user_id));
  const isReady = !!(courseId && sessionId);

  useEffect(() => {
    if (!userId) router.replace("/login");
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
    <PageTransition>
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-[#F2F2F7] dark:bg-neutral-950  rounded-2xl ">

      {/* ── HERO HEADER ── */}
      <div className="relative bg-neutral-900 dark:bg-black px-6 pt-14 pb-10 overflow-hidden rounded-2xl"> 
        {/* Decorative ambient circles */}
        <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute top-8 -right-4 h-24 w-24 rounded-full bg-white/5" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-5">
            <span className="flex items-center gap-1.5 rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
              <Wifi className="h-3 w-3" />
              Online
            </span>
          </div>
          <p className="text-sm text-neutral-400 font-medium">Selamat datang,</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
            {userId || "Mahasiswa"}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">E-Absen · Presensi QR Dinamis</p>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 px-4 py-6 space-y-5">

        {/* ── SESSION DETAIL CARD ── */}
        <div className="rounded-2xl bg-white dark:bg-neutral-900 shadow-sm ring-1 ring-black/5 dark:ring-white/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
              Detail Sesi
            </p>
          </div>

          {/* Course ID Field */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40">
              <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-xs font-medium text-neutral-400 block mb-0.5">
                Course ID
              </label>
              <input
                type="text"
                placeholder="cloud-101"
                value={courseId}
                onChange={onChangeCourse}
                className="w-full bg-transparent text-sm font-medium text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-300 dark:placeholder:text-neutral-600 outline-none"
              />
            </div>
            {courseId && (
              <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
            )}
          </div>

          {/* Session ID Field */}
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/40">
              <CalendarDays className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-xs font-medium text-neutral-400 block mb-0.5">
                Session ID
              </label>
              <input
                type="text"
                placeholder="sesi-01"
                value={sessionId}
                onChange={onChangeSession}
                className="w-full bg-transparent text-sm font-medium text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-300 dark:placeholder:text-neutral-600 outline-none"
              />
            </div>
            {sessionId && (
              <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
            )}
          </div>
        </div>

        {/* ── PRIMARY CTA: SCAN QR ── */}
        <button
          onClick={() => router.push("/scan")}
          disabled={!isReady}
          className={[
            "w-full flex items-center justify-between rounded-2xl px-5 py-5 text-left",
            "transition-all duration-200",
            isReady
              ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-lg shadow-neutral-900/20 active:scale-[0.98]"
              : "bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed",
          ].join(" ")}
        >
          <div className="flex items-center gap-4">
            <div className={[
              "flex h-12 w-12 items-center justify-center rounded-xl",
              isReady ? "bg-white/15 dark:bg-black/15" : "bg-neutral-300 dark:bg-neutral-700",
            ].join(" ")}>
              <QrCode className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-base leading-tight">Scan QR Presensi</p>
              <p className={`text-xs mt-0.5 ${isReady ? "opacity-60" : "opacity-40"}`}>
                {isReady ? "Kamera siap diaktifkan" : "Isi Course & Session ID dulu"}
              </p>
            </div>
          </div>
          <ChevronRight className={`h-5 w-5 shrink-0 ${isReady ? "opacity-70" : "opacity-30"}`} />
        </button>

        {/* ── SECONDARY ACTION GRID ── */}
        <div className="grid grid-cols-2 gap-3">
          {/* Cek Status */}
          <button
            onClick={() => router.push("/status")}
            disabled={!isReady}
            className={[
              "flex flex-col gap-3 rounded-2xl bg-white dark:bg-neutral-900 p-4 text-left",
              "shadow-sm ring-1 ring-black/5 dark:ring-white/5 transition-all duration-200",
              !isReady
                ? "opacity-50 cursor-not-allowed"
                : "hover:ring-neutral-300 dark:hover:ring-neutral-600 active:scale-[0.97]",
            ].join(" ")}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
              <BadgeCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-tight">
                Cek Status
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">Verifikasi kehadiran</p>
            </div>
          </button>

          {/* Accelerometer */}
          <button
            onClick={() => router.push("/accelerometer")}
            disabled={!isReady}
            className={[
              "flex flex-col gap-3 rounded-2xl bg-white dark:bg-neutral-900 p-4 text-left",
              "shadow-sm ring-1 ring-black/5 dark:ring-white/5 transition-all duration-200",
              !isReady
                ? "opacity-50 cursor-not-allowed"
                : "hover:ring-neutral-300 dark:hover:ring-neutral-600 active:scale-[0.97]",
            ].join(" ")}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/40">
              <Activity className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-tight">
                Sensor
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">Akselerometer</p>
            </div>
          </button>
        </div>

        {/* ── HINT TEXT (visible only when not ready) ── */}
        {!isReady && (
          <p className="text-center text-xs text-neutral-400 dark:text-neutral-600">
            Isi <span className="font-semibold text-neutral-500">Course ID</span> dan{" "}
            <span className="font-semibold text-neutral-500">Session ID</span> untuk mengaktifkan semua fitur
          </p>
        )}
      </div>
    </div>
    </PageTransition>
  );
}
