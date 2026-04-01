"use client";
import React, { useEffect, useState, useCallback, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Card } from "@/src/components/ui/Card";
import { getItem, setItem, keys } from "@/src/lib/storage";
import { getStatus } from "@/src/lib/api";
import type { StatusResponse } from "@/src/types/presence";
import { BadgeCheck, BookOpen, CalendarDays, User, Hash, AlertCircle, RefreshCw, QrCode, ArrowLeft, Clock } from "lucide-react";
import { PageTransition } from "@/src/components/PageTransition";

export default function Status() {
  const router = useRouter();
  const [courseId, setCourseId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [resp, setResp] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const onChangeCourse = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.trim();
    setCourseId(v);
    setItem(keys.last_course_id, v);
  }, []);

  const onChangeSession = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.trim();
    setSessionId(v);
    setItem(keys.last_session_id, v);
  }, []);

  const check = useCallback(async () => {
    const u = getItem(keys.user_id);
    if (!u || !courseId || !sessionId) return;
    setLoading(true);
    try {
      const r = await getStatus({ user_id: u, course_id: courseId.trim(), session_id: sessionId.trim() });
      setResp(r);
    } catch (err) {
      console.error("Failed to fetch status:", err);
    } finally {
      setLoading(false);
    }
  }, [courseId, sessionId]);

  useEffect(() => {
    const u = getItem(keys.user_id);
    const c = getItem(keys.last_course_id) ?? "";
    const s = getItem(keys.last_session_id) ?? "";
    
    const frameId = requestAnimationFrame(() => {
      setUserId(u);
      setCourseId(c);
      setSessionId(s);
      setIsLoaded(true);
      if (u && c && s) {
        check();
      }
    });

    if (!u) {
      router.replace("/login");
    }

    return () => cancelAnimationFrame(frameId);
  }, [router, check]);

  if (!isLoaded) return null;

  return (
    <PageTransition>
      <section className="bg-gray-100 dark:bg-neutral-950 min-h-dvh">
        <div className="mx-auto max-w-md flex flex-col min-h-dvh p-6 gap-6">
          {/* Header (Judul di box atas) */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
              Laman Presensi
            </div>
            <div className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 inline-flex items-center gap-2 justify-center">
              <BadgeCheck className="h-6 w-6 text-primary" />
              Status Presensi
            </div>
            <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
              Status & Riwayat Kehadiran
            </div>
          </div>

          {/* Profil Mahasiswa */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
              Profil Mahasiswa
            </div>
            <div className="mt-3 inline-flex items-center justify-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
              <User className="h-4 w-4" />
              NIM: <span className="font-semibold">{getItem(keys.user_id) || "User"}</span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 ml-1 inline-flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Course ID
              </label>
              <Input
                placeholder="cloud-101"
                value={courseId}
                onChange={onChangeCourse}
                className="h-12 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
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
                className="h-12 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
              />
            </div>
          </div>

          <div className="mt-2">
            <Button
              className="h-14 w-full rounded-xl bg-neutral-900 text-white shadow-none hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
              onClick={check}
              disabled={!courseId || !sessionId || loading}
            >
              {loading ? (
                <div className="size-5 animate-spin rounded-full border-2 border-neutral-300 border-t-white dark:border-neutral-700 dark:border-t-black" />
              ) : (
                <>
                  <BadgeCheck className="mr-2 h-5 w-5" />
                  Cek Status Presensi
                </>
              )}
            </Button>
          </div>

          <div className="">
            {!loading && resp && resp.ok && (
              <>
                {resp.data.status === "checked_in" ? (
                  <Card className="border-green-100 bg-green-50/50 dark:border-green-900/30 dark:bg-green-900/10">
                    <div className="space-y-3">
                      <div className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700 dark:bg-green-900 dark:text-green-200">
                        ✓ HADIR
                      </div>
                      <div className="space-y-1">
                        {resp.data.presence_id && (
                          <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                            <Hash className="h-4 w-4" />
                            <span className="font-mono">ID: {resp.data.presence_id}</span>
                          </div>
                        )}
                        {resp.data.last_ts && (
                          <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                            <Clock className="h-4 w-4" />
                            <span>Waktu: {new Date(resp.data.last_ts).toLocaleString("id-ID")}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Presensi Anda telah tercatat di sistem. Terima kasih.
                      </p>
                    </div>
                  </Card>
                ) : (
                  <Card className="border-red-100 bg-red-50/50 dark:border-red-900/30 dark:bg-red-900/10">
                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-2 rounded-lg bg-red-100 px-3 py-1.5 text-sm font-semibold text-red-700 dark:bg-red-900 dark:text-red-200">
                        <AlertCircle className="h-4 w-4" />
                        Belum Hadir
                      </div>
                      <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                        Anda belum tercatat hadir untuk mata kuliah
                        <span className="font-bold"> {courseId}</span> pada
                        <span className="font-bold"> {sessionId}</span>.
                      </p>
                      <div className="flex flex-col gap-3">
                        <Button
                          onClick={() => router.push("/scan")}
                          className="h-12 w-full rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-900"
                        >
                          <QrCode className="mr-2 h-5 w-5" />
                          Scan QR Sekarang
                        </Button>
                        <Button
                          variant="outline"
                          onClick={check}
                          className="h-12 w-full rounded-xl border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
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

          {/* Spacer to push back button to bottom */}
          <div className="flex-1" />

          {/* Back button (Kembali ke Home di bawah sendiri) */}
          <Button
            variant="outline"
            className="h-12 w-full rounded-xl border-neutral-200 text-neutral-700 shadow-none hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900 transition-colors mt-auto"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Home
          </Button>
        </div>
      </section>
    </PageTransition>
  );
}
