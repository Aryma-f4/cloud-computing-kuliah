"use client";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix icon default leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl      : "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl    : "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Props {
  latest : [number, number];
  history: [number, number][];
}

export default function GpsMap({ latest, history }: Props) {
  return (
    <MapContainer
      center={latest}
      zoom={16}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      {/* Polyline jejak perjalanan */}
      {history.length > 1 && (
        <Polyline positions={history} color="#3b82f6" weight={3} opacity={0.7} />
      )}
      {/* Marker posisi terbaru */}
      <Marker position={latest}>
        <Popup>Posisi Terbaru</Popup>
      </Marker>
    </MapContainer>
  );
}