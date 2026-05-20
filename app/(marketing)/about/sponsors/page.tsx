import type { Metadata } from "next";
import Image from "next/image";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";
import { partners } from "@/lib/home-content";

export const metadata: Metadata = { title: "Sponsors" };

export default function SponsorsPage() {
  const title = partners.find((p) => p.tier === "title")!;
  const officials = partners.filter((p) => p.tier === "official");

  return (
    <>
      {/* Header */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
              Partners
            </p>
          </div>
          <h1 className="mt-2 font-display text-3xl uppercase leading-[1.02] sm:text-4xl">
            The Brands Powering the Tour
          </h1>
          <p className="mt-3 max-w-xl text-sm text-ppa-navy/55">
            Twenty-five main-tour stops, every broadcast, every court — built
            with our title partner and the official partners across health,
            equipment, nutrition, and performance.
          </p>
        </div>
      </section>

      {/* Title partner */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-blue">
            Title Partner
          </p>
          <div className="mt-3 relative isolate overflow-hidden border border-ppa-line bg-ppa-paper">
            <div className="absolute inset-x-0 top-0 h-1 bg-ppa-blue" />
            <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_1.4fr] lg:items-center">
              <div className="flex h-28 items-center justify-start sm:h-32">
                <Image
                  src={title.logo}
                  alt={title.name}
                  width={title.logoWidth}
                  height={title.logoHeight}
                  priority
                  className="max-h-full w-auto max-w-[320px] object-contain object-left sm:max-w-[400px]"
                />
              </div>
              <div>
                <p className="font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
                  {title.name}
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ppa-navy/65 sm:text-base">
                  {title.note}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Official partners */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
            Official Partners
          </p>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
            Category Leaders
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {officials.map((p) => (
              <div
                key={p.name}
                className="flex flex-col overflow-hidden border border-ppa-line bg-white"
              >
                <div className="flex h-24 items-center justify-center border-b border-ppa-line bg-white p-5">
                  <Image
                    src={p.logo}
                    alt={p.name}
                    width={p.logoWidth}
                    height={p.logoHeight}
                    className="max-h-full w-auto max-w-[180px] object-contain"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-blue">
                    {p.role}
                  </p>
                  <p className="mt-1 font-display text-lg uppercase leading-[1.1] text-ppa-navy">
                    {p.name}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ppa-navy/60">
                    {p.note}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Become a partner */}
      <section className="bg-ppa-navy">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 bg-ppa-blue" />
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
                  For Brands
                </p>
              </div>
              <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-white sm:text-3xl">
                Become a PPA Tour Partner
              </h2>
              <p className="mt-2 max-w-xl text-sm text-white/65">
                Title, presenting, and category-exclusive partnerships across
                25 main-tour stops, every broadcast, and a year-round
                consumer&nbsp;footprint.
              </p>
            </div>
            <a
              href="mailto:partnerships@ppatour.com"
              className="flex h-12 items-center justify-center bg-ppa-blue px-8 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ppa-blue-deep"
            >
              Partnership Inquiry →
            </a>
          </div>
        </div>
      </section>

      {/* Email */}
      <section className="bg-ppa-navy-deep">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <LeadMagnetCapture variant="fan" />
        </div>
      </section>
    </>
  );
}
