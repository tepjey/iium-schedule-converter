// A tiny Stripe API client for the Pro endpoints (functions/api/). Stripe is the only
// record of who paid: there's no database. STRIPE_SECRET_KEY is a restricted key with
// "Checkout Sessions: Write" and "Charges / Payment Intents: Read".

const API = 'https://api.stripe.com/v1';

// Stripe takes form-encoded bodies with bracketed keys: line_items[0][quantity]=1.
const flatten = (value, prefix, out) => {
  if (value === undefined || value === null) return out;
  if (typeof value === 'object') {
    for (const [key, inner] of Object.entries(value)) flatten(inner, prefix ? `${prefix}[${key}]` : key, out);
  } else {
    out.append(prefix, String(value));
  }
  return out;
};

export const stripe = async (env, method, path, params = {}) => {
  const query = flatten(params, '', new URLSearchParams());
  const url = method === 'GET' ? `${API}${path}?${query}` : `${API}${path}`;
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      ...(method === 'GET' ? {} : { 'Content-Type': 'application/x-www-form-urlencoded' }),
    },
    body: method === 'GET' ? undefined : query,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || `Stripe error ${response.status}`);
  return data;
};

// Marks SlipSnap Pro purchases, so no other payment on the account can unlock Pro.
export const PRODUCT = 'slipsnap-pro';

// A finished Pro purchase that hasn't been refunded. `session` needs
// payment_intent.latest_charge expanded.
export const isPaidPro = (session) =>
  session?.metadata?.product === PRODUCT &&
  session.payment_status === 'paid' &&
  !session.payment_intent?.latest_charge?.refunded;

export const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
