import Link from "next/link";
import { requireEditor } from "@/lib/newsroom/auth";
import { NEWSROOM_PATH } from "@/lib/newsroom/session";
import { Rail } from "../_components/Rail";

export const dynamic = "force-dynamic";

export default async function NewsroomAppLayout({ children }: { children: React.ReactNode }) {
  const { sub } = await requireEditor();
  return (
    <>
      <Rail editor={sub} />
      <div className="md:pl-16">
        {/* Brand bar: the site header's wordmark, so every screen reads as PPA Tour. */}
        <header className="border-b border-ppa-line bg-white">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-8">
            <Link href={`${NEWSROOM_PATH}/`} className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/ppa/logos/ppa-horizontal-blue.svg"
                alt="Carvana PPA Tour"
                width={1408}
                height={149}
                className="h-4 w-auto sm:h-5"
              />
              <span aria-hidden className="h-5 w-px bg-ppa-line" />
              <span className="font-display text-sm uppercase tracking-[0.12em] text-ppa-blue">
                Newsroom
              </span>
            </Link>
            <span className="ml-auto hidden truncate text-xs text-ppa-navy/55 sm:block">
              Signed in as {sub}
            </span>
          </div>
          <span aria-hidden className="block h-1 bg-ppa-blue" />
        </header>
        <div className="px-4 pb-24 pt-8 md:px-8 md:pb-12">
          <div className="mx-auto max-w-6xl">{children}</div>
        </div>
      </div>
    </>
  );
}
