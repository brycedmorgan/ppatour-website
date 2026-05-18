"use client";

import { useState } from "react";

type Variant = "fan" | "amateur" | "streaming";

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
};

/**
 * Email capture surface (§9.8). Email is the moat — every page has one.
 * Posts to /api/lead-capture (stub → Customer.io once credentials land).
 */
export function LeadMagnetCapture({ variant = "fan" }: { variant?: Variant }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const copy = COPY[variant];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/lead-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, variant }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-ppa-red">
        {copy.eyebrow}
      </p>
      <h3 className="mt-3 font-display text-4xl uppercase leading-[0.95] text-white sm:text-6xl">
        {copy.heading}
      </h3>
      <p className="mt-3 max-w-md text-white/55">
        When the checkout lives off-site, email is how we keep you close.
        No spam — just the matches, drops, and dates that matter.
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
            className="h-13 flex-1 border border-white/15 bg-white/5 px-4 text-white placeholder:text-white/40 focus:border-ppa-red focus:outline-none"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="h-13 bg-ppa-red px-7 text-sm font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ppa-red-dark disabled:opacity-60"
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
