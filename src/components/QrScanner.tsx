"use client";
import { Scanner } from "@yudiel/react-qr-scanner";
import toast from "react-hot-toast";

type Props = {
  onToken: (token: string) => void;
};

export function QrScanner({ onToken }: Props) {
  return (
    <div className="w-full max-w-md">
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
        constraints={{ facingMode: "environment" }}
      />
    </div>
  );
}
