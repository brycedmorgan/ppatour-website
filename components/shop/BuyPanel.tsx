"use client";

import { useMemo, useState } from "react";

import { formatMoney, type ShopVariant } from "@/lib/shop";

/**
 * Variant picker + the handoff to Shopify's hosted checkout.
 *
 * ⚠ THERE IS NO CART HERE, AND THERE SHOULDN'T BE. One click builds a one-line
 * Shopify cart server-side and sends the shopper to Shopify's checkout. The
 * site's rule is that commerce is hosted (CLAUDE.md); a persistent basket would
 * mean holding order state, and this app deliberately holds none.
 */
export function BuyPanel({ variants, available }: { variants: ShopVariant[]; available: boolean }) {
  const [selectedId, setSelectedId] = useState(
    // Open on something buyable when one exists, so the default state isn't
    // a disabled button on a product that is actually in stock.
    () => (variants.find((v) => v.available) ?? variants[0])?.id ?? "",
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(
    () => variants.find((v) => v.id === selectedId) ?? null,
    [variants, selectedId],
  );

  // A single unnamed variant is Shopify's shape for "this product has no
  // options" — showing a one-item dropdown labelled "Default Title" would be
  // noise, so the control only appears when there is a real choice to make.
  const showPicker = variants.length > 1;
  const buyable = available && Boolean(selected?.available);

  async function checkout() {
    if (!selected || pending) return;
    setPending(true);
    setError(null);
    try {
      // ⚠ Trailing slash: `trailingSlash: true` in next.config, so the bare
      // path eats a 308 on the way in — a documented trap in this repo.
      const res = await fetch("/api/shop/checkout/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: selected.id, quantity: 1 }),
      });
      const data = (await res.json()) as { checkoutUrl?: string; error?: string };
      if (!res.ok || !data.checkoutUrl) {
        setError(data.error ?? "We couldn't start checkout. Please try again.");
        setPending(false);
        return;
      }
      // Leave the site. Deliberately not a new tab: checkout is the same
      // journey, and a popup here is what breaks mobile purchase flows.
      window.location.href = data.checkoutUrl;
    } catch {
      setError("We couldn't reach checkout. Please check your connection.");
      setPending(false);
    }
  }

  return (
    <div className="mt-6">
      {showPicker && (
        <div className="mb-4">
          <label
            htmlFor="shop-variant"
            className="block text-[11px] font-bold uppercase tracking-[0.16em] text-ppa-navy/50"
          >
            Options
          </label>
          <select
            id="shop-variant"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="mt-2 w-full border border-ppa-line bg-white px-3 py-2.5 text-sm text-ppa-navy focus:border-ppa-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-ppa-blue"
          >
            {variants.map((v) => (
              <option key={v.id} value={v.id} disabled={!v.available}>
                {v.title}
                {v.available ? "" : " — Sold out"}
              </option>
            ))}
          </select>
        </div>
      )}

      {selected && (
        <p className="text-2xl font-bold tabular-nums text-ppa-navy">
          {formatMoney(selected.price)}
        </p>
      )}

      <button
        type="button"
        onClick={checkout}
        disabled={!buyable || pending}
        className="mt-4 w-full bg-ppa-blue px-6 py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ppa-blue-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ppa-navy focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-ppa-navy/25"
      >
        {pending ? "Taking you to checkout…" : buyable ? "Buy Now" : "Sold Out"}
      </button>

      {error && (
        <p role="alert" className="mt-3 text-sm text-ppa-live">
          {error}
        </p>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-ppa-navy/45">
        Checkout is handled securely by Shopify. Fulfilled by Pickleball Central.
      </p>
    </div>
  );
}
