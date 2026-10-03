import { signProKey } from '../../server/proKey';
import { isPaidPro, json, stripe } from '../../server/stripe';

// POST /api/restore { email, receipt }: unlocks Pro again on a new phone or browser. The
// buyer gives the email they paid with and the receipt number from Stripe's receipt
// email ("Receipt #1234-5678"); both must match the same paid purchase.
const normalize = (text) => String(text).replace(/[^a-z0-9]/gi, '').toLowerCase();

// Failed attempts allowed per email and per IP address within an hour, so a receipt
// number can't be found by trying many. Counted in the RESTORE_ATTEMPTS KV namespace.
const LIMITS = { email: 5, ip: 20 };
const WINDOW_SECONDS = 60 * 60;

const sha256 = async (text) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
};

// The KV keys this request counts against: hashed, so no email or IP is stored as is.
const attemptKeys = async (email, request) => ({
  email: `email:${await sha256(email.toLowerCase())}`,
  ip: `ip:${await sha256(request.headers.get('CF-Connecting-IP') || 'unknown')}`,
});

const isLimited = async (kv, keys) => {
  const [byEmail, byIp] = await Promise.all([kv.get(keys.email), kv.get(keys.ip)]);
  return Number(byEmail) >= LIMITS.email || Number(byIp) >= LIMITS.ip;
};

const countFailure = (kv, keys) =>
  Promise.all(
    Object.values(keys).map(async (key) =>
      kv.put(key, String(Number(await kv.get(key)) + 1), { expirationTtl: WINDOW_SECONDS })
    )
  );

export const onRequestPost = async ({ request, env }) => {
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const receipt = typeof body.receipt === 'string' ? normalize(body.receipt) : '';
  if (!/^[^\s@]{1,64}@[^\s@]{1,190}$/.test(email) || receipt.length < 6 || receipt.length > 40) {
    return json({ error: 'Enter the email you paid with and the receipt number from your receipt email.' }, 400);
  }
  const kv = env.RESTORE_ATTEMPTS;
  const keys = await attemptKeys(email, request);
  if (await isLimited(kv, keys)) {
    return json({ error: 'Too many tries. Wait an hour and try again, or use your Pro key instead.' }, 429);
  }
  try {
    // Checkout keeps the email as it was typed, so try it as entered and in lowercase.
    for (const address of new Set([email, email.toLowerCase()])) {
      const { data } = await stripe(env, 'GET', '/checkout/sessions', {
        customer_details: { email: address },
        status: 'complete',
        limit: 20,
        expand: { 0: 'data.payment_intent.latest_charge' },
      });
      const match = data.find(
        (s) => isPaidPro(s) && normalize(s.payment_intent?.latest_charge?.receipt_number || '') === receipt
      );
      if (match) return json({ key: await signProKey(match.id, env.PRO_PRIVATE_KEY) });
    }
    await countFailure(kv, keys);
    return json({ error: 'No Pro purchase matches that email and receipt number. Check both and try again.' }, 404);
  } catch (err) {
    console.error('restore', err);
    return json({ error: 'Pro couldn’t be restored right now. Try again in a moment.' }, 502);
  }
};
