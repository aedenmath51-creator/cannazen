import { useEffect, useState } from "react";
import { apiPost } from "@/lib/api";

const CONSENT_KEY = "cannazen_cookie_consent";
const CONSENT_VERSION = "1.0";

export type Consent = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  consentVersion: string;
  timestamp: number;
};

export function useConsent() {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Consent;
        if (parsed.consentVersion === CONSENT_VERSION) setConsent(parsed);
      } catch { /* ignore */ }
    }
    setLoaded(true);
  }, []);

  const save = (c: Omit<Consent, "consentVersion" | "timestamp">) => {
    const full: Consent = { ...c, consentVersion: CONSENT_VERSION, timestamp: Date.now() };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(full));
    setConsent(full);
    apiPost("/consent", { necessary: c.necessary, analytics: c.analytics, marketing: c.marketing, consentVersion: CONSENT_VERSION }).catch(() => {});
  };

  const reset = () => {
    localStorage.removeItem(CONSENT_KEY);
    setConsent(null);
  };

  return { consent, loaded, save, reset, hasResponded: !!consent };
}
