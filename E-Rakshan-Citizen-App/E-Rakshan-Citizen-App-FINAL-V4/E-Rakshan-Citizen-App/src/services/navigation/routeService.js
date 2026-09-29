import { citizenApi } from '../api/citizenApi';
import { loadStore, saveStore } from '../storage/localStore';

const EARTH_KM = 6371;

export const TRAVEL_MODES = {
  car: { label: 'Car', icon: '??', profile: 'driving', server: 'https://router.project-osrm.org', speedFactor: 1 },
  motorcycle: { label: 'Motorcycle', icon: '???', profile: 'driving', server: 'https://router.project-osrm.org', speedFactor: 0.88 },
  bicycle: { label: 'Bicycle', icon: '??', profile: 'driving', server: 'https://routing.openstreetmap.de/routed-bike', speedFactor: 1 },
  walking: { label: 'Walking', icon: '??', profile: 'driving', server: 'https://routing.openstreetmap.de/routed-foot', speedFactor: 1 },
};

function hav(a, b) {
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lng - a.lng) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return EARTH_KM * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function distanceToRoutePoint(point, geometry) {
  let min = Infinity;
  for (let i = 0; i < geometry.length; i += Math.max(1, Math.floor(geometry.length / 100))) {
    const [lat, lng] = geometry[i];
    min = Math.min(min, hav(point, { lat, lng }));
  }
  return min;
}

function assessRoute(route, mapData = {}) {
  const geometry = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  const redZones = mapData.redZones || [];
  const blockedRoads = (mapData.roads || []).filter(r => /blocked|closed/i.test(r.status || ''));
  let redExposure = 0;
  let blockedExposure = 0;
  redZones.forEach(z => {
    if (distanceToRoutePoint({ lat: z.lat, lng: z.lng }, geometry) <= Math.max(0.15, (z.radius || 0) / 1000)) redExposure += 1;
  });
  blockedRoads.forEach(r => {
    if (distanceToRoutePoint({ lat: r.lat, lng: r.lng }, geometry) <= 0.2) blockedExposure += 1;
  });
  const distanceKm = route.distance / 1000;
  const safetyPenalty = redExposure * 25 + blockedExposure * 40;
  return { geometry, redExposure, blockedExposure, safetyScore: distanceKm + safetyPenalty };
}

function buildInstructions(route) {
  const steps = route.legs?.[0]?.steps || [];
  return steps.map((step) => {
    const type = step.maneuver?.type;
    const modifier = step.maneuver?.modifier;
    if (type === 'depart') return `Start on ${step.name || 'the selected road'}`;
    if (type === 'arrive') return 'You have arrived at your destination';
    const distance = step.distance >= 1000
      ? `${(step.distance / 1000).toFixed(1).replace('.0', '')} km`
      : `${Math.max(10, Math.round(step.distance / 10) * 10)} m`;
    let action = 'Continue';
    if (modifier?.includes('right')) action = 'Turn right';
    else if (modifier?.includes('left')) action = 'Turn left';
    else if (modifier?.includes('straight')) action = 'Continue straight';
    else if (type === 'roundabout' || type === 'rotary') action = 'Enter the roundabout';
    return `${action} in ${distance}${step.name ? ` onto ${step.name}` : ''}`;
  }).filter(Boolean).filter((value, index, arr) => index === 0 || value !== arr[index - 1]);
}

function buildStepPoints(route) {
  return (route.legs?.[0]?.steps || []).map((step, index) => {
    const c = step.maneuver?.location;
    if (!Array.isArray(c)) return null;
    return {
      id: `step-${index}`,
      lat: Number(c[1]),
      lng: Number(c[0]),
      instruction: buildInstructions({ legs: [{ steps: [step] }] })[0] || 'Continue',
      distance: Number(step.distance || 0),
      road: step.name || 'Road',
    };
  }).filter(Boolean);
}

function cacheKey(origin, destination, mode, travelMode) {
  return `route:${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}:${destination.lat.toFixed(4)},${destination.lng.toFixed(4)}:${mode}:${travelMode}`;
}

function saveRouteCache(key, value) {
  try {
    const store = loadStore();
    saveStore({ ...store, routeCache: { ...(store.routeCache || {}), [key]: { ...value, cachedAt: new Date().toISOString() } } });
  } catch {}
}

function getRouteCache(key) {
  try { return loadStore().routeCache?.[key] || null; } catch { return null; }
}

function offlineGuidance(origin, destination, mode, travelMode = 'car') {
  const directKm = hav(origin, destination);
  const speed = travelMode === 'walking' ? 5 : travelMode === 'bicycle' ? 16 : travelMode === 'motorcycle' ? 40 : 35;
  const bearing = Math.atan2(
    Math.sin((destination.lng - origin.lng) * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180),
    Math.cos(origin.lat * Math.PI / 180) * Math.sin(destination.lat * Math.PI / 180) - Math.sin(origin.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) * Math.cos((destination.lng - origin.lng) * Math.PI / 180)
  ) * 180 / Math.PI;
  const normalized = (bearing + 360) % 360;
  const dirs = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
  const direction = dirs[Math.round(normalized / 45) % 8];
  return {
    routeType: mode,
    travelMode,
    travelLabel: TRAVEL_MODES[travelMode]?.label || 'Car',
    distanceKm: Number(directKm.toFixed(1)),
    etaMinutes: Math.max(1, Math.round((directKm / speed) * 60)),
    instructions: [`Offline guidance: head ${direction} toward ${destination.name || 'your destination'}`, `Continue for approximately ${directKm.toFixed(1)} km`, 'Reconnect for road-level turn-by-turn routing and live rerouting'],
    stepPoints: [],
    geometry: [[origin.lat, origin.lng], [destination.lat, destination.lng]],
    offline: true,
    safety: { redExposure: 0, blockedExposure: 0, safetyScore: directKm },
    trafficAvailable: false,
  };
}

