"use client";
import React, { useEffect, useState, useCallback, ChangeEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Card } from "@/src/components/ui/Card";
import { getItem, setItem, keys } from "@/src/lib/storage";
import { getStatus, getPresenceHistory } from "@/src/lib/api";
import type { StatusResponse, PresenceHistoryResponse } from "@/src/types/presence";
import { BadgeCheck, BookOpen, AlertCircle, RefreshCw, QrCode, ArrowLeft, ExternalLink, History, TrendingUp, CheckCircle2 } from "lucide-react";
import { PageTransition } from "@/src/components/PageTransition";

function StatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [courseId, setCourseId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [resp, setResp] = useState<StatusResponse | null>(null);
  const [history, setHistory] = useState<PresenceHistoryResponse | null>(null);
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

  const check = useCallback(async (params?: { u?: string; c?: string; s?: string }) => {
    const u = (params?.u || userId || getItem(keys.user_id) || "").toLowerCase().trim();
    const c = (params?.c || courseId || "").toLowerCase().trim();
    const s = (params?.s || sessionId || "").toLowerCase().trim();

    if (!u || !c || !s) return;

    // Cek apakah pakai GAS eksternal
    const swapMode = getItem(keys.swap_mode);
    const extUrl   = swapMode === "external" ? (getItem(keys.swap_gas_url)?.trim() || null) : null;
    
    setLoading(true);
    try {
      const [r, h] = await Promise.all([
        getStatus({ user_id: u, course_id: c, session_id: s }, extUrl),
        getPresenceHistory({ user_id: u, course_id: c, limit: 5 }, extUrl)
      ]);
      setResp(r);
      setHistory(h);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, [courseId, sessionId, userId]);

  useEffect(() => {
    // 1. Ambil data dari URL (sebagai referensi langsung)
    const urlUser = searchParams.get("user_id");
    const urlCourse = searchParams.get("course_id");
    const urlSession = searchParams.get("session_id");

    // 2. Ambil data dari Storage (fallback)
    const u = urlUser || getItem(keys.user_id);
    const c = (urlCourse || getItem(keys.last_course_id)) ?? "";
    const s = (urlSession || getItem(keys.last_session_id)) ?? "";
    
    const frameId = requestAnimationFrame(() => {
      setUserId(u);
      setCourseId(c);
      setSessionId(s);
      setIsLoaded(true);

      // Jika data lengkap, jalankan pengecekan otomatis
      if (u && c && s) {
        check({ u, c, s });
      }
    });

    if (!u && !urlUser) {
      router.replace("/login");
    }

    return () => cancelAnimationFrame(frameId);
  }, [router, check, searchParams]);

  if (!isLoaded) return null;

  const currentUserId = userId || getItem(keys.user_id) || "User";

  return (
    <PageTransition>
      <section className="bg-[#F8F9FA] dark:bg-neutral-950 min-h-dvh">
        <div className="mx-auto max-w-md flex flex-col min-h-dvh p-5 gap-5">
          
          {/* 1. HEADER & PROFILE */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-white shadow-lg shadow-primary/20">
                {currentUserId[0].toUpperCase()}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Selamat Datang</p>
                <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-50">{currentUserId}</h2>
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
              onClick={() => check()}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 text-neutral-600 dark:text-neutral-400 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {/* 2. COURSE SELECTOR (Compact) */}
          <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4">
              <BookOpen className="h-3 w-3" />
              Konfigurasi Kelas
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-neutral-400 ml-1">COURSE ID</label>
                <Input
                  placeholder="cloud-101"
                  value={courseId}
                  onChange={onChangeCourse}
                  className="h-10 bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-xs font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-neutral-400 ml-1">SESSION ID</label>
                <Input
                  placeholder="sesi-01"
                  value={sessionId}
                  onChange={onChangeSession}
                  className="h-10 bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-xs font-mono"
                />
              </div>
            </div>
            <Button
              className="mt-4 h-11 w-full rounded-2xl bg-neutral-900 text-xs font-bold text-white dark:bg-neutral-50 dark:text-neutral-900"
              onClick={() => check()}
              disabled={!courseId || !sessionId || loading}
            >
              {loading ? "Menghubungkan..." : "Cek Status & Statistik"}
            </Button>
          </div>

          {/* 3. DASHBOARD STATS */}
          {resp?.ok && resp.data.stats && (
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">
                  <TrendingUp className="h-3 w-3 text-blue-500" />
                  Kehadiran
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-black text-neutral-900 dark:text-neutral-50">{resp.data.stats.percentage}</span>
                  <span className="text-xs font-bold text-neutral-400 pb-1">%</span>
                </div>
                <div className="mt-3 h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-1000"
                    style={{ width: `${resp.data.stats.percentage}%` }}
                  />
                </div>
              </div>
              <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  Total Sesi
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-black text-neutral-900 dark:text-neutral-50">{resp.data.stats.total_presence}</span>
                  <span className="text-xs font-bold text-neutral-400 pb-1">/ {resp.data.stats.max_sessions}</span>
                </div>
                <p className="mt-2 text-[9px] font-medium text-neutral-400 uppercase tracking-tighter">Sesi Tercatat</p>
              </div>
            </div>
          )}

          {/* 4. CURRENT STATUS CARD */}
          {!loading && resp && (
            <div className="space-y-4">
              {resp.ok ? (
                <>
                  {resp.data.status === "checked_in" ? (
                    <div className="rounded-3xl bg-emerald-500 p-6 text-white shadow-lg shadow-emerald-500/20">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                            <BadgeCheck className="h-3 w-3" />
                            Status: Hadir
                          </div>
                          <h3 className="mt-3 text-xl font-bold tracking-tight">Presensi Berhasil</h3>
                          <p className="mt-1 text-xs text-white/80 leading-relaxed">
                            Data Anda untuk sesi <span className="font-bold underline">{sessionId}</span> telah tersinkronisasi.
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white/20 p-3">
                          <CheckCircle2 className="h-6 w-6" />
                        </div>
                      </div>
                      <div className="mt-5 flex items-center gap-4 border-t border-white/20 pt-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-white/60">ID Presensi</span>
                          <span className="text-xs font-mono font-bold">{resp.data.presence_id}</span>
                        </div>
                        <div className="h-8 w-px bg-white/20" />
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-white/60">Waktu</span>
                          <span className="text-xs font-bold">{resp.data.last_ts ? new Date(resp.data.last_ts).toLocaleTimeString("id-ID") : "-"}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-3xl bg-white border border-neutral-200 p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-red-100 dark:bg-red-900/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                            <AlertCircle className="h-3 w-3" />
                            Belum Hadir
                          </div>
                          <h3 className="mt-3 text-lg font-bold text-neutral-900 dark:text-neutral-50">Belum Ada Presensi</h3>
                          <p className="mt-1 text-xs text-neutral-500 leading-relaxed">
                            Silakan lakukan scan QR untuk mencatat kehadiran di kelas ini.
                          </p>
                        </div>
                        <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-950 p-3">
                          <QrCode className="h-6 w-6 text-neutral-400" />
                        </div>
                      </div>
                      <Button
                        onClick={() => router.push("/scan")}
                        className="mt-6 h-12 w-full rounded-2xl bg-primary text-white shadow-lg shadow-primary/20"
                      >
                        <QrCode className="mr-2 h-4 w-4" />
                        Scan Sekarang
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-5 dark:border-yellow-900/30 dark:bg-yellow-900/10">
                  <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-bold">Gagal Memuat Status</span>
                  </div>
                  <p className="mt-1 text-xs text-yellow-700/80 dark:text-yellow-400/80">
                    {resp.error || "Pastikan koneksi internet stabil."}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 5. HISTORY LIST */}
          {history?.ok && history.data.records.length > 0 && (
            <div className="mt-2 space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-400">
                  <History className="h-3 w-3" />
                  Riwayat Terbaru
                </div>
                <span className="text-[10px] font-bold text-primary uppercase">Lihat Semua</span>
              </div>
              <div className="space-y-3">
                {history.data.records.map((rec) => (
                  <div key={rec.presence_id} className="flex items-center justify-between rounded-2xl bg-white border border-neutral-100 p-4 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                        <BadgeCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-neutral-900 dark:text-neutral-50">{rec.session_id}</p>
                        <p className="text-[10px] text-neutral-400">{new Date(rec.ts).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} • {new Date(rec.ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-mono text-neutral-300">#{rec.presence_id}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. DEBUG & FOOTER */}
          <div className="mt-4 px-2">
            <details className="group">
              <summary className="text-[10px] text-neutral-400 cursor-pointer hover:text-neutral-600 dark:hover:text-neutral-300 list-none flex items-center gap-1">
                <div className="size-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                Debug Info & API Link
              </summary>
              <div className="mt-2 p-4 rounded-3xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[9px] font-mono text-neutral-500 break-all overflow-hidden">
                <p className="mb-2 text-neutral-400 font-bold uppercase tracking-tighter">Reference URL:</p>
                <code className="text-primary dark:text-primary/80 block bg-white dark:bg-black/20 p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 mb-3">
                  ?path=presence/status&user_id={currentUserId}&course_id={courseId || "..."}&session_id={sessionId || "..."}
                </code>
                <a 
                  href={`/status?user_id=${currentUserId}&course_id=${courseId}&session_id=${sessionId}`}
                  className="inline-flex items-center gap-1.5 text-primary hover:underline font-bold"
                >
                  <ExternalLink className="size-3" /> Buka Link Referensi Langsung
                </a>
              </div>
            </details>
          </div>

          <div className="flex-1 min-h-10" />

          <Button
            variant="outline"
            className="h-12 w-full rounded-2xl border-neutral-200 text-neutral-600 shadow-none hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-900 transition-all mb-4"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Beranda
          </Button>
        </div>
      </section>
    </PageTransition>
  );
}

export default function Status() {
  return (
    <Suspense fallback={
      <div className="flex min-h-dvh items-center justify-center bg-gray-100 dark:bg-neutral-950">
        <div className="size-8 animate-spin rounded-full border-4 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-neutral-50" />
      </div>
    }>
      <StatusContent />
    </Suspense>
  );
}
