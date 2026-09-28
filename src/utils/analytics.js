import { GOATCOUNTER_CODE } from '../config';

// Privacy-friendly visit counting with GoatCounter: no cookies, no cross-site
// tracking. GoatCounter ignores localhost, so local development isn't counted.
export const initAnalytics = () => {
  if (!GOATCOUNTER_CODE || typeof document === 'undefined') return;
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://gc.zgo.at/count.js';
  script.dataset.goatcounter = `https://${GOATCOUNTER_CODE}.goatcounter.com/count`;
  document.head.appendChild(script);
};

// Count an action (shown under "Events" in the GoatCounter dashboard). Returns false
// if analytics is off or blocked (e.g. by an ad blocker), so callers can say so.
export const trackEvent = (name, title = name) => {
  try {
    if (!window.goatcounter?.count) return false;
    window.goatcounter.count({ path: name, title, event: true });
    return true;
  } catch {
    // An ad blocker or network error must never break the app.
    return false;
  }
};

// Why a slip failed, as a short label with no slip content. Sent automatically.
export const failureReason = ({ error, parsed }) => {
  if (error === 'not-pdf') return 'not a PDF';
  if (error) return `PDF error: ${String(error.name || error.message || 'unknown').slice(0, 60)}`;
  if (parsed && parsed.diagnostics.lineCount === 0) return 'no text in PDF (scanned or photo?)';
  if (parsed && !parsed.courses.length) return 'no courses found';
  const rows = parsed?.diagnostics.unreadableRows.length || 0;
  return `${rows} row${rows === 1 ? '' : 's'} unreadable`;
};

// The opt-in report: the reason plus each unreadable row (already masked), sent only
// when the student taps "Send anonymous report" after seeing exactly what's included.
export const sendReport = (reason, rows) => {
  if (!trackEvent(`report: ${reason}`, 'Anonymous report')) return false;
  rows.forEach((row) => trackEvent(`report-row: ${row}`, reason));
  return true;
};
