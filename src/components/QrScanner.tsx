"use client";
import { Scanner } from "@yudiel/react-qr-scanner";
import toast from "react-hot-toast";

type Props = {
  onToken: (token: string) => void;
  facingMode?: "environment" | "user";
};

export function QrScanner({ onToken, facingMode = "environment" }: Props) {
  return (
    <div
      className="h-full w-full"
      style={{
        /* Force the library's internal video to fill our container */
      }}
    >
      <style>{`
        /* Override @yudiel/react-qr-scanner internal styles */
        [data-qr-scanner] video,
        [data-qr-scanner] > div,
        [data-qr-scanner],
        .qr-scanner-container video,
        .qr-scanner-container div {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          aspect-ratio: unset !important;
          max-width: unset !important;
          max-height: unset !important;
        }
      `}</style>
      <Scanner
        onScan={(codes) => {
          const value = codes?.[0]?.rawValue;
          if (!value) return;
          if (!value.startsWith("TKN-")) {
            toast.error("QR Code tidak valid");
            return;
          }
          onToken(value);
        }}
        onError={() => {
          toast.error("Gagal membaca kamera");
        }}
        components={{
          finder: false, // Menghapus bingkai kotak bawaan library agar tidak double
        }}
        constraints={{ 
          facingMode: facingMode,
          aspectRatio: { ideal: 1 },
        }}
        allowMultiple={false}
        scanDelay={300}
        styles={{
          container: { width: "100%", height: "100%" },
          video: { 
            width: "100%", 
            height: "100%", 
            objectFit: "cover",
            /* Touch actions allowed for native zoom/pinch behaviors */
            touchAction: "manipulation" 
          },
        }}
      />
    </div>
  );
}
