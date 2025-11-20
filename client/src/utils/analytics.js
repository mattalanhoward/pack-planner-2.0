// src/utils/analytics.js
import { loadConsent } from "./cookieConsent";

let analyticsInitialized = false;

/**
 * Initialize analytics if:
 * - we're in a browser, and
 * - user has consented to analytics, and
 * - we have a script URL configured.
 *
 * This is intentionally simple and provider-agnostic. For example,
 * with Plausible you can set:
 *   VITE_ANALYTICS_SRC=https://plausible.io/js/script.js
 *   VITE_ANALYTICS_DOMAIN=treklist.co
 */
export function initAnalytics() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (analyticsInitialized) return;

  const consent = loadConsent();
  if (!consent.analytics) return;

  const src = import.meta.env.VITE_ANALYTICS_SRC;
  if (!src) {
    if (import.meta.env.DEV) {
    }
    analyticsInitialized = true;
    return;
  }

  // Avoid injecting the script multiple times
  if (document.querySelector('script[data-treklist-analytics="true"]')) {
    analyticsInitialized = true;
    return;
  }

  const script = document.createElement("script");
  script.src = src;
  script.defer = true;
  script.setAttribute("data-treklist-analytics", "true");

  const domain = import.meta.env.VITE_ANALYTICS_DOMAIN;
  if (domain) {
    // For providers like Plausible that support data-domain; harmless otherwise.
    script.setAttribute("data-domain", domain);
  }

  document.head.appendChild(script);
  analyticsInitialized = true;
}
