"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { getItem, keys } from "@/src/lib/storage";
import { postAccel, getAccelLatest } from "@/src/lib/api";
import type { AccelSample } from "@/src/types/telemetry";
import { ArrowLeft, Activity, Play, Square, Download, Wifi, WifiOff } from "lucide-react";

/* ─── Constants ─── */
const BATCH_INTERVAL_MS = 3000;
const CHART_MAX_POINTS = 60;

/* ─── Types ─── */
type XYZ = { x: number; y: number; z: number };

export default function AccelerometerPage() {
    const router = useRouter();

    /* auth guard */
    const [userId] = useState<string | null>(() => getItem(keys.user_id));
    useEffect(() => {
        if (!userId) router.replace("/login");
    }, [router, userId]);

    const deviceId = getItem(keys.device_id) ?? "unknown";

    /* sensor state */
    const [running, setRunning] = useState(false);
    const [supported, setSupported] = useState(true);
    const [current, setCurrent] = useState<XYZ>({ x: 0, y: 0, z: 0 });

    /* batch / network state */
    const [totalSent, setTotalSent] = useState(0);
    const [totalAccepted, setTotalAccepted] = useState(0);
    const [sending, setSending] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);

    /* latest from server */
    const [serverLatest, setServerLatest] = useState<XYZ | null>(null);
    const [fetchingLatest, setFetchingLatest] = useState(false);

    /* refs for mutable state in callbacks */
    const bufferRef = useRef<AccelSample[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const simTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const chartDataRef = useRef<Array<XYZ & { t: number }>>([]);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animRef = useRef<number | null>(null);

    /* ─── Flush batch to server ─── */
    const flush = useCallback(async () => {
        const samples = bufferRef.current.splice(0);
        if (samples.length === 0) return;
        setSending(true);
        setLastError(null);
        try {
            const resp = await postAccel({
                device_id: deviceId,
                ts: new Date().toISOString(),
                samples,
            });
            if (resp.ok && resp.data) {
                setTotalAccepted((p) => p + resp.data!.accepted);
            } else {
                setLastError(resp.error ?? "unknown_error");
            }
        } catch (err: unknown) {
            setLastError(err instanceof Error ? err.message : "network_error");
        } finally {
            setSending(false);
        }
    }, [deviceId]);

    /* ─── Push sample into buffer + chart ─── */
    const pushSample = useCallback(
        (x: number, y: number, z: number) => {
            const now = new Date();
            const sample: AccelSample = {
                t: now.toISOString(),
                x: +x.toFixed(4),
                y: +y.toFixed(4),
                z: +z.toFixed(4),
            };
            bufferRef.current.push(sample);
            setTotalSent((p) => p + 1);
            setCurrent({ x: sample.x, y: sample.y, z: sample.z });

            /* chart history */
            chartDataRef.current.push({ x: sample.x, y: sample.y, z: sample.z, t: Date.now() });
            if (chartDataRef.current.length > CHART_MAX_POINTS) {
                chartDataRef.current = chartDataRef.current.slice(-CHART_MAX_POINTS);
            }
        },
        [],
    );

    /* ─── Start / Stop ─── */
    const start = useCallback(() => {
        /* try real sensor first */
        if (typeof DeviceMotionEvent !== "undefined") {
            /* iOS 13+ needs permission */
            const dme = DeviceMotionEvent as unknown as {
                requestPermission?: () => Promise<string>;
            };
            if (typeof dme.requestPermission === "function") {
                dme
                    .requestPermission()
                    .then((perm) => {
                        if (perm === "granted") {
                            window.addEventListener("devicemotion", handleMotion);
                            setSupported(true);
                        } else {
                            startSimulation();
                        }
                    })
                    .catch(() => startSimulation());
            } else {
                /* check if the event actually fires */
                let fired = false;
                const probe = () => {
                    fired = true;
                };
                window.addEventListener("devicemotion", probe);
                setTimeout(() => {
                    window.removeEventListener("devicemotion", probe);
                    if (fired) {
                        window.addEventListener("devicemotion", handleMotion);
                        setSupported(true);
                    } else {
                        startSimulation();
                    }
                }, 500);
            }
        } else {
            startSimulation();
        }

        /* start batch flush timer */
        timerRef.current = setInterval(() => {
            flush();
        }, BATCH_INTERVAL_MS);

        setRunning(true);
        startChart();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flush, pushSample]);

    const stop = useCallback(() => {
        window.removeEventListener("devicemotion", handleMotion);
        if (timerRef.current) clearInterval(timerRef.current);
        if (simTimerRef.current) clearInterval(simTimerRef.current);
        timerRef.current = null;
        simTimerRef.current = null;

        /* flush remaining */
        flush();
        setRunning(false);
        stopChart();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flush]);

    /* cleanup on unmount */
    useEffect(() => {
        return () => {
            window.removeEventListener("devicemotion", handleMotion);
            if (timerRef.current) clearInterval(timerRef.current);
            if (simTimerRef.current) clearInterval(simTimerRef.current);
            stopChart();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ─── Real sensor handler ─── */
    function handleMotion(e: DeviceMotionEvent) {
        const a = e.accelerationIncludingGravity;
        if (!a) return;
        pushSample(a.x ?? 0, a.y ?? 0, a.z ?? 0);
    }

    /* ─── Simulation fallback ─── */
    function startSimulation() {
        setSupported(false);
        let phase = 0;
        simTimerRef.current = setInterval(() => {
            phase += 0.15;
            pushSample(
                Math.sin(phase) * 3 + (Math.random() - 0.5),
                Math.cos(phase * 0.7) * 5 + (Math.random() - 0.5),
                9.8 + Math.sin(phase * 0.3) * 0.5 + (Math.random() - 0.5) * 0.2,
            );
        }, 100);
    }

    /* ─── Chart (canvas) ─── */
    function startChart() {
        const draw = () => {
            const canvas = canvasRef.current;
            if (!canvas) {
                animRef.current = requestAnimationFrame(draw);
                return;
            }
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);

            const W = rect.width;
            const H = rect.height;

            ctx.clearRect(0, 0, W, H);

            /* background grid */
            ctx.strokeStyle = "#e5e7eb";
            ctx.lineWidth = 0.5;
            const gridY = H / 2;
            ctx.beginPath();
            ctx.moveTo(0, gridY);
            ctx.lineTo(W, gridY);
            ctx.stroke();

            const data = chartDataRef.current;
            if (data.length < 2) {
                animRef.current = requestAnimationFrame(draw);
                return;
            }

            /* auto-scale Y */
            let minV = Infinity,
                maxV = -Infinity;
            for (const d of data) {
                for (const v of [d.x, d.y, d.z]) {
                    if (v < minV) minV = v;
                    if (v > maxV) maxV = v;
                }
            }
            const pad = Math.max(1, (maxV - minV) * 0.15);
            minV -= pad;
            maxV += pad;
            const rangeV = maxV - minV || 1;

            const colors = { x: "#ef4444", y: "#22c55e", z: "#3b82f6" };
            const keys: Array<"x" | "y" | "z"> = ["x", "y", "z"];

            for (const k of keys) {
                ctx.strokeStyle = colors[k];
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let i = 0; i < data.length; i++) {
                    const px = (i / (CHART_MAX_POINTS - 1)) * W;
                    const py = H - ((data[i][k] - minV) / rangeV) * H;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.stroke();
            }

            /* Y axis labels */
            ctx.fillStyle = "#9ca3af";
            ctx.font = "10px system-ui, sans-serif";
            ctx.textAlign = "left";
            ctx.fillText(maxV.toFixed(1), 4, 12);
            ctx.fillText(minV.toFixed(1), 4, H - 4);

            /* legend */
            const legends = [
                { label: "X", color: colors.x },
                { label: "Y", color: colors.y },
                { label: "Z", color: colors.z },
            ];
            let lx = W - 80;
            for (const l of legends) {
                ctx.fillStyle = l.color;
                ctx.fillRect(lx, 6, 10, 10);
                ctx.fillStyle = "#6b7280";
                ctx.fillText(l.label, lx + 13, 15);
                lx += 26;
            }

            animRef.current = requestAnimationFrame(draw);
        };
        animRef.current = requestAnimationFrame(draw);
    }

    function stopChart() {
        if (animRef.current) cancelAnimationFrame(animRef.current);
        animRef.current = null;
    }

    /* ─── Fetch latest from server ─── */
    async function fetchLatest() {
        setFetchingLatest(true);
        try {
            const r = await getAccelLatest(deviceId);
            if (r.ok && r.data) {
                setServerLatest({ x: r.data.x, y: r.data.y, z: r.data.z });
            }
        } catch {
            /* ignore */
        } finally {
            setFetchingLatest(false);
        }
    }

    /* ─── Render ─── */
    return (
        <section className="bg-gray-100 dark:bg-neutral-950 min-h-dvh">
            <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 p-6">
                {/* Header */}
                <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                        Modul 2
                    </div>
                    <div className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 inline-flex items-center gap-2 justify-center">
                        <Activity className="h-6 w-6" />
                        Accelerometer
                    </div>
                    <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                        Device: <span className="font-mono font-semibold">{deviceId}</span>
                    </div>
                </div>

                {/* Sensor support notice */}
                {running && !supported && (
                    <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
                        ⚠ Accelerometer tidak tersedia — menggunakan data simulasi.
                    </div>
                )}

                {/* Realtime values */}
                <div className="grid grid-cols-3 gap-3">
                    {(["x", "y", "z"] as const).map((axis) => (
                        <Card key={axis}>
                            <div className="text-center">
                                <div
                                    className={`text-xs font-bold uppercase tracking-widest ${axis === "x"
                                            ? "text-red-500"
                                            : axis === "y"
                                                ? "text-green-500"
                                                : "text-blue-500"
                                        }`}
                                >
                                    {axis.toUpperCase()}
                                </div>
                                <div className="mt-1 text-2xl font-bold tabular-nums text-neutral-900 dark:text-neutral-50">
                                    {current[axis].toFixed(2)}
                                </div>
                                <div className="text-[10px] text-neutral-400">m/s²</div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Chart */}
                <Card>
                    <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
                        Grafik Realtime
                    </div>
                    <canvas
                        ref={canvasRef}
                        className="w-full rounded-lg bg-neutral-50 dark:bg-neutral-800"
                        style={{ height: 160 }}
                    />
                </Card>

                {/* Status panel */}
                <Card>
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                            {sending ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-600 dark:border-t-white" />
                            ) : lastError ? (
                                <WifiOff className="h-4 w-4 text-red-500" />
                            ) : (
                                <Wifi className="h-4 w-4 text-green-500" />
                            )}
                            <span>
                                Buffered: <strong>{totalSent}</strong> · Accepted: <strong>{totalAccepted}</strong>
                            </span>
                        </div>
                        <span className="text-xs text-neutral-400">
                            batch / {BATCH_INTERVAL_MS / 1000}s
                        </span>
                    </div>
                    {lastError && (
                        <div className="mt-2 text-xs text-red-500">Error: {lastError}</div>
                    )}
                </Card>

                {/* Controls */}
                <div className="flex flex-col gap-3">
                    {!running ? (
                        <Button
                            className="h-14 w-full rounded-xl bg-neutral-900 text-white shadow-none hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
                            onClick={start}
                        >
                            <Play className="mr-2 h-5 w-5" />
                            Mulai Rekam
                        </Button>
                    ) : (
                        <Button
                            className="h-14 w-full rounded-xl bg-red-600 text-white shadow-none hover:bg-red-700 transition-colors"
                            onClick={stop}
                        >
                            <Square className="mr-2 h-5 w-5" />
                            Stop
                        </Button>
                    )}

                    <Button
                        variant="outline"
                        className="h-12 w-full rounded-xl border-neutral-200 text-neutral-700 shadow-none hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900 transition-colors"
                        onClick={fetchLatest}
                        disabled={fetchingLatest}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        {fetchingLatest ? "Mengambil…" : "Ambil Data Terbaru dari Server"}
                    </Button>
                </div>

                {/* Server latest */}
                {serverLatest && (
                    <Card>
                        <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
                            Data Terbaru di Server
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-center">
                            {(["x", "y", "z"] as const).map((axis) => (
                                <div key={axis}>
                                    <div
                                        className={`text-xs font-bold ${axis === "x"
                                                ? "text-red-500"
                                                : axis === "y"
                                                    ? "text-green-500"
                                                    : "text-blue-500"
                                            }`}
                                    >
                                        {axis.toUpperCase()}
                                    </div>
                                    <div className="text-lg font-bold tabular-nums text-neutral-900 dark:text-neutral-50">
                                        {serverLatest[axis].toFixed(4)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Back button */}
                <Button
                    variant="outline"
                    className="h-12 w-full rounded-xl border-neutral-200 text-neutral-700 shadow-none hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900 transition-colors"
                    onClick={() => router.push("/")}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali ke Home
                </Button>
            </div>
        </section>
    );
}
