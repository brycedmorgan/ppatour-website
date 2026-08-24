/**
 * Creates a Shopify cart for one variant and returns its hosted checkout URL.
 *
 * ⚠ THIS IS THE WHOLE OF OUR CHECKOUT, AND THAT IS ON PURPOSE. The site's rule
 * is no native cart and no embedded checkout (CLAUDE.md); `/vacations` holds the
 * line by handing off to Stripe's hosted page, and this does the same with
 * Shopify's. We create a one-line cart, hand back `checkoutUrl`, and the browser
 * leaves. No card details, no addresses, no order state ever reach this app —
 * so there is nothing here to breach and nothing to keep in sync with Shopify.
 *
 * ⚠ AND THE PRICE IS NEVER SENT FROM THE CLIENT. The request carries a variant
 * id and a quantity, nothing else. Shopify prices the cart from its own record.
 * A client-supplied price is the classic storefront exploit, and the shape of
 * this route makes it unrepresentable rather than merely validated.
 */

import { NextResponse } from "next/server";
import { shopConfigured, shopifyQuery } from "@/lib/shopify";

const CART_CREATE = `
  mutation ShopCheckout($lines: [CartLineInput!]!) {
    cartCreate(input: { lines: $lines }) {
      cart { checkoutUrl }
      userErrors { field message }
    }
  }
`;

/** Storefront variant GIDs only. Anything else never reaches Shopify. */
const VARIANT_GID = /^gid:\/\/shopify\/ProductVariant\/\d+$/;

type Body = { variantId?: unknown; quantity?: unknown };

export async function POST(req: Request) {
  if (!shopConfigured()) {
    // Same posture as the Vacations checkout with no Stripe key: refuse loudly
    // rather than 500, so the button can say something true.
    return NextResponse.json({ error: "The shop is not open yet." }, { status: 503 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const variantId = typeof body.variantId === "string" ? body.variantId : "";
  if (!VARIANT_GID.test(variantId)) {
    return NextResponse.json({ error: "Unknown product option." }, { status: 400 });
  }

  const rawQty = Number(body.quantity ?? 1);
  const quantity = Number.isFinite(rawQty) ? Math.min(Math.max(Math.trunc(rawQty), 1), 10) : 1;

  const data = await shopifyQuery<{
    cartCreate: { cart: { checkoutUrl: string } | null; userErrors: { message: string }[] };
  }>(CART_CREATE, {
    variables: { lines: [{ merchandiseId: variantId, quantity }] },
    // No revalidate: a cart mutation must never touch the Data Cache.
    retries: 1,
  });

  const checkoutUrl = data?.cartCreate?.cart?.checkoutUrl;
  if (!checkoutUrl) {
    const detail = data?.cartCreate?.userErrors?.[0]?.message;
    console.error("[shop/checkout] cartCreate failed:", detail ?? "no checkoutUrl");
    return NextResponse.json(
      { error: detail ?? "We couldn't start checkout. Please try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ checkoutUrl }, { headers: { "Cache-Control": "no-store" } });
}
