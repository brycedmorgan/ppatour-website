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
      <p className="text-xs font-bold uppercase tracking-widest text-ppa-red">
        Coming Soon
      </p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ppa-navy sm:text-5xl">
        {title}
      </h1>
      <p className="mt-3 max-w-md text-zinc-500">{blurb}</p>
      <Link
        href="/"
        className="mt-7 flex h-12 items-center justify-center rounded-lg bg-ppa-navy px-6 font-bold text-white transition-colors hover:bg-ppa-navy-light"
      >
        Back to Home
      </Link>
    </section>
  );
}
