import { signProKey } from '../../server/proKey';
import { isPaidPro, json, stripe } from '../../server/stripe';

// POST /api/restore { email, receipt }: unlocks Pro again on a new phone or browser. The
// buyer gives the email they paid with and the receipt number from Stripe's receipt
// email ("Receipt #1234-5678"); both must match the same paid purchase.
const normalize = (text) => String(text).replace(/[^a-z0-9]/gi, '').toLowerCase();

export const onRequestPost = async ({ request, env }) => {
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const receipt = typeof body.receipt === 'string' ? normalize(body.receipt) : '';
  if (!/^[^\s@]{1,64}@[^\s@]{1,190}$/.test(email) || receipt.length < 6 || receipt.length > 40) {
    return json({ error: 'Enter the email you paid with and the receipt number from your receipt email.' }, 400);
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
    return json({ error: 'No Pro purchase matches that email and receipt number. Check both and try again.' }, 404);
  } catch (err) {
    console.error('restore', err);
    return json({ error: 'Pro couldn’t be restored right now. Try again in a moment.' }, 502);
  }
};
