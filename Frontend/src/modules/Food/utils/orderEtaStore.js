/**
 * Shared ETA store — single source of truth for order arrival times.
 * The tracking page (with live Google Maps data) writes here.
 * The home strip reads from here, so both pages always show the same time.
 */

const STORAGE_KEY = "order_eta_store";
const CHANNEL_NAME = "order_eta_updates";

export const normalizeLookupId = (value) => {
  if (value == null) return "";
  const raw = String(value).trim();
  if (!raw || raw === "undefined" || raw === "null") return "";
  return raw;
};

// In-memory cache to avoid repeated JSON.parse calls
let _memCache = null;

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      _memCache = JSON.parse(raw);
      return _memCache;
    }
  } catch (_) {}
  return (_memCache = {});
}

function writeStore(store) {
  _memCache = store;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (_) {}
}

/**
 * Save an ETA for an order. Call this whenever the live ETA changes (map update, status change).
 * @param {string} orderId - any stable ID for the order
 * @param {number} etaMinutes - numeric minutes
 */
export function saveOrderEta(orderId, etaMinutes) {
  const id = String(orderId || "").trim();
  if (!id || typeof etaMinutes !== "number") return;

  const store = readStore();
  store[id] = { eta: etaMinutes, ts: Date.now() };
  writeStore(store);

  // Broadcast to other tabs / same-page listeners
  try {
    const bc = new BroadcastChannel(CHANNEL_NAME);
    bc.postMessage({ orderId: id, eta: etaMinutes });
    bc.close();
  } catch (_) {}

  // Same-page custom event
  window.dispatchEvent(
    new CustomEvent("orderEtaUpdate", { detail: { orderId: id, eta: etaMinutes } })
  );
}

/**
 * Get the stored ETA for an order, or null if none / expired.
 * Entries older than 10 minutes are considered stale.
 */
export function getStoredEta(orderId) {
  const id = String(orderId || "").trim();
  if (!id) return null;

  const store = readStore();
  const entry = store[id];
  if (!entry) return null;

  // Expire after 10 minutes
  if (Date.now() - entry.ts > 10 * 60 * 1000) {
    delete store[id];
    writeStore(store);
    return null;
  }
  return entry.eta;
}

/**
 * Subscribe to ETA changes for a specific order.
 * Returns an unsubscribe function.
 */
export function subscribeToEta(orderIds, callback) {
  const idSet = new Set(
    (Array.isArray(orderIds) ? orderIds : [orderIds])
      .map((id) => String(id || "").trim())
      .filter(Boolean)
  );

  const handleCustomEvent = (e) => {
    const { orderId, eta } = e.detail || {};
    if (idSet.has(String(orderId || ""))) callback(eta);
  };

  let bc = null;
  try {
    bc = new BroadcastChannel(CHANNEL_NAME);
    bc.onmessage = (e) => {
      const { orderId, eta } = e.data || {};
      if (idSet.has(String(orderId || ""))) callback(eta);
    };
  } catch (_) {}

  window.addEventListener("orderEtaUpdate", handleCustomEvent);

  return () => {
    window.removeEventListener("orderEtaUpdate", handleCustomEvent);
    if (bc) bc.close();
  };
}
