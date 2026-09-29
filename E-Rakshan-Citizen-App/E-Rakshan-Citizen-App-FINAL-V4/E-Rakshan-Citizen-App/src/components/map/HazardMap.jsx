import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, CircleMarker, Tooltip, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { LocateFixed, Navigation2 } from "lucide-react";

const icon = (emoji, cls) => L.divIcon({ className: "custom-marker", html: `<span class="${cls}">${emoji}</span>`, iconSize: [34,34], iconAnchor: [17,17] });
const icons = {
  shelter: icon("⌂", "marker-green"),
  hazard: icon("!", "marker-red"),
  road: icon("!", "marker-orange"),
  incident: icon("i", "marker-blue"),
  selected: icon("●", "marker-blue"),
  destination: icon("◆", "marker-destination"),
  start: icon("●", "marker-start"),
};

function ClickCapture({ onSelect }) {
  useMapEvents({ click(e) { onSelect?.({ lat: e.latlng.lat, lng: e.latlng.lng, name: "Selected location" }); } });
  return null;
}

function FlyTo({ position }) {
  const map = useMap();
  useEffect(() => {
    if (!position) return;
    if (position.bbox && position.bbox.length === 4) {
      const [south, north, west, east] = [
        Number(position.bbox[0]), Number(position.bbox[1]),
        Number(position.bbox[2]), Number(position.bbox[3])
      ];
      if ([south,north,west,east].every(Number.isFinite)) {
        map.fitBounds([[south,west],[north,east]], { padding: [24,24], maxZoom: position.zoom || 12, animate: true, duration: 0.9 });
        return;
      }
    }
    const zoom = position.zoom || 13;
    map.flyTo([position.lat, position.lng], zoom, { duration: 0.9, easeLinearity: 0.2 });
  }, [position?.lat, position?.lng, position?.zoom, JSON.stringify(position?.bbox), map]);
  return null;
}

function RecenterListener({ position }) {
  const map = useMap();
  useEffect(() => {
    const handler = () => {
      if (position) map.flyTo([position.lat, position.lng], Math.max(map.getZoom(), 14), { duration: 0.8 });
    };
    window.addEventListener("recenter-map", handler);
    return () => window.removeEventListener("recenter-map", handler);
  }, [map, position?.lat, position?.lng]);
  return null;
}

function FitRoute({ route, enabled }) {
  const map = useMap();
  useEffect(() => {
    if (!enabled || !route || route.length < 2) return;
    const bounds = L.latLngBounds(route.map(([lat, lng]) => [lat, lng]));
    map.fitBounds(bounds, { padding: [35, 35], animate: true, duration: 0.8, maxZoom: 16 });
  }, [map, enabled, JSON.stringify(route)]);
  return null;
}

export default function HazardMap({
  center = [19.005, 73.125], mapData, shelters = [], route = [], onSelect,
  userLocation, selectedLocation, focusPosition, showRedZones = true,
  routeStepPoints = [], routeStart = null, routeDestination = null,
  fitRoute = false, className=""
}) {
  return (
    <div className={`map-wrap ${className}`}>
      <MapContainer center={center} zoom={13} scrollWheelZoom className="leaflet-map">
        <TileLayer url={import.meta.env.VITE_TILE_URL || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"} attribution={import.meta.env.VITE_TILE_ATTRIBUTION || '&copy; OpenStreetMap contributors'} />
        <ClickCapture onSelect={onSelect}/>
        <FlyTo position={focusPosition}/>
        <RecenterListener position={userLocation}/>
        <FitRoute route={route} enabled={fitRoute}/>

        {showRedZones && mapData?.redZones?.map(z => <Circle key={z.id} center={[z.lat,z.lng]} radius={z.radius} pathOptions={{ color:"#e22", fillColor:"#e22", fillOpacity:.22 }}><Popup><b>{z.name}</b><br/>Avoid this area.</Popup></Circle>)}
        {mapData?.hazards?.map(p => <Marker key={p.id} position={[p.lat,p.lng]} icon={icons.hazard}><Popup><b>{p.name}</b><br/>Government-sourced hazard layer (demo data).</Popup></Marker>)}
        {mapData?.roads?.map(p => <Marker key={p.id} position={[p.lat,p.lng]} icon={icons.road}><Popup><b>{p.name}</b><br/>Status: {p.status}</Popup></Marker>)}
        {mapData?.incidents?.map(p => <Marker key={p.id} position={[p.lat,p.lng]} icon={icons.incident}><Popup><b>{p.name}</b></Popup></Marker>)}
        {shelters.map(s => <Marker key={s.id} position={[s.lat,s.lng]} icon={icons.shelter}><Popup><b>{s.name}</b><br/>{s.distance ?? "—"} km · {s.status}</Popup></Marker>)}

        {userLocation && <Marker position={[userLocation.lat,userLocation.lng]} icon={L.divIcon({className:"user-marker", html:"<span></span>", iconSize:[22,22], iconAnchor:[11,11]})}><Popup>You are here</Popup></Marker>}
        {selectedLocation && <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={icons.selected}><Popup><b>{selectedLocation.name || "Selected location"}</b><br/>{Number(selectedLocation.lat).toFixed(5)}, {Number(selectedLocation.lng).toFixed(5)}</Popup></Marker>}

        {route.length > 1 && <Polyline positions={route} pathOptions={{ color:"#168ce5", weight:7, opacity:.92 }} />}
        {routeStart && <Marker position={[routeStart.lat, routeStart.lng]} icon={icons.start}><Tooltip permanent direction="top" offset={[0,-12]} className="route-tooltip">START</Tooltip></Marker>}
        {routeDestination && <Marker position={[routeDestination.lat, routeDestination.lng]} icon={icons.destination}><Tooltip permanent direction="top" offset={[0,-12]} className="route-tooltip">DESTINATION</Tooltip></Marker>}
        {routeStepPoints.slice(0, 80).map((p, i) => <CircleMarker key={p.id || i} center={[p.lat,p.lng]} radius={5} pathOptions={{ color:"#fff", weight:2, fillColor:"#0b73c8", fillOpacity:.95 }}>
          <Popup><Navigation2 size={13}/> <b>Turn {i + 1}</b><br/>{p.instruction}<br/><small>{p.road}</small></Popup>
        </CircleMarker>)}
      </MapContainer>
      {userLocation && <button className="map-recenter" onClick={() => window.dispatchEvent(new CustomEvent("recenter-map"))} aria-label="Recenter map"><LocateFixed size={18}/></button>}
    </div>
  );
}
