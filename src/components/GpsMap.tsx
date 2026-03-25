"use client";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

/**
 * Perbaikan ikon default Leaflet.
 * Leaflet secara default mencoba memuat ikon dari jalur relatif yang seringkali pecah di Next.js.
 */
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

/**
 * Komponen pembantu untuk mengatur fokus kamera peta.
 * MapContainer di react-leaflet bersifat statis setelah render pertama,
 * jadi kita butuh hook useMap untuk menggerakkan kamera secara dinamis.
 */
function RecenterMap({ coords }: { coords: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords[0] !== 0 && coords[1] !== 0) {
      // Menggerakkan kamera ke koordinat terbaru dengan animasi
      map.setView(coords, map.getZoom(), { animate: true });
    }
  }, [coords, map]);
  return null;
}

interface GpsMapProps {
  latest: [number, number];
  history: [number, number][];
}

/**
 * Komponen GpsMap Utama.
 * Menampilkan peta interaktif dengan jejak perjalanan (Polyline) dan penanda posisi (Marker).
 */
export default function GpsMap({ latest, history }: GpsMapProps) {
  // Koordinat default (Surabaya) jika data belum tersedia
  const defaultPos: [number, number] = [-7.2504, 112.7688];
  const isValidLatest = latest && !isNaN(latest[0]) && !isNaN(latest[1]);
  const centerPos = isValidLatest ? latest : defaultPos;

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={centerPos}
        zoom={16}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Komponen untuk sinkronisasi posisi kamera */}
        {isValidLatest && <RecenterMap coords={latest} />}

        {/* Menggambar garis riwayat perjalanan jika ada lebih dari satu titik */}
        {history && history.length > 1 && (
          <Polyline
            positions={history}
            pathOptions={{
              color: "#3b82f6", // Warna biru
              weight: 5,
              opacity: 0.7,
              lineJoin: "round",
            }}
          />
        )}

        {/* Menampilkan marker pada posisi terbaru */}
        {isValidLatest && (
          <Marker position={latest}>
            <Popup>
              <div className="text-xs font-sans p-1">
                <p className="font-bold border-b border-neutral-200 mb-1">Posisi Terbaru</p>
                <p className="text-neutral-600 font-mono">
                  {latest[0].toFixed(6)}, {latest[1].toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}