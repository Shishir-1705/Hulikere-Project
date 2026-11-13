import defaultAssets from '../data/assets.json';
import osmData from '../data/osm.json';
import { mergeOsmWithSampleAssets, tagAsSample } from './osmMapper';

export const STORAGE_KEY = 'hulikere_gp_assets_v1';
export const AUTH_STORAGE_KEY = 'hulikere_gp_auth_v1';

export const DEMO_USERS = [
  {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    displayName: 'PDO (Admin)',
    roleLabel: 'Admin — Full Edit',
  },
  {
    username: 'viewer',
    password: 'viewer123',
    role: 'viewer',
    displayName: 'Guest Viewer',
    roleLabel: 'Viewer — Read Only',
  },
];

function cloneDefaultAssets() {
  const baseSample = JSON.parse(JSON.stringify(defaultAssets));
  return mergeOsmWithSampleAssets(baseSample, osmData);
}

export function loadAssets() {
  const fallback = cloneDefaultAssets();
  const currentOsmStamp = osmData?.metadata?.fetchedAt || null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return fallback;

    // If scripts/fetchOsm.js populated/updated src/data/osm.json, load the fresh OSM merge
    const cachedOsmStamp = parsed.meta?.osmFetchedAt || null;
    if (cachedOsmStamp !== currentOsmStamp) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
      return fallback;
    }

    return {
      meta: parsed.meta || fallback.meta,
      wards: Array.isArray(parsed.wards) ? parsed.wards : fallback.wards,
      waterTanks: Array.isArray(parsed.waterTanks)
        ? tagAsSample(parsed.waterTanks)
        : fallback.waterTanks,
      roads: Array.isArray(parsed.roads) ? tagAsSample(parsed.roads) : fallback.roads,
      publicBuildings: Array.isArray(parsed.publicBuildings)
        ? tagAsSample(parsed.publicBuildings)
        : fallback.publicBuildings,
      streetLights: Array.isArray(parsed.streetLights)
        ? tagAsSample(parsed.streetLights)
        : fallback.streetLights,
      complaints: Array.isArray(parsed.complaints)
        ? parsed.complaints
        : fallback.complaints || [],
    };
  } catch {
    return fallback;
  }
}

export function saveAssets(data) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function resetAssets() {
  const fresh = cloneDefaultAssets();
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  } catch {
    // Ignore storage quota errors in restricted browsing contexts
  }
  return fresh;
}

export function exportAssetsJson(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const dateStamp = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.href = url;
  link.download = `hulikere-gp-assets-${dateStamp}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function authenticateDemoUser(username, password) {
  const u = String(username || '').trim().toLowerCase();
  const p = String(password || '');
  const matched = DEMO_USERS.find(
    (account) => account.username === u && account.password === p
  );
  if (!matched) return null;
  return {
    username: matched.username,
    role: matched.role,
    displayName: matched.displayName,
    roleLabel: matched.roleLabel,
  };
}

export function loadAuthSession() {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || (parsed.role !== 'admin' && parsed.role !== 'viewer')) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveAuthSession(session) {
  try {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Ignore storage errors
  }
}

export function clearAuthSession() {
  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}
