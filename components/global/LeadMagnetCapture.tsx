"use client";

import { useState } from "react";

type Variant = "fan" | "amateur" | "streaming";

const COPY: Record<Variant, { eyebrow: string; heading: string; cta: string }> = {
  fan: {
    eyebrow: "Free Fan Guide",
    heading: "Your First PPA Event — what to know before you go",
    cta: "Send it to me",
  },
  amateur: {
    eyebrow: "Free Player Guide",
    heading: "5 Mistakes to Avoid at Your First Tournament",
    cta: "Get the guide",
  },
  streaming: {
    eyebrow: "Never Miss a Match",
    heading: "Get streaming reminders for every PPA Tour event",
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
    <div className="rounded-2xl bg-ppa-navy-light p-6 sm:p-8">
      <p className="text-xs font-bold uppercase tracking-widest text-ppa-yellow">
        {copy.eyebrow}
      </p>
      <h3 className="mt-2 text-xl font-extrabold text-white sm:text-2xl">
        {copy.heading}
      </h3>

      {status === "done" ? (
        <p className="mt-4 font-semibold text-ppa-yellow">
          You&apos;re on the list — check your inbox.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="h-12 flex-1 rounded-lg border border-white/15 bg-white/5 px-4 text-white placeholder:text-white/40 focus:border-ppa-yellow focus:outline-none"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="h-12 rounded-lg bg-ppa-red px-6 font-bold text-white transition-colors hover:bg-ppa-red-dark disabled:opacity-60"
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
