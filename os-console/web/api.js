// API + console-local state (pins, recents — the prefs overlay, never canonical truth).

async function call(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* non-JSON error */ }
  if (!res.ok) {
    const e = new Error((data && data.error) || `${res.status} ${res.statusText}`);
    e.status = res.status;
    throw e;
  }
  return data;
}

export const api = {
  get: (url) => call('GET', url),
  put: (url, body) => call('PUT', url, body),
  post: (url, body) => call('POST', url, body),
};

// ---- prefs overlay -------------------------------------------------------

let state = { pins: [], collections: [], recents: [] };
let saveTimer = null;

export async function loadState() {
  try { state = await api.get('/api/state'); } catch { /* defaults */ }
  return state;
}

function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => api.put('/api/state', state).catch(() => {}), 400);
}

export function getState() { return state; }

export function isPinned(key) { return state.pins.includes(key); }

export function togglePin(key) {
  const i = state.pins.indexOf(key);
  if (i >= 0) state.pins.splice(i, 1); else state.pins.unshift(key);
  persist();
  return i < 0;
}

export function pushRecent(entry) {
  state.recents = [entry, ...state.recents.filter((r) => r.path !== entry.path)].slice(0, 12);
  persist();
}
