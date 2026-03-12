"use client";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

// Fix icon default Leaflet yang sering error di Next.js
const icon = L.icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Komponen untuk update center peta otomatis jika lokasi berubah
function RecenterMap({ coords }: { coords: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(coords);
  }, [coords, map]);
  return null;
}

export default function GpsMap({ latest, history }: { latest: [number, number], history: [number, number][] }) {
  return (
    <MapContainer
      center={latest}
      zoom={16}
      className="h-full w-full z-0"
      zoomControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Polyline positions={history} color="#3b82f6" weight={4} opacity={0.7} dashArray="5, 10" />
      <Marker position={latest} icon={icon} />
      <RecenterMap coords={latest} />
    </MapContainer>
  );
}