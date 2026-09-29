import { geocodePlace } from "../weather/weatherService";
import { loadStore, saveStore } from "../storage/localStore";

const normalize = (value = "") => value.trim().toLowerCase().replace(/\s+/g, " ");

function normalizeResult(point) {
  return {
    lat: Number(point.lat),
    lng: Number(point.lng),
    name: point.name || "Selected location",
    admin: point.admin || "",
    country: point.country || "",
    area: point.area || [point.admin, point.country].filter(Boolean).join(", "),
    bbox: point.bbox,
    zoom: point.zoom,
    id: point.id || `${point.lat},${point.lng}`
  };
}

function localMatches(query) {
  const q = normalize(query);
  const store = loadStore();
  const cached = store.geocodeCache || [];
  const saved = store.savedLocations || [];
  const places = [
    ...cached,
    ...saved,
    ...(store.cached?.shelters || []),
    ...(store.cached?.mapPoints?.hazards || []),
    ...(store.cached?.mapPoints?.redZones || []),
    ...(store.cached?.mapPoints?.roads || []),
    ...(store.cached?.mapPoints?.incidents || [])
  ];
  const seen = new Set();
  return places.map(normalizeResult).filter(p => {
    const hay = normalize([p.name, p.area, p.admin, p.country].filter(Boolean).join(" "));
    const key = `${p.lat},${p.lng}`;
    if (!hay.includes(q) || seen.has(key)) return false;
    seen.add(key);
    return Number.isFinite(p.lat) && Number.isFinite(p.lng);
  }).slice(0, 8);
}

export async function searchLocation(query, { online = navigator.onLine } = {}) {
  const value = query.trim();
  if (!value) return [];

  // Online mode keeps the existing geocoder logic, but every successful
  // result is cached so the same place can be found again offline.
  if (online) {
    try {
      const results = await geocodePlace(value);
      if (results?.length) {
        const normalized = results.map(normalizeResult);
        const store = loadStore();
        const existing = store.geocodeCache || [];
        const merged = [...normalized, ...existing].filter((item, index, arr) => {
          const key = `${item.lat},${item.lng}`;
          return arr.findIndex(x => `${x.lat},${x.lng}` === key) === index;
        }).slice(0, 250);
        saveStore({ ...store, geocodeCache: merged });
        return normalized;
      }
    } catch {
      // Fall through to local cache when a geocoder is temporarily unavailable.
    }
  }

  return localMatches(value);
}

export function cacheLocation(point) {
  const normalized = normalizeResult(point);
  const store = loadStore();
  const existing = store.geocodeCache || [];
  const key = `${normalized.lat},${normalized.lng}`;
  saveStore({
    ...store,
    geocodeCache: [normalized, ...existing.filter(x => `${x.lat},${x.lng}` !== key)].slice(0, 250)
  });
  return normalized;
}
