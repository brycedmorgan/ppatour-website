"use client";

import { useState } from "react";

const BUDGETS = [
  "Under $50K",
  "$50K – $250K",
  "$250K – $1M",
  "$1M+",
  "Not sure yet",
];

/**
 * Sponsorship inquiry form. Submissions POST to /api/sponsor-inquiry, which
 * creates a deal under Leads in the internal sales pipeline — no mailto.
 */
export function SponsorInquiryForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(
    "idle",
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    if (data.website) return; // honeypot — bots fill every field
    setStatus("sending");
    try {
      const res = await fetch("/api/sponsor-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("done");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="border border-ppa-line bg-white p-8 text-center sm:p-10">
        <p className="font-display text-2xl uppercase text-ppa-navy">
          We&apos;re on it.
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ppa-navy/60">
          Your inquiry is in front of our partnerships team. Expect a custom
          plan and the full 2026–27 media kit within five business days.
        </p>
      </div>
    );
  }

  const field =
    "h-11 w-full border border-ppa-line bg-white px-3.5 text-sm text-ppa-navy placeholder:text-ppa-navy/35 focus:border-ppa-blue focus:outline-none";
  const label =
    "text-[11px] font-bold uppercase tracking-[0.14em] text-ppa-navy/55";

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      {/* Honeypot — hidden from real users */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
      />

      <div>
        <label className={label} htmlFor="spi-company">
          Company *
        </label>
        <input id="spi-company" name="company" required maxLength={120} className={`mt-1.5 ${field}`} placeholder="Your brand" />
      </div>
      <div>
        <label className={label} htmlFor="spi-name">
          Your name *
        </label>
        <input id="spi-name" name="name" required maxLength={120} className={`mt-1.5 ${field}`} placeholder="First and last" />
      </div>
      <div>
        <label className={label} htmlFor="spi-email">
          Work email *
        </label>
        <input id="spi-email" name="email" type="email" required maxLength={160} className={`mt-1.5 ${field}`} placeholder="you@company.com" />
      </div>
      <div>
        <label className={label} htmlFor="spi-phone">
          Phone
        </label>
        <input id="spi-phone" name="phone" type="tel" maxLength={40} className={`mt-1.5 ${field}`} placeholder="Optional" />
      </div>
      <div>
        <label className={label} htmlFor="spi-category">
          Industry / category
        </label>
        <input id="spi-category" name="category" maxLength={80} className={`mt-1.5 ${field}`} placeholder="e.g. Insurance, Beverage, Banking" />
      </div>
      <div>
        <label className={label} htmlFor="spi-budget">
          Annual budget range
        </label>
        <select id="spi-budget" name="budget" defaultValue="" className={`mt-1.5 ${field}`}>
          <option value="" disabled>
            Select a range
          </option>
          {BUDGETS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className={label} htmlFor="spi-message">
          What are you hoping to accomplish?
        </label>
        <textarea
          id="spi-message"
          name="message"
          rows={4}
          maxLength={2000}
          className="mt-1.5 w-full border border-ppa-line bg-white px-3.5 py-2.5 text-sm text-ppa-navy placeholder:text-ppa-navy/35 focus:border-ppa-blue focus:outline-none"
          placeholder="Goals, timing, markets — anything that helps us tailor the plan."
        />
      </div>

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={status === "sending"}
          className="group inline-flex h-12 w-full items-center justify-center gap-1.5 bg-ppa-blue px-8 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-ppa-blue-deep active:scale-[0.98] disabled:opacity-60 sm:w-auto"
        >
          {status === "sending" ? "Sending…" : "Start the Conversation"}
          <span
            aria-hidden
            className="transition-transform duration-300 group-hover:translate-x-0.5"
          >
            →
          </span>
        </button>
        {status === "error" && (
          <p className="mt-3 text-xs text-red-600">
            Something went wrong — try again, or email{" "}
            <a href="mailto:partnerships@ppatour.com" className="underline">
              partnerships@ppatour.com
            </a>
            .
          </p>
        )}
      </div>
    </form>
  );
}
