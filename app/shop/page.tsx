import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { formatMoney, getShopProducts, shopHref, type ShopProduct } from "@/lib/shop";

/**
 * ISR, same 5 minutes as the catalogue's Data Cache tag. The two numbers are
 * deliberately equal — a longer page revalidate than data revalidate means the
 * HTML can advertise a sold-out item as available, which on a commerce page is
 * a customer-facing lie rather than a stale stat.
 */
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Official Carvana PPA Tour gear — tour-issue apparel, headwear and accessories, shipped from Pickleball Central.",
};

function ProductCard({ p }: { p: ShopProduct }) {
  const price = formatMoney(p.from);
  return (
    <li data-reveal>
      <Link
        href={shopHref(p.handle)}
        className="group flex h-full flex-col border border-ppa-line bg-white transition-colors hover:border-ppa-blue"
      >
        <div className="relative aspect-square w-full overflow-hidden bg-ppa-paper">
          {p.image ? (
            <Image
              src={p.image.url}
              alt={p.image.alt}
              fill
              sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"
              className="object-cover transition-transform duration-500 will-change-transform group-hover:scale-[1.03]"
            />
          ) : (
            /* No photo is a real state — a merchandiser can publish before the
               shot lands. A labelled placeholder beats a broken image frame. */
            <div className="flex h-full items-center justify-center">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/35">
                Photo Coming
              </span>
            </div>
          )}
          {!p.available && (
            <span className="absolute left-0 top-0 bg-ppa-navy px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
              Sold Out
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h2 className="font-display text-sm uppercase leading-tight text-ppa-navy group-hover:text-ppa-blue">
            {p.title}
          </h2>
          {p.vendor && (
            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
              {p.vendor}
            </p>
          )}
          {/* Price is omitted, never zeroed, when Shopify didn't return one. */}
          {price && (
            <p className="mt-auto pt-3 text-sm font-bold tabular-nums text-ppa-navy">{price}</p>
          )}
        </div>
      </Link>
    </li>
  );
}

export default async function ShopPage() {
  const products = await getShopProducts();

  return (
    <>
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">Shop</p>
          </div>
          <h1 className="mt-2 max-w-3xl font-display text-3xl uppercase leading-[1.02] sm:text-4xl">
            Official PPA Tour Gear
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ppa-navy/60">
            Tour-issue apparel and accessories, the same kit worn on Championship
            Sunday. Fulfilled by Pickleball Central, the official store of the PPA Tour.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          {products.length > 0 ? (
            <ul
              data-reveal
              data-reveal-group
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
            >
              {products.map((p) => (
                <ProductCard key={p.handle} p={p} />
              ))}
            </ul>
          ) : (
            /**
             * ⚠ THE HOLDING STATE IS THE POINT, NOT A FALLBACK. This renders for
             * three different causes — no Storefront token, no published
             * products, or Shopify unreachable — and deliberately says the same
             * true thing for all three. The alternative every early draft of a
             * page like this ships is an empty grid under a heading that
             * promises gear, which reads as broken. Same call as "Tickets
             * Coming Soon" on a stop we're holding back.
             */
            <div className="border border-ppa-line bg-ppa-paper px-6 py-16 text-center">
              <p className="font-display text-xl uppercase text-ppa-navy">The shop opens soon</p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ppa-navy/60">
                Official tour gear is on its way. In the meantime, paddles and
                equipment are at Pickleball Central.
              </p>
              <Link
                href="/about/sponsors"
                className="mt-6 inline-block bg-ppa-blue px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ppa-blue-deep"
              >
                Our Official Partners
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
