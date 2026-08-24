# ppatour.com/shop — headless Shopify storefront

Bryce's call, 2026-08-19: the PPA Tour store is built **into** ppatour.com, not
beside it. Shopify owns products, inventory, orders and checkout; this site
renders the pages.

---

## ⚠ Read this before doing anything else

**A PPA Tour store already exists, and it is not ours.**

Pickleball Central runs a live **"PPA Tour Store"** at
`pickleballcentral.com/apparel/ppa-tour-apparel/` — 10 products (PPA Jacquard
Pom, PPA Heywood Fleece, PPA Buxton Fleece Zip, PPA Pros Comfy T-Shirt and
others), under the line *"Pickleball Central is the official retailer of the PPA
Tour."* PBC is a Gold partner carrying the **Official Store** designation.

**ppatour.com's header already links to it.** `components/global/Header.tsx:59`
is a nav item labelled **Shop** pointing at that PBC page with
`utm_content=header-shop`. The footer carries a second one
(`SiteFooter.tsx:50`).

That link has **deliberately not been touched.** Repointing "Shop" from an
official partner's store to a tour-run one moves revenue away from a partner
who holds a contractual designation. That is a commercial decision for Bryce and
Connor, not a routing change. Until it is made:

- `/shop` is live and works, but **nothing in the global nav points at it**.
- It is reachable by direct URL and by site search once products exist.

**Three ways this resolves. Pick one before launch:**

1. **PBC's Shopify is the backend.** `/shop` is the PPA-branded front end over
   PBC's existing catalogue. Nothing competes, PBC keeps fulfilment and the
   customer file, and the tour gets the domain and the design. Blocked on access
   to PBC's Shopify — it is **not** in the Pickleball Holdings LLC org.
2. **The tour runs its own store** and the header link repoints. Cleanest
   ownership of the customer file, and a conversation with PBC.
3. **Both, split by catalogue.** PBC keeps existing merch; `/shop` carries only
   a new co-branded line (see the Vuori work). Two stores, one nav item, and a
   rule for which product goes where.

---

## How it works

| Piece | File |
|---|---|
| Storefront API client (retry, cache, fail-safe) | `lib/shopify.ts` |
| Catalogue queries + shaping | `lib/shop.ts` |
| Listing page | `app/shop/page.tsx` |
| Product page | `app/shop/[handle]/page.tsx` |
| Variant picker + checkout handoff | `components/shop/BuyPanel.tsx` |
| Hosted-checkout route | `app/api/shop/checkout/route.ts` |
| Search integration | `lib/site-search.ts` (`"Shop"` group) |
| Sitemap entries | `app/sitemap.ts` |
| Shopify CDN allowlist | `next.config.ts` (`cdn.shopify.com`) |

### Checkout is hosted, and stays hosted

The site's founding rule is that commerce redirects out — no cart, no embedded
checkout. `/vacations` was the first documented exception and holds the line by
handing off to Stripe's hosted page. `/shop` does the same with Shopify's.

`POST /api/shop/checkout/` takes a **variant id and a quantity, nothing else**,
builds a one-line Shopify cart server-side and returns `checkoutUrl`. The
browser then leaves. No card data, no addresses and no order state ever reach
this app. **The client never sends a price** — Shopify prices the cart from its
own record, which makes the classic storefront exploit unrepresentable rather
than merely validated.

There is no persistent basket, and adding one would cross the line above.

### It fails safe, in one direction

No token, an unknown API version, a 429, a network blip and an empty catalogue
all resolve to the same thing: `getShopProducts()` returns `[]`, `/shop` renders
its holding state (*"The shop opens soon"*), no product pages are built, no
`/shop` URLs enter the sitemap, and the Shop search group disappears.

That is deliberate. An empty product grid under a heading promising gear reads
as broken; the holding state reads as true. Same call as *"Tickets Coming Soon"*
on a stop we are holding back.

---

## Configuration

Three environment variables, none of them set today:

| Var | Notes |
|---|---|
| `SHOPIFY_STORE_DOMAIN` | `ppa-tour-store` or `ppa-tour-store.myshopify.com` — both accepted |
| `SHOPIFY_STOREFRONT_TOKEN` | Public Storefront API access token from a Shopify custom app |
| `SHOPIFY_API_VERSION` | Optional. Defaults to `2026-07` |

**⚠ Verify `SHOPIFY_API_VERSION` against the store.** Shopify ships a Storefront
API version quarterly and supports each for a year. `2026-07` is the default and
is **unverified** — nobody has run a query against a real store yet. An
unrecognised version is rejected outright, and under the fail-safe above that
surfaces as an empty shop, which looks exactly like "no products published yet".
If the shop renders its holding state with a token set, check this first.

### Getting the token

In the Shopify admin: **Settings → Apps and sales channels → Develop apps →
Create an app → Configure Storefront API scopes**. Needs
`unauthenticated_read_product_listings` and `unauthenticated_write_checkouts`.
Install the app, then copy the **Storefront API access token** (not the Admin
API one).

### Cache invalidation

Catalogue reads are tagged `SHOP_CACHE_TAG` (`shopify-catalog`) with a 5-minute
revalidate. A Shopify `products/update` webhook pointed at a route calling
`revalidateTag("shopify-catalog")` would make edits appear immediately. **Not
built** — the 5-minute window is fine until someone is merchandising live.

The page `revalidate` and the data revalidate are both **300 seconds on purpose**.
A longer page revalidate than data revalidate means the HTML can advertise a
sold-out item as available, which on a commerce page is a customer-facing lie
rather than a stale stat. Change them together.

---

## Verified 2026-08-19

Against a real production build and server on :3210, with **no Shopify env vars
set** — i.e. the fail-safe path, which is the one that ships today:

- `/shop/` **200**, renders "Official PPA Tour Gear" and the holding state
- `/shop/nonexistent-product/` **404** (not a blank product page)
- `POST /api/shop/checkout/` **503** with *"The shop is not open yet."*
- `/sitemap.xml` **200**, **zero** `/shop` URLs
- `/search/?q=polo` **200**; `?q=nationals` still returns Athletes, Events, News
  — the shop source failing does not take site search down with it
- `next build` green, `tsc` clean, `eslint` clean on all eight changed files

**Not yet verified, because it needs a configured store:** any query actually
returning a product, the API version, image rendering off `cdn.shopify.com`, and
the checkout handoff itself.
