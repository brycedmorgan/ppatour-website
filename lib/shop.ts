/**
 * The PPA Tour shop catalogue, read from Shopify's Storefront API.
 *
 * ⚠ THIS IS THE SITE'S SECOND COMMERCE SURFACE AND IT IS A DELIBERATE EXCEPTION.
 * The founding rule in CLAUDE.md is that ppatour.com is the content/discovery
 * layer and commerce redirects out — no cart, no embedded checkout. `/vacations`
 * was the first documented exception; `/shop` is the second, on Bryce's call.
 * The line held in both cases is the same one: **checkout is HOSTED**. We create
 * a Shopify cart and hand the shopper to Shopify's own checkout, exactly as
 * Vacations hands off to Stripe. No card data touches this app, and nothing here
 * should be read as permission to build a native cart.
 *
 * ⚠ NOTHING IN THIS FILE HARDCODES A PRODUCT. Every title, price, image and
 * availability figure comes from Shopify at render time. A price typed into this
 * repo is a price that can disagree with the one the customer is charged, which
 * is the trap `lib/vacations/trip-config.ts` documents from the other direction
 * (it holds prices precisely BECAUSE the Stripe line item reads the same object).
 * Here Shopify owns both, so the repo owns neither.
 */

import { SHOP_CACHE_TAG, SHOP_REVALIDATE, shopConfigured, shopifyQuery } from "@/lib/shopify";

export type ShopMoney = { amount: number; currency: string };

export type ShopImage = {
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
};

export type ShopVariant = {
  id: string;
  title: string;
  available: boolean;
  price: ShopMoney;
  options: { name: string; value: string }[];
};

export type ShopProduct = {
  handle: string;
  title: string;
  /** Plain-text, already trimmed by Shopify. Used for meta + search body. */
  description: string;
  vendor: string;
  productType: string;
  tags: string[];
  available: boolean;
  from: ShopMoney | null;
  image: ShopImage | null;
};

export type ShopProductDetail = ShopProduct & {
  descriptionHtml: string;
  images: ShopImage[];
  variants: ShopVariant[];
  options: { name: string; values: string[] }[];
};

/* ────────────────────────────── shaping ────────────────────────────── */

type RawMoney = { amount: string; currencyCode: string } | null | undefined;
type RawImage = { url: string; altText: string | null; width: number | null; height: number | null } | null | undefined;

function money(m: RawMoney): ShopMoney | null {
  if (!m) return null;
  const amount = Number(m.amount);
  return Number.isFinite(amount) ? { amount, currency: m.currencyCode } : null;
}

/**
 * ⚠ ALT TEXT FALLS BACK TO THE PRODUCT TITLE, NEVER TO AN EMPTY STRING. A
 * merchandiser who leaves alt blank in Shopify should not silently ship an
 * unlabelled image — the product name is always a true description of its own
 * photo, and this site already carries an accessibility widget for a reason.
 */
function image(i: RawImage, productTitle: string): ShopImage | null {
  if (!i?.url) return null;
  return {
    url: i.url,
    alt: i.altText?.trim() || productTitle,
    width: i.width ?? null,
    height: i.height ?? null,
  };
}

type RawProduct = {
  handle: string;
  title: string;
  description: string;
  descriptionHtml?: string;
  vendor: string;
  productType: string;
  tags: string[];
  availableForSale: boolean;
  priceRange?: { minVariantPrice: RawMoney };
  featuredImage?: RawImage;
  images?: { nodes: RawImage[] };
  options?: { name: string; values: string[] }[];
  variants?: {
    nodes: {
      id: string;
      title: string;
      availableForSale: boolean;
      price: RawMoney;
      selectedOptions: { name: string; value: string }[];
    }[];
  };
};