async function requestRoute(origin, destination, travelMode = 'car') {
  const cfg = TRAVEL_MODES[travelMode] || TRAVEL_MODES.car;
  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const url = `${cfg.server}/route/v1/${cfg.profile}/${coords}?overview=full&geometries=geojson&steps=true&alternatives=true&continue_straight=false`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Routing service unavailable (${response.status})`);
  const data = await response.json();
  if (!data.routes?.length) throw new Error('No route found');
  return data;
}

export async function buildRouteOptions(origin, destination, mode = 'Safest Route', mapData = {}) {
  const travelModes = Object.keys(TRAVEL_MODES);
  const results = await Promise.allSettled(travelModes.map(async travelMode => {
    const data = await requestRoute(origin, destination, travelMode);
    const assessed = data.routes.map(route => ({ route, ...assessRoute(route, mapData) }));
    const chosen = mode === 'Fastest'
      ? [...assessed].sort((a, b) => a.route.duration - b.route.duration)[0]
      : [...assessed].sort((a, b) => a.safetyScore - b.safetyScore)[0];
    const cfg = TRAVEL_MODES[travelMode];
    const eta = (chosen.route.duration / 60) * cfg.speedFactor;
    return {
      travelMode,
      travelLabel: cfg.label,
      travelIcon: cfg.icon,
      routeType: mode,
      distanceKm: Number((chosen.route.distance / 1000).toFixed(1)),
      etaMinutes: Math.max(1, Math.round(eta)),
      instructions: buildInstructions(chosen.route),
      stepPoints: buildStepPoints(chosen.route),
      geometry: chosen.geometry,
      raw: chosen.route,
      offline: false,
      trafficAvailable: false,
      safety: { redExposure: chosen.redExposure, blockedExposure: chosen.blockedExposure, safetyScore: Number(chosen.safetyScore.toFixed(2)) },
    };
  }));
  return results.filter(x => x.status === 'fulfilled').map(x => x.value);
}

export async function buildSafeRoute(origin, destination, mode = 'Safest Route', mapData = {}, travelMode = 'car') {
  const key = cacheKey(origin, destination, mode, travelMode);
  try {
    const data = await requestRoute(origin, destination, travelMode);
    const assessed = data.routes.map(route => ({ route, ...assessRoute(route, mapData) }));
    let chosen;
    if (mode === 'Fastest') {
      chosen = [...assessed].sort((a, b) => a.route.duration - b.route.duration)[0];
    } else if (mode === 'Emergency route') {
      chosen = [...assessed].sort((a, b) => (a.safetyScore * 0.65 + a.route.duration / 60 * 0.35) - (b.safetyScore * 0.65 + b.route.duration / 60 * 0.35))[0];
    } else {
      chosen = [...assessed].sort((a, b) => a.safetyScore - b.safetyScore)[0];
    }
    const cfg = TRAVEL_MODES[travelMode] || TRAVEL_MODES.car;
    const result = {
      routeType: mode,
      travelMode,
      travelLabel: cfg.label,
      travelIcon: cfg.icon,
      distanceKm: Number((chosen.route.distance / 1000).toFixed(1)),
      etaMinutes: Math.max(1, Math.round((chosen.route.duration / 60) * cfg.speedFactor)),
      instructions: buildInstructions(chosen.route),
      stepPoints: buildStepPoints(chosen.route),
      geometry: chosen.geometry,
      raw: chosen.route,
      offline: false,
      trafficAvailable: false,
      safety: { redExposure: chosen.redExposure, blockedExposure: chosen.blockedExposure, safetyScore: Number(chosen.safetyScore.toFixed(2)) }
    };
    saveRouteCache(key, result);
    return result;
  } catch {
    const cached = getRouteCache(key);
    if (cached) return { ...cached, offline: true, fromCache: true };
    try {
      const fallback = await citizenApi.calculateRoute({ origin, destination, mode, travelMode });
      const result = {
        ...fallback,
        travelMode,
        travelLabel: TRAVEL_MODES[travelMode]?.label || 'Car',
        geometry: fallback.geometry || [[origin.lat, origin.lng], [destination.lat, destination.lng]],
        stepPoints: fallback.stepPoints || [],
        offline: true,
        trafficAvailable: false,
        safety: fallback.safety || { redExposure: 0, blockedExposure: 0, safetyScore: fallback.distanceKm || hav(origin, destination)}
      };
      saveRouteCache(key, result);
      return result;
    } catch {
      return offlineGuidance(origin, destination, mode, travelMode);
    }
  }
}
