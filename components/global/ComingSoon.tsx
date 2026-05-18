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
    <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-28 text-center sm:py-40">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-ppa-red">
        Coming Soon
      </p>
      <h1 className="mt-5 font-display text-6xl uppercase leading-[0.95] sm:text-8xl">
        {title}
      </h1>
      <p className="mt-5 max-w-md text-ppa-ink/55">{blurb}</p>
      <Link
        href="/"
        className="mt-9 inline-flex h-12 items-center bg-ppa-ink px-7 text-sm font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ppa-red"
      >
        Back to Home
      </Link>
    </section>
  );
}
