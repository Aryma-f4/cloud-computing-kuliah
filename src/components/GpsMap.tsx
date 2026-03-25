"use client";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix icon default leaflet untuk Next.js
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

// Komponen internal untuk menggerakkan kamera peta secara otomatis
function RecenterMap({ coords }: { coords: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords[0] !== 0 && coords[1] !== 0) {
      map.setView(coords, map.getZoom(), { animate: true });
    }
  }, [coords, map]);
  return null;
}

interface Props {
  latest : [number, number];
  history: [number, number][];
}

export default function GpsMap({ latest, history }: Props) {
  const defaultPos: [number, number] = [-7.2504, 112.7688]; // Surabaya
  const centerPos = (latest && latest[0] !== 0) ? latest : defaultPos;

  return (
    <div className="h-full w-full">
      <MapContainer
        center={centerPos}
        zoom={16}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        
        {/* Fitur Auto-Follow kamera peta */}
        <RecenterMap coords={latest} />

        {/* Menggambar garis riwayat perjalanan */}
        {history && history.length > 1 && (
          <Polyline positions={history} color="#3b82f6" weight={4} opacity={0.6} />
        )}
        
        {/* Marker lokasi terkini */}
        {latest && latest[0] !== 0 && (
          <Marker position={latest}>
            <Popup>Lokasi Kamu</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}