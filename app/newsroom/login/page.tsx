import { redirect } from "next/navigation";
import { getSession } from "@/lib/newsroom/auth";
import { NEWSROOM_PATH } from "@/lib/newsroom/session";
import { LoginForm } from "../_components/LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in" };

export default async function NewsroomLoginPage() {
  if (await getSession()) redirect(`${NEWSROOM_PATH}/`);
  return (
    <div className="grid min-h-screen md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* Brand panel: the site header's wordmark on navy, the tour's blue rule. */}
      <section className="relative flex flex-col justify-between overflow-hidden bg-ppa-navy px-8 py-10 text-white md:px-12 md:py-14">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/ppa/logos/ppa-horizontal-white.svg"
          alt="Carvana PPA Tour"
          width={1408}
          height={149}
          className="h-6 w-auto self-start md:h-7"
        />
        <div className="mt-16 md:mt-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ppa-sky">
            ppatour.com
          </p>
          <h1 className="mt-2 font-display text-5xl uppercase leading-[0.9] md:text-6xl xl:text-7xl">
            Newsroom
          </h1>
          <p className="mt-4 max-w-sm text-sm text-white/70">
            Write and publish PPA Tour news, and choose the pickleball.com stories on the home page.
          </p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon.svg"
          alt=""
          aria-hidden
          className="pointer-events-none absolute -bottom-10 -right-10 hidden w-72 opacity-10 md:block"
        />
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-1.5 bg-ppa-blue" />
      </section>

      <section className="flex items-center justify-center bg-ppa-paper px-4 py-12">
        <div className="w-full max-w-sm">
          <h2 className="mb-4 font-display text-2xl uppercase">Sign in</h2>
          <LoginForm />
          <p className="mt-4 text-xs text-ppa-navy/55">
            Sign-in with your pickleball.com account is coming. Ask Wesley for a login until then.
          </p>
        </div>
      </section>
    </div>
  );
}
