// Your GitHub username, shown as the footer credit ("Made by @username").
// Leave empty to hide the credit line.
export const GITHUB_USERNAME = 'tepjey';

// Your GoatCounter site code (the "mysite" in mysite.goatcounter.com), for the
// visitor counter. Leave empty to turn analytics off.
export const GOATCOUNTER_CODE = 'tepjey';

// Where students report a problem, shown in the footer and under every error.
export const REPORT_ISSUE_URL =
  'https://github.com/tepjey/iium-schedule-converter/issues/new?template=report-a-problem.yml';

// The report form with fields already filled in, keyed by the field ids in
// .github/ISSUE_TEMPLATE/report-a-problem.yml (e.g. { result: 'error message' }).
export const reportIssueUrl = (fields = {}) => {
  const url = new URL(REPORT_ISSUE_URL);
  Object.entries(fields).forEach(([id, value]) => value && url.searchParams.set(id, value));
  return url.toString();
};

// True in the beta build published at /beta/ (VITE_CHANNEL=beta, set by the deploy
// workflow). Shows the Beta badge and the link back to the regular site. The ?. covers
// vite.config.js, which imports this file before Vite's env exists.
export const IS_BETA = import.meta.env?.VITE_CHANNEL === 'beta';
