const GUEST_ID_KEY = 'otakuversus_guest_id';

function createGuestId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `guest_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export function getOrCreateGuestId() {
  const existing = localStorage.getItem(GUEST_ID_KEY);
  if (existing) {
    return existing;
  }

  const next = createGuestId();
  localStorage.setItem(GUEST_ID_KEY, next);
  return next;
}

