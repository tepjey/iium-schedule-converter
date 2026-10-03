import { signProKey } from '../../server/proKey';
import { isPaidPro, json, stripe } from '../../server/stripe';

// POST /api/claim { session }: after Stripe Checkout sends the buyer back, swaps the
// Checkout Session id for a Pro key, once Stripe confirms it was paid.
export const onRequestPost = async ({ request, env }) => {
  const { session: id } = await request.json().catch(() => ({}));
  if (typeof id !== 'string' || !/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(id)) {
    return json({ error: 'That payment link isn’t valid.' }, 400);
  }
  try {
    const session = await stripe(env, 'GET', `/checkout/sessions/${id}`, {
      expand: { 0: 'payment_intent.latest_charge' },
    });
    if (!isPaidPro(session)) {
      return json({ error: 'This payment hasn’t gone through yet. If you paid by FPX, wait a minute and try again.' }, 402);
    }
    return json({ key: await signProKey(session.id, env.PRO_PRIVATE_KEY) });
  } catch (err) {
    console.error('claim', err);
    return json({ error: 'Pro couldn’t be unlocked right now. Try again in a moment.' }, 502);
  }
};
