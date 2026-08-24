import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BuyPanel } from "@/components/shop/BuyPanel";
import { getShopProduct, getShopProductHandles, shopHref } from "@/lib/shop";
import { SITE_URL } from "@/lib/site";

export const revalidate = 300;

type Params = { params: Promise<{ handle: string }> };

/**
 * Prerender the catalogue. Returns [] when the shop is unconfigured, so an
 * unconfigured deploy builds no product pages at all rather than a set of
 * empty ones — and `dynamicParams` then lets a product published after the
 * build render on first request instead of 404ing until the next deploy.
 */
export async function generateStaticParams() {
  const handles = await getShopProductHandles();
  return handles.map((handle) => ({ handle }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { handle } = await params;
  const product = await getShopProduct(handle);
  if (!product) return { title: "Shop" };

  return {
    title: product.title,
    // Shopify's own copy, truncated at source. Never a generated blurb — the
    // merchandiser wrote the description and it is the one Google should read.
    description:
      product.description ||
      `${product.title} — official Carvana PPA Tour gear.`,
    alternates: { canonical: `${SITE_URL}${shopHref(handle)}/` },
    openGraph: product.image
      ? { images: [{ url: product.image.url, alt: product.image.alt }] }
      : undefined,
  };
}

export default async function ShopProductPage({ params }: Params) {
  const { handle } = await params;
  const product = await getShopProduct(handle);
  if (!product) notFound();

  const hero = product.images[0] ?? product.image;
  const gallery = product.images.slice(1, 5);

  return (
    <section className="bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <nav aria-label="Breadcrumb" className="mb-6 text-[11px] font-bold uppercase tracking-[0.16em] text-ppa-navy/45">
          <Link href="/shop" className="hover:text-ppa-blue">
            Shop
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <span className="text-ppa-navy/70">{product.title}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2">
          {/* ------------------------------------------------- Imagery */}
          <div>
            <div className="relative aspect-square w-full overflow-hidden border border-ppa-line bg-ppa-paper">
              {hero ? (
                <Image
                  src={hero.url}
                  alt={hero.alt}
                  fill
                  sizes="(min-width:1024px) 50vw, 100vw"
                  priority
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/35">
                    Photo Coming
                  </span>
                </div>
              )}
            </div>

            {gallery.length > 0 && (
              <ul className="mt-3 grid grid-cols-4 gap-3">
                {gallery.map((img) => (
                  <li
                    key={img.url}
                    className="relative aspect-square overflow-hidden border border-ppa-line bg-ppa-paper"
                  >
                    <Image src={img.url} alt={img.alt} fill sizes="12vw" className="object-cover" />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* -------------------------------------------------- Detail */}
          <div>
            {product.vendor && (
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/45">
                {product.vendor}
              </p>
            )}
            <h1 className="mt-2 font-display text-2xl uppercase leading-[1.05] text-ppa-navy sm:text-3xl">
              {product.title}
            </h1>

            <BuyPanel variants={product.variants} available={product.available} />

            {product.descriptionHtml && (
              <div
                className="prose-shop mt-8 border-t border-ppa-line pt-6 text-sm leading-relaxed text-ppa-navy/70 [&_a]:text-ppa-blue [&_a]:underline [&_li]:mt-1 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5"
                /**
                 * Shopify sanitises product descriptions on its own side and
                 * only staff can author them, so this is first-party copy, not
                 * user input. It is still the one place on this page where
                 * markup comes from outside the repo — keep it that way.
                 */
                dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
              />
            )}
          </div>
        </div>

        <div className="mt-12 border-t border-ppa-line pt-6">
          <Link
            href="/shop"
            className="text-xs font-bold uppercase tracking-[0.12em] text-ppa-blue hover:text-ppa-blue-deep"
          >
            ← All gear
          </Link>
        </div>
      </div>
    </section>
  );
}
