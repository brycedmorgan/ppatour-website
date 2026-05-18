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
    <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-24 text-center sm:py-36">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-ppa-yellow">
        Coming Soon
      </p>
      <h1 className="mt-4 font-display text-5xl font-bold uppercase tracking-tight text-white sm:text-7xl">
        {title}
      </h1>
      <p className="mt-4 max-w-md text-white/55">{blurb}</p>
      <Link
        href="/"
        className="mt-8 flex h-13 items-center justify-center bg-ppa-red px-7 font-display text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-ppa-red-dark"
      >
        Back to Home
      </Link>
    </section>
  );
}
