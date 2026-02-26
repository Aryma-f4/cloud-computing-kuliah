function getWebGLInfo() {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      (canvas.getContext("webgl") as WebGLRenderingContext | null) ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) return "";
    const ext = gl.getExtension("WEBGL_debug_renderer_info") as unknown as {
      UNMASKED_VENDOR_WEBGL: number;
      UNMASKED_RENDERER_WEBGL: number;
    } | null;
    if (!ext) return "";
    const vendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) as string;
    const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) as string;
    return `${vendor}|${renderer}`;
  } catch {
    return "";
  }
}

function simpleHash(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return ("00000000" + (h >>> 0).toString(16)).slice(-8);
}

export function generateDeviceIdSync() {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const platform = typeof navigator !== "undefined" ? navigator.platform : "";
  const vendor = typeof navigator !== "undefined" ? navigator.vendor : "";
  const lang =
    typeof navigator !== "undefined"
      ? (navigator.languages && navigator.languages.join(",")) || navigator.language
      : "";
  const navObj = typeof navigator !== "undefined" ? (navigator as Navigator & {
    deviceMemory?: number;
    hardwareConcurrency?: number;
    maxTouchPoints?: number;
  }) : undefined;
  const cores = navObj?.hardwareConcurrency ? String(navObj.hardwareConcurrency) : "";
  const mem = navObj?.deviceMemory ? String(navObj.deviceMemory) : "";
  const touch = navObj?.maxTouchPoints ? String(navObj.maxTouchPoints) : "";
  const tz =
    typeof Intl !== "undefined" && Intl.DateTimeFormat
      ? (Intl.DateTimeFormat().resolvedOptions().timeZone as string)
      : "";
  const screenInfo =
    typeof screen !== "undefined"
      ? `${screen.width}x${screen.height}@${screen.colorDepth}`
      : "";
  const webgl = typeof document !== "undefined" ? getWebGLInfo() : "";
  const raw = [ua, platform, vendor, lang, cores, mem, touch, tz, screenInfo, webgl].join("|");
  return `dev-${simpleHash(raw)}`;
}
