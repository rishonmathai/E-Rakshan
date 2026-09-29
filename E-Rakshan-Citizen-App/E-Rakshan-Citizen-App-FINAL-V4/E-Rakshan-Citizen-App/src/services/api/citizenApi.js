import { alerts, shelters, mapPoints, demoUser } from '../../data/mockData';

const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
export const DEMO_MODE = String(import.meta.env.VITE_DEMO_MODE ?? 'true').toLowerCase() !== 'false';

async function request(path, options = {}) {
  if (!baseUrl) throw new Error('VITE_API_BASE_URL is not configured.');
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  if (!response.ok) throw new Error(`API request failed: ${response.status}`);
  return response.json();
}

export const citizenApi = {
  async getAlerts() { return DEMO_MODE ? alerts : request('/api/v1/citizen/alerts'); },
  async getShelters() { return DEMO_MODE ? shelters : request('/api/v1/citizen/shelters'); },
  async getHazards() { return DEMO_MODE ? mapPoints.hazards : request('/api/v1/citizen/hazards'); },
  async getRedZones() { return DEMO_MODE ? mapPoints.redZones : request('/api/v1/citizen/red-zones'); },
  async getRoads() { return DEMO_MODE ? mapPoints.roads : request('/api/v1/citizen/roads'); },
  async getIncidents() { return DEMO_MODE ? mapPoints.incidents : request('/api/v1/citizen/incidents'); },
  async getMapData() {
    if (DEMO_MODE) return mapPoints;
    const [redZones, hazards, roads, incidents] = await Promise.all([
      this.getRedZones(), this.getHazards(), this.getRoads(), this.getIncidents()
    ]);
    return { redZones: redZones?.items || redZones || [], hazards: hazards?.items || hazards || [], roads: roads?.items || roads || [], incidents: incidents?.items || incidents || [] };
  },
  async getProfile() { return DEMO_MODE ? demoUser : request('/api/v1/citizen/profile'); },
  async getInitialData() {
    if (DEMO_MODE) return { alerts, shelters, mapData: mapPoints };
    const [alertResult, shelterResult, mapResult] = await Promise.all([this.getAlerts(), this.getShelters(), this.getMapData()]);
    return { alerts: alertResult?.items || alertResult || [], shelters: shelterResult?.items || shelterResult || [], mapData: mapResult };
  },
  async sync(metadata = {}) {
    return DEMO_MODE
      ? { serverVersion: 1842, changed: { alerts, shelters, mapPoints }, ...metadata }
      : request('/api/v1/citizen/sync', { method: 'POST', body: JSON.stringify(metadata) });
  },

  async getOfflineRoadPack() {
    if (DEMO_MODE) return { routes: [], routeCount: 0, preparedAt: null };
    return request('/api/v1/citizen/offline-road-pack');
  },

  async sendSOS(payload) {
    if (DEMO_MODE) {
      return { ok:true, mode:'demo', dispatchId:`SOS-${Date.now()}`, receivedBy:['Government Control Room (Demo)','Linked Family Circle (Demo)'], payload };
    }
    return request('/api/v1/citizen/sos', { method:'POST', body:JSON.stringify(payload) });
  },
  async updateSOS(sessionId,payload) {
    if (DEMO_MODE) return { ok:true, mode:'demo', sessionId, updatedAt:new Date().toISOString(), payload };
    return request(`/api/v1/citizen/sos/${encodeURIComponent(sessionId)}/location`, { method:'POST', body:JSON.stringify(payload) });
  },
  async calculateRoute(payload) {
    if (DEMO_MODE) return { ...payload, routeType: payload.mode || 'Safest Route', distanceKm: 1.8, etaMinutes: 5, instructions: ['Head toward Main Road', 'Turn right in 600 meters', 'Continue straight for 1 kilometer', 'Shelter ahead in 300 meters'] };
    return request('/api/v1/citizen/routes', { method: 'POST', body: JSON.stringify(payload) });
  }
};

