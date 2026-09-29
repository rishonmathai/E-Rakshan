import { citizenApi } from "../api/citizenApi";
import { loadStore, saveStore } from "../storage/localStore";

export async function syncCitizenData() {
  const store = loadStore();
  const server = await citizenApi.sync({ localVersion: store.sync.localVersion });
  const now = new Date().toISOString();
  const next = {
    ...store,
    cached: { ...store.cached, ...(server.changed || {}) },
    sync: { localVersion: server.serverVersion, lastSynced: now, status: "SYNC_COMPLETE" }
  };
  saveStore(next);
  return next;
}

export function getSyncLabel(store) {
  if (store.sync.status === "SYNC_COMPLETE" && store.sync.lastSynced) {
    return `Updated ${new Date(store.sync.lastSynced).toLocaleString()}`;
  }
  return "Not synchronized yet";
}
