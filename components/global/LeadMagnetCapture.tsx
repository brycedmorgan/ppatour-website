"use client";

import { useState } from "react";

type Variant = "fan" | "amateur" | "streaming" | "junior";

const COPY: Record<Variant, { eyebrow: string; heading: string; cta: string }> = {
  fan: {
    eyebrow: "Free Fan Guide",
    heading: "Your First PPA Event",
    cta: "Send it",
  },
  amateur: {
    eyebrow: "Free Player Guide",
    heading: "5 Mistakes at Your First Tournament",
    cta: "Get the guide",
  },
  streaming: {
    eyebrow: "Never Miss a Match",
    heading: "Streaming Reminders for Every Event",
    cta: "Notify me",
  },
  /**
   * Junior PPA (Daniela Almendarez, 9/3 — the "Newsletter" line in her Stay
   * Connected section). Its own variant rather than reusing `amateur`: the
   * variant is sent to Customer.io as `website_lead_variant`, so it is what
   * lets a Junior PPA signup be segmented and welcomed differently from an
   * adult amateur. Reusing another variant would file juniors' parents into
   * the wrong flow.
   */
  junior: {
    eyebrow: "Junior PPA Newsletter",
    heading: "Events, Announcements and Junior PPA News",
    cta: "Sign up",
  },
};

/**
 * Email capture surface (§9.8). Email is the moat — every page has one.
 * Posts to /api/lead-capture, which identifies the lead in Customer.io and
 * records `website_lead_capture` carrying this `variant`.
 *
 * ⚠ THIS COMPONENT ONLY WORKS ON A DARK GROUND, AND TWO CALL SITES PROVED IT
 * THE HARD WAY (9/8). The heading is `text-white`, the body `text-white/55`
 * and the input carries a white border — it draws no background of its own, so
 * on white or `ppa-paper` the heading and the reassurance copy are invisible
 * and all a visitor sees is a floating blue button. That is exactly how it
 * shipped on /europe and /game until Payton Pemberton reported it. Fifteen of
 * the seventeen call sites wrap it in a `bg-ppa-navy*` section for this reason;
 * the Junior page mounts it as a navy card inside a white section. If it ever
 * needs a light treatment, that is a change in here, not a class on a wrapper.
 */
export function LeadMagnetCapture({
  variant = "fan",
  region,
}: {
  variant?: Variant;
  /**
   * Marks the signup as belonging to a region so email can be targeted at it.
   * Payton Pemberton, 9/8: PPA Tour Europe wants its signups "designated as
   * European so we can target our email campaigns". Lands in Customer.io as the
   * person attribute `website_lead_region` — a stable field to segment on,
   * unlike `website_lead_page`, which is overwritten by whatever page that
   * person last signed up from.
   */
  region?: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const copy = COPY[variant];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/lead-capture/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          variant,
          region,
          page: window.location.pathname,
        }),
      });
      if (res.ok) {
        window.gtag?.("event", "generate_lead", { variant, region });
        window.fbq?.("track", "Lead", { variant, region });
      }
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ppa-sky">
        {copy.eyebrow}
      </p>
      <h3 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-white sm:text-3xl">
        {copy.heading}
      </h3>
      {/* Dave Rogers 7/27: "when the checkout lives off-site" meant nothing to
          a reader — it was internal language about our commerce partners. */}
      <p className="mt-2 max-w-md text-sm text-white/55">
        No spam — just the matches, ticket drops, and dates that matter,
        straight to your inbox.
      </p>

      {status === "done" ? (
        <p className="mt-6 font-bold uppercase tracking-wide text-ppa-yellow">
          You&apos;re on the list — check your inbox.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 flex max-w-md flex-col gap-3 sm:flex-row">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="h-11 flex-1 border border-white/15 bg-white/5 px-4 text-white placeholder:text-white/40 focus:border-ppa-blue focus:outline-none"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="h-11 bg-ppa-blue px-7 text-sm font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ppa-blue-deep disabled:opacity-60"
          >
            {status === "loading" ? "Sending…" : copy.cta}
          </button>
        </form>
      )}
      {status === "error" && (
        <p className="mt-3 text-sm text-ppa-yellow">
          Something went wrong — please try again.
        </p>
      )}
    </div>
  );
}
