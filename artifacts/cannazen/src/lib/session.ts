const AGE_VERIFIED_KEY = "cannazen_age_verified";
const GUEST_SESSION_INITIALIZED_KEY = "cannazen_guest_init";

const BASE = (import.meta.env.BASE_URL || "/").replace(/\/$/, "") + "/api";

let initPromise: Promise<void> | null = null;

async function tryInitGuestSession(): Promise<void> {
  if (sessionStorage.getItem(GUEST_SESSION_INITIALIZED_KEY) === "1") return;
  const res = await fetch(`${BASE}/auth/guest-session`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (res.ok) {
    sessionStorage.setItem(GUEST_SESSION_INITIALIZED_KEY, "1");
  }
}

export function ensureGuestSession(): Promise<void> {
  if (sessionStorage.getItem(GUEST_SESSION_INITIALIZED_KEY) === "1") {
    return Promise.resolve();
  }
  if (!initPromise) {
    initPromise = tryInitGuestSession().catch(() => {
      initPromise = null;
    });
  }
  return initPromise;
}

export function getAgeVerified(): boolean {
  return localStorage.getItem(AGE_VERIFIED_KEY) === "true";
}

export function setAgeVerified(verified: boolean) {
  localStorage.setItem(AGE_VERIFIED_KEY, verified ? "true" : "false");
}
