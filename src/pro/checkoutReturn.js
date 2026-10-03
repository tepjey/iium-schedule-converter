// Stripe Checkout sends a buyer back to /?pro=paid&session=cs_... The session id can be
// swapped for a Pro key (functions/api/claim.js), so it's read and removed from the address
// before anything else runs: the visitor counter never records it and it doesn't stay in
// the browser's history. Imported in main.jsx before analytics starts.
let session = '';

try {
  const params = new URLSearchParams(window.location.search);
  if (params.has('pro')) {
    if (params.get('pro') === 'paid') session = params.get('session') || '';
    window.history.replaceState(null, '', window.location.pathname + window.location.hash);
  }
} catch {
  // No session: the buyer can still restore Pro with their receipt.
}

// The Checkout Session to claim, or '' if the page wasn't opened from Checkout.
export const checkoutSession = session;
