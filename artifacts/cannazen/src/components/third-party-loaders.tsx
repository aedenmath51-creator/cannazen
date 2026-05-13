import { useEffect } from "react";
import { useConsent } from "@/hooks/use-consent";

const GA4_ID = import.meta.env.VITE_GA4_ID as string | undefined;
const CRISP_ID = import.meta.env.VITE_CRISP_WEBSITE_ID as string | undefined;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    $crisp?: unknown[];
    CRISP_WEBSITE_ID?: string;
  }
}

function loadGA4(id: string) {
  if (document.getElementById("cz-ga4")) return;
  const s = document.createElement("script");
  s.id = "cz-ga4";
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag() {
    window.dataLayer?.push(arguments as unknown as unknown[]);
  };
  window.gtag("js", new Date());
  window.gtag("config", id, { anonymize_ip: true });
}

function loadCrisp(id: string) {
  if (document.getElementById("cz-crisp")) return;
  window.$crisp = [];
  window.CRISP_WEBSITE_ID = id;
  const s = document.createElement("script");
  s.id = "cz-crisp";
  s.async = true;
  s.src = "https://client.crisp.chat/l.js";
  document.head.appendChild(s);
}

export function ThirdPartyLoaders() {
  const { consent } = useConsent();

  useEffect(() => {
    if (!consent) return;
    if (consent.analytics && GA4_ID && /^G-[A-Z0-9]+$/i.test(GA4_ID)) {
      loadGA4(GA4_ID);
    }
    if (consent.marketing && CRISP_ID && CRISP_ID !== "REMPLACER_PAR_CRISP_ID") {
      loadCrisp(CRISP_ID);
    }
  }, [consent]);

  return null;
}