function toProduct(p: RawProduct): ShopProduct {
  return {
    handle: p.handle,
    title: p.title,
    description: p.description ?? "",
    vendor: p.vendor ?? "",
    productType: p.productType ?? "",
    tags: p.tags ?? [],
    available: Boolean(p.availableForSale),
    from: money(p.priceRange?.minVariantPrice),
    image: image(p.featuredImage, p.title),
  };
}

/* ────────────────────────────── queries ────────────────────────────── */

const PRODUCT_CARD_FIELDS = `
  handle
  title
  description(truncateAt: 300)
  vendor
  productType
  tags
  availableForSale
  priceRange { minVariantPrice { amount currencyCode } }
  featuredImage { url altText width height }
`;

const PRODUCTS_QUERY = `
  query ShopProducts($first: Int!) {
    products(first: $first, sortKey: BEST_SELLING) {
      nodes { ${PRODUCT_CARD_FIELDS} }
    }
  }
`;

const PRODUCT_QUERY = `
  query ShopProduct($handle: String!) {
    product(handle: $handle) {
      ${PRODUCT_CARD_FIELDS}
      descriptionHtml
      images(first: 8) { nodes { url altText width height } }
      options { name values }
      variants(first: 50) {
        nodes {
          id
          title
          availableForSale
          price { amount currencyCode }
          selectedOptions { name value }
        }
      }
    }
  }
`;

const HANDLES_QUERY = `
  query ShopHandles($first: Int!) {
    products(first: $first) { nodes { handle } }
  }
`;

/**
 * The full catalogue, best-sellers first.
 *
 * Returns [] — never throws — when the shop is unconfigured or unreachable, so
 * every caller can treat "no products" as one state instead of two.
 */
export async function getShopProducts(limit = 60): Promise<ShopProduct[]> {
  if (!shopConfigured()) return [];
  const data = await shopifyQuery<{ products: { nodes: RawProduct[] } }>(PRODUCTS_QUERY, {
    variables: { first: Math.min(limit, 250) },
    revalidate: SHOP_REVALIDATE,
    tags: [SHOP_CACHE_TAG],
  });
  return (data?.products?.nodes ?? []).map(toProduct);
}

/** One product by handle. Null when missing, unpublished, or the shop is down. */
export async function getShopProduct(handle: string): Promise<ShopProductDetail | null> {
  if (!shopConfigured()) return null;
  const data = await shopifyQuery<{ product: RawProduct | null }>(PRODUCT_QUERY, {
    variables: { handle },
    revalidate: SHOP_REVALIDATE,
    tags: [SHOP_CACHE_TAG],
  });
  const p = data?.product;
  if (!p) return null;

  return {
    ...toProduct(p),
    descriptionHtml: p.descriptionHtml ?? "",
    images: (p.images?.nodes ?? []).map((i) => image(i, p.title)).filter((i): i is ShopImage => i !== null),
    options: p.options ?? [],
    variants: (p.variants?.nodes ?? []).map((v) => ({
      id: v.id,
      title: v.title,
      available: Boolean(v.availableForSale),
      price: money(v.price) ?? { amount: 0, currency: "USD" },
      options: v.selectedOptions ?? [],
    })),
  };
}

/** Handles only — for `generateStaticParams` and the sitemap. */
export async function getShopProductHandles(limit = 250): Promise<string[]> {
  if (!shopConfigured()) return [];
  const data = await shopifyQuery<{ products: { nodes: { handle: string }[] } }>(HANDLES_QUERY, {
    variables: { first: Math.min(limit, 250) },
    revalidate: SHOP_REVALIDATE,
    tags: [SHOP_CACHE_TAG],
  });
  return (data?.products?.nodes ?? []).map((n) => n.handle).filter(Boolean);
}

/* ────────────────────────────── display ────────────────────────────── */

export function formatMoney(m: ShopMoney | null): string | null {
  if (!m) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: m.currency,
    // Whole dollars read cleaner on a card; cents still show when they exist.
    minimumFractionDigits: Number.isInteger(m.amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(m.amount);
}

export const shopHref = (handle: string) => `/shop/${handle}`;
