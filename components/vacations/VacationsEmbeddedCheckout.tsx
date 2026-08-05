"use client";

import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";

/**
 * Stripe Embedded Checkout — renders the payment form inside our own branded
 * /vacations page instead of redirecting to Stripe's hosted page. Card data
 * still never touches our servers (it's Stripe's iframe), but the surrounding
 * experience is ours.
 *
 * `loadStripe` is called at module scope so the SDK loads exactly once. The
 * publishable key is a PUBLIC value (safe to ship to the browser) — the server
 * route only switches to embedded mode when it's set, so `stripePromise` is
 * always non-null by the time this renders.
 */
const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = pk ? loadStripe(pk) : null;

export function VacationsEmbeddedCheckout({
  clientSecret,
}: {
  clientSecret: string;
}) {
  if (!stripePromise) return null;
  return (
    <div className="min-h-[540px]">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{ clientSecret }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
