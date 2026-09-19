import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import { LayerGroup, LayersControl, MapContainer, Marker, Polygon, ScaleControl, TileLayer, Tooltip, useMap } from "react-leaflet";
import { LAND_USE_COLOR, VERIFY_COLOR, pretty } from "../lib/format";
import type { Feature } from "../lib/types";

export type ColorBy = "land_use" | "verification";

const toLatLngs = (f: Feature) => f.geometry.coordinates[0].map(([lng, lat]) => [lat, lng] as [number, number]);

function FitBounds({ features, fitKey }: { features: Feature[]; fitKey: string }) {
  const map = useMap();
  useEffect(() => {
    if (!features.length) return;
    const b = L.latLngBounds(features.flatMap(toLatLngs));
    map.fitBounds(b, { padding: [40, 40], maxZoom: 17 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey]);
  return null;
}

function FlyToSelected({ feature }: { feature?: Feature }) {
  const map = useMap();
  useEffect(() => {
    if (feature) map.flyToBounds(L.latLngBounds(toLatLngs(feature)), { padding: [80, 80], maxZoom: 18, duration: 0.8 });
  }, [feature, map]);
  return null;
}

export default function ParcelMap({ features, selectedId, onSelect, colorBy = "land_use", fitKey = "init", height = "100%", showLegend = true }: {
  features: Feature[]; selectedId?: string | null; onSelect?: (id: string) => void; colorBy?: ColorBy; fitKey?: string; height?: string; showLegend?: boolean;
}) {
  const selected = useMemo(() => features.find((f) => f.id === selectedId), [features, selectedId]);
  const color = (f: Feature) => (colorBy === "land_use" ? LAND_USE_COLOR[f.properties.land_use] : VERIFY_COLOR[f.properties.verification_status]) || "#64748b";
  const legend = colorBy === "land_use"
    ? Object.entries(LAND_USE_COLOR).filter(([k]) => features.some((f) => f.properties.land_use === k))
    : Object.entries(VERIFY_COLOR);
  const center: [number, number] = features[0] ? [features[0].properties.centroid[0], features[0].properties.centroid[1]] : [17.24, 78.43];

  return (
    <div className="relative h-full w-full" style={{ height }}>
      <MapContainer center={center} zoom={16} className="h-full w-full" scrollWheelZoom zoomControl>
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Street map">
            <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Light basemap">
            <TileLayer attribution='&copy; OpenStreetMap &copy; CARTO' url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" maxZoom={20} />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Cadastral only (no basemap)">
            <LayerGroup />
          </LayersControl.BaseLayer>
          <LayersControl.Overlay checked name="Parcel boundaries">
            <LayerGroup>
              {features.map((f) => (
                <Polygon key={`${f.id}-${colorBy}-${f.id === selectedId}`} positions={toLatLngs(f)}
                  pathOptions={{ color: f.id === selectedId ? "#0f1f40" : color(f), weight: f.id === selectedId ? 3.5 : 1.8,
                    fillColor: color(f), fillOpacity: f.id === selectedId ? 0.55 : 0.28, dashArray: f.properties.verification_status === "flagged" ? "6 4" : undefined }}
                  eventHandlers={{
                    click: () => onSelect?.(f.id),
                    mouseover: (e) => e.target.setStyle({ fillOpacity: 0.5 }),
                    mouseout: (e) => e.target.setStyle({ fillOpacity: f.id === selectedId ? 0.55 : 0.28 }),
                  }}>
                  <Tooltip sticky>
                    <div className="text-xs"><b>{f.id}</b> · {f.properties.land_use}<br />{f.properties.area_sqm.toLocaleString("en-IN")} m² · {pretty(f.properties.verification_status)}</div>
                  </Tooltip>
                </Polygon>
              ))}
            </LayerGroup>
          </LayersControl.Overlay>
          <LayersControl.Overlay checked name="Parcel ID labels">
            <LayerGroup>
              {features.map((f) => (
                <Marker key={`lbl-${f.id}`} position={f.properties.centroid} interactive={false}
                  icon={L.divIcon({ className: "parcel-label", html: f.id, iconSize: [50, 14], iconAnchor: [25, 7] })} />
              ))}
            </LayerGroup>
          </LayersControl.Overlay>
        </LayersControl>
        <ScaleControl position="bottomright" />
        <FitBounds features={features} fitKey={fitKey} />
        <FlyToSelected feature={selected} />
      </MapContainer>
      {showLegend && legend.length > 0 && (
        <div className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-lg border border-slate-200 bg-white/95 p-2.5 text-xs shadow-card dark:border-navy-700 dark:bg-navy-900/95">
          <p className="mb-1.5 font-semibold text-navy-900 dark:text-white">{colorBy === "land_use" ? "Land use" : "Verification"}</p>
          {legend.map(([k, c]) => (
            <div key={k} className="flex items-center gap-2 py-0.5"><span className="h-3 w-3 rounded-sm border" style={{ background: c + "66", borderColor: c }} />{pretty(k)}</div>
          ))}
        </div>
      )}
    </div>
  );
}
