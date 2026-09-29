const KEY = "erakshan-citizen-store-v1";

const defaults = {
  onboardingDone: false,
  authenticated: false,
  user: null,
  savedLocations: [],
  cached: {},
  geocodeCache: [],
  routeCache: {},
  offlinePack: { preparedAt: null, mapReady: false },
  sync: { localVersion: 0, lastSynced: null, status: "NOT_SYNCED" },
  settings: {
    voiceAlerts: true,
    navigationVoice: true,
    notifications: true,
    location: true,
    language: "English",
    theme: "light"
  },
  emergencyContacts: [
    { id: "c1", name: "Family Contact", phone: "+91 9876543210" },
    { id: "c2", name: "Emergency Contact", phone: "+91 9000000000" }
  ],
  family: {
    primaryAccount: true,
    members: [
      { id:"f1", name:"Family Member 1", relation:"Spouse", phone:"+91 9000000001", age:"29", bloodGroup:"O+", locationSharing:true, connected:true, lastLocation:null },
      { id:"f2", name:"Family Member 2", relation:"Child", phone:"+91 9000000002", age:"10", bloodGroup:"A+", locationSharing:false, connected:false, lastLocation:null }
    ]
  },
  sos: { active:false, sessionId:null, lastEvent:null, updates:[] }
};

export function loadStore() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    return saved ? {
      ...defaults, ...saved,
      settings: { ...defaults.settings, ...saved.settings },
      sync: { ...defaults.sync, ...saved.sync },
      geocodeCache: saved.geocodeCache || [],
      routeCache: { ...defaults.routeCache, ...(saved.routeCache || {}) },
      offlinePack: { ...defaults.offlinePack, ...(saved.offlinePack || {}) },
      family: { ...defaults.family, ...(saved.family || {}), members: saved.family?.members || defaults.family.members },
      sos: { ...defaults.sos, ...(saved.sos || {}), updates: saved.sos?.updates || [] }
    } : defaults;
  } catch {
    return defaults;
  }
}

export function saveStore(next) {
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function patchStore(patch) {
  const current = loadStore();
  const next = typeof patch === "function" ? patch(current) : { ...current, ...patch };
  saveStore(next);
  return next;
}

export function clearStore() {
  localStorage.removeItem(KEY);
}
