const CACHE_NAME = 'erakshan-citizen-shell-v3';
const TILE_CACHE = 'erakshan-map-tiles-v3';
const APP_SHELL = ['/', '/index.html', '/e-rakshan-mark.svg', '/assets/e-rakshan-mark.svg', '/assets/sai-icon.png', '/sounds/sos-alert.wav'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;

  if (url.hostname.includes('tile.openstreetmap.org')) {
    event.respondWith(caches.open(TILE_CACHE).then(async cache => {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      try {
        const response = await fetch(event.request);
        if (response.ok || response.type === 'opaque') cache.put(event.request, response.clone());
        return response;
      } catch {
        return cached || Response.error();
      }
    }));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response.ok && (event.request.destination === 'script' || event.request.destination === 'style' || event.request.destination === 'image' || event.request.destination === 'font')) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => caches.match('/index.html'))));
  }
});


self.addEventListener('message', event => {
  if (event.data?.type !== 'CACHE_MAP_AREA') return;
  const lat = Number(event.data.lat);
  const lng = Number(event.data.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

  const tileXY = (lat, lon, z) => {
    const n = 2 ** z;
    const x = Math.floor((lon + 180) / 360 * n);
    const y = Math.floor((1 - Math.asinh(Math.tan(lat * Math.PI / 180)) / Math.PI) / 2 * n);
    return { x, y };
  };

  event.waitUntil((async () => {
    const cache = await caches.open(TILE_CACHE);
    const jobs = [];
    const zooms = [11, 12, 13, 14, 15, 16];
    for (const z of zooms) {
      const {x, y} = tileXY(lat, lng, z);
      const radius = z <= 12 ? 1 : z <= 14 ? 2 : 3;
      for (let dx=-radius; dx<=radius; dx++) {
        for (let dy=-radius; dy<=radius; dy++) {
          const max = 2 ** z;
          const tx = (x + dx + max) % max;
          const ty = Math.min(max - 1, Math.max(0, y + dy));
          jobs.push(`https://tile.openstreetmap.org/${z}/${tx}/${ty}.png`);
        }
      }
    }
    await Promise.allSettled(jobs.map(async url => {
      if (await cache.match(url)) return;
      try {
        const response = await fetch(url);
        if (response.ok || response.type === 'opaque') await cache.put(url, response);
      } catch {}
    }));
  })());
});
