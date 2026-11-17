import { redirect } from "next/navigation";
import { getSession } from "@/lib/newsroom/auth";
import { NEWSROOM_PATH } from "@/lib/newsroom/session";
import { LoginForm } from "../_components/LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in" };

export default async function NewsroomLoginPage() {
  if (await getSession()) redirect(`${NEWSROOM_PATH}/`);
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center bg-ppa-navy font-display text-sm text-white">
            PPA
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-blue">
              PPA Tour
            </p>
            <h1 className="font-display text-2xl uppercase leading-none">Newsroom</h1>
          </div>
        </div>
        <LoginForm />
        <p className="mt-4 text-xs text-ppa-navy/55">
          Sign-in with your pickleball.com account is coming. Ask Wesley for a login until then.
        </p>
      </div>
    </div>
  );
}
