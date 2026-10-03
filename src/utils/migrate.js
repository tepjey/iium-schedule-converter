// Moving from tepjey.github.io to slipsnap.pages.dev: browsers keep saved settings per
// address, so the old site's redirect hands them over in the link's #migrate=... part
// (never sent to any server). This runs before the app reads any settings, so it must be
// the first import in main.jsx. Only keys that aren't set here yet are filled in.
const PREFIX = '#migrate=';

const fromBase64Url = (code) => {
  const binary = atob(code.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
};

try {
  if (window.location.hash.startsWith(PREFIX)) {
    const data = JSON.parse(fromBase64Url(window.location.hash.slice(PREFIX.length)));
    if (data && typeof data === 'object') {
      for (const [key, value] of Object.entries(data)) {
        if (key.startsWith('iium.') && typeof value === 'string' && localStorage.getItem(key) === null) {
          localStorage.setItem(key, value);
        }
      }
    }
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }
} catch {
  // A damaged handover just means starting with default settings.
}
