import Link from "next/link";

/** Branded placeholder for routes not yet built in this Phase 2 pass. */
export function ComingSoon({
  title,
  blurb,
}: {
  title: string;
  blurb: string;
}) {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-20 text-center sm:py-28">
      <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-ppa-blue">
        Coming Soon
      </p>
      <h1 className="mt-4 font-display text-3xl uppercase leading-[1.02] sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 max-w-md text-sm text-ppa-navy/55">{blurb}</p>
      <Link
        href="/"
        className="mt-7 inline-flex h-11 items-center bg-ppa-navy px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ppa-blue"
      >
        Back to Home
      </Link>
    </section>
  );
}
