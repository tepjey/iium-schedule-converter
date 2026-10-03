import { PRODUCT, json, stripe } from '../../server/stripe';

// POST /api/checkout: starts a Stripe Checkout for SlipSnap Pro and returns its page's
// address. The payment methods (card, FPX, GrabPay) are the ones turned on in Stripe.
export const onRequestPost = async ({ request, env }) => {
  const origin = new URL(request.url).origin;
  try {
    const session = await stripe(env, 'POST', '/checkout/sessions', {
      mode: 'payment',
      submit_type: 'pay',
      line_items: {
        0: {
          quantity: 1,
          price_data: {
            currency: 'myr',
            unit_amount: Number(env.PRO_PRICE_SEN) || 500,
            product_data: {
              name: 'SlipSnap Pro',
              description: 'Photo backgrounds, stickers and notes, extra fonts and block styles. Pay once, keep forever.',
            },
          },
        },
      },
      metadata: { product: PRODUCT },
      payment_intent_data: { metadata: { product: PRODUCT }, description: 'SlipSnap Pro' },
      success_url: `${origin}/?pro=paid&session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?pro=cancelled`,
    });
    return json({ url: session.url });
  } catch (err) {
    console.error('checkout', err);
    return json({ error: 'Payment couldn’t be started. Try again in a moment.' }, 502);
  }
};
