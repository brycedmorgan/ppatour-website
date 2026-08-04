import Stripe from "stripe";

/**
 * Lazily construct the Stripe client so the rest of the site runs even when
 * keys aren't configured yet. Throws a clear, catchable error if the secret
 * key is missing.
 */
/** True when a secret key is configured — lets callers degrade instead of throw. */
export function stripeReady(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(key);
}
