import { GOATCOUNTER_CODE } from '../config';

// Privacy-friendly visit counting with GoatCounter: no cookies, no cross-site
// tracking, and nothing from the student's slip is ever sent. GoatCounter ignores
// localhost, so local development isn't counted.
export const initAnalytics = () => {
  if (!GOATCOUNTER_CODE || typeof document === 'undefined') return;
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://gc.zgo.at/count.js';
  script.dataset.goatcounter = `https://${GOATCOUNTER_CODE}.goatcounter.com/count`;
  document.head.appendChild(script);
};

// Count an action (shown under "Events" in the GoatCounter dashboard). Only the
// event name is sent. Silently does nothing if analytics is off or blocked.
export const trackEvent = (name, title = name) => {
  try {
    window.goatcounter?.count?.({ path: name, title, event: true });
  } catch {
    // An ad blocker or network error must never break the app.
  }
};
