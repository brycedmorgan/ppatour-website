"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  PRICING,
  formatUSD,
  isOccupancy,
  type Occupancy,
} from "@/lib/vacations/pricing";
import { track } from "@/lib/vacations/track";
import {
  BED_OPTIONS,
  GENDER_OPTIONS,
  SKILL_OPTIONS,
  emptyTraveler,
  validateRegistration,
  type BedType,
  type Traveler,
} from "@/lib/vacations/registration";
import { trip } from "@/lib/vacations/content";

const inputCls =
  "w-full border border-ppa-line bg-white px-4 py-3 text-sm text-ppa-navy placeholder:text-ppa-navy/35 transition focus:border-vac-teal focus:outline-none focus:ring-2 focus:ring-vac-teal/25";
const labelCls =
  "mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-ppa-navy/55";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  );
}

export function RegistrationForm({
  // Occupancies whose contracted rooms are gone, read from Stripe on the
  // server and passed down — the form can't reach Stripe itself, and a deep
  // link to a full room type shouldn't land on a bookable form.
  soldOutOptions = [],
}: {
  soldOutOptions?: Occupancy[];
}) {
  const isGone = (id: Occupancy) =>
    !!PRICING[id].soldOut || soldOutOptions.includes(id);

  const params = useSearchParams();
  const occParam = params.get("occupancy");
  const initialOcc: Occupancy =
    isOccupancy(occParam) && !isGone(occParam)
      ? occParam
      : isGone("double")
        ? "single"
        : "double";
  const canceled = params.get("canceled") === "1";

  const [occupancy, setOccupancy] = useState<Occupancy>(initialOcc);
  const [bedType, setBedType] = useState<BedType | "">("");
  const [travelers, setTravelers] = useState<Traveler[]>([
    emptyTraveler(),
    emptyTraveler(),
  ]);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const option = PRICING[occupancy];
  const count = option.travelers;

  const updateTraveler = (i: number, key: keyof Traveler, value: string) =>
    setTravelers((prev) =>
      prev.map((t, idx) => (idx === i ? { ...t, [key]: value } : t))
    );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      occupancy,
      bedType: occupancy === "double" ? bedType || undefined : undefined,
      travelers: travelers.slice(0, count),
    };
    const errs = validateRegistration(payload);
    if (errs.length > 0) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setErrors([]);
    setSubmitting(true);
    try {
      // Trailing slash matches `trailingSlash: true` and the other forms on
      // this site — without it the POST takes a 308 on the way in.
      const res = await fetch("/api/vacations/checkout/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        // 409 = the last room went while this form was open. Worth its own
        // event: a blocked checkout is demand we captured and couldn't fill.
        if (res.status === 409) track("checkout_blocked", { occupancy });
        setErrors([data.error ?? "Something went wrong. Please try again."]);
        setSubmitting(false);
        return;
      }
      if (data.url) {
        // Beacon before the redirect — sendBeacon survives the unload.
        track("checkout_start", { occupancy });
        window.location.href = data.url as string;
      } else {
        setErrors(["Could not start checkout. Please try again."]);
        setSubmitting(false);
      }
    } catch {
      setErrors(["Network error. Please check your connection and try again."]);
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-10 lg:grid-cols-[1.5fr_1fr]"
    >
      <div className="space-y-10">
        {canceled && (
          <p className="border-l-2 border-vac-teal bg-vac-sand px-4 py-3 text-sm text-ppa-navy/75">
            Your checkout was canceled — no payment was taken. Your details are
            below whenever you&apos;re ready.
          </p>
        )}

        {errors.length > 0 && (
          <div
            role="alert"
            className="border-l-2 border-ppa-live bg-ppa-live/5 px-5 py-4"
          >
            <p className="text-sm font-bold text-ppa-live-deep">
              Please fix the following:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ppa-navy/75">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Occupancy */}
        <fieldset>
          <legend className="font-display text-xl uppercase tracking-tight text-ppa-navy sm:text-2xl">
            1 · Choose your room
          </legend>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {(["single", "double"] as Occupancy[]).map((id) => {
              const o = PRICING[id];
              const active = occupancy === id;
              const gone = isGone(id);
              return (
                <button
                  type="button"
                  key={id}
                  disabled={gone}
                  aria-disabled={gone}
                  onClick={() => !gone && setOccupancy(id)}
                  className={`relative border-2 p-5 text-left transition-all ${
                    gone
                      ? "cursor-not-allowed border-ppa-line bg-ppa-paper opacity-70"
                      : active
                        ? "border-vac-teal bg-vac-sand"
                        : "border-ppa-line bg-white hover:border-ppa-navy/30"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-display text-base uppercase text-ppa-navy">
                      {o.label}
                    </span>
                    {gone ? (
                      <span className="bg-ppa-navy px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                        Sold Out
                      </span>
                    ) : (
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                          active ? "border-vac-teal bg-vac-teal" : "border-ppa-navy/25"
                        }`}
                      >
                        {active && (
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-ppa-navy/60">
                    {o.blurb}
                  </p>
                  <p className="mt-3 font-display text-2xl text-vac-teal-deep">
                    {formatUSD(o.total)}
                    {o.perPersonNote && (
                      <span className="ml-2 align-middle text-xs font-normal text-ppa-navy/55">
                        {o.perPersonNote}
                      </span>
                    )}
                  </p>
                </button>
              );
            })}
          </div>

          {occupancy === "double" && (
            <div className="mt-5">
              <span className={labelCls}>Bed preference</span>
              <div className="flex gap-3">
                {BED_OPTIONS.map((b) => (
                  <button
                    type="button"
                    key={b}
                    onClick={() => setBedType(b)}
                    className={`flex-1 border-2 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] transition-all sm:flex-none sm:px-8 ${
                      bedType === b
                        ? "border-vac-teal bg-vac-sand text-ppa-navy"
                        : "border-ppa-line text-ppa-navy/60 hover:border-ppa-navy/30"
                    }`}
                  >
                    {b} Beds
                  </button>
                ))}
              </div>
            </div>
          )}
        </fieldset>

        {/* Travelers */}
        <fieldset>
          <legend className="font-display text-xl uppercase tracking-tight text-ppa-navy sm:text-2xl">
            2 · Traveler details
          </legend>
          <p className="mt-2 text-sm text-ppa-navy/60">
            Enter names exactly as they appear on each traveler&apos;s passport.
          </p>

          <div className="mt-6 space-y-8">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="border border-ppa-line bg-ppa-paper p-6">
                <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.18em] text-vac-teal-deep">
                  {count > 1 ? `Traveler ${i + 1}` : "Your details"}
                </p>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Passport legal first name">
                    <input
                      className={inputCls}
                      value={travelers[i].firstName}
                      onChange={(e) =>
                        updateTraveler(i, "firstName", e.target.value)
                      }
                      autoComplete="off"
                    />
                  </Field>
                  <Field label="Passport legal last name">
                    <input
                      className={inputCls}
                      value={travelers[i].lastName}
                      onChange={(e) =>
                        updateTraveler(i, "lastName", e.target.value)
                      }
                      autoComplete="off"
                    />
                  </Field>
                  <Field label="Preferred name(s) — optional">
                    <input
                      className={inputCls}
                      value={travelers[i].preferredName}
                      onChange={(e) =>
                        updateTraveler(i, "preferredName", e.target.value)
                      }
                      placeholder="What you go by"
                      autoComplete="off"
                    />
                  </Field>
                  <Field label="Date of birth">
                    <input
                      type="date"
                      className={inputCls}
                      value={travelers[i].dob}
                      onChange={(e) => updateTraveler(i, "dob", e.target.value)}
                    />
                  </Field>
                  <Field label="Gender">
                    <select
                      className={inputCls}
                      value={travelers[i].gender}
                      onChange={(e) =>
                        updateTraveler(i, "gender", e.target.value)
                      }
                    >
                      <option value="">Select…</option>
                      {GENDER_OPTIONS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Email">
                    <input
                      type="email"
                      className={inputCls}
                      value={travelers[i].email}
                      onChange={(e) =>
                        updateTraveler(i, "email", e.target.value)
                      }
                      placeholder="name@email.com"
                    />
                  </Field>
                  <Field label="Phone number">
                    <input
                      type="tel"
                      className={inputCls}
                      value={travelers[i].phone}
                      onChange={(e) =>
                        updateTraveler(i, "phone", e.target.value)
                      }
                      placeholder="(555) 555-5555"
                    />
                  </Field>
                  <Field label="Player skill level">
                    <select
                      className={inputCls}
                      value={travelers[i].skillLevel}
                      onChange={(e) =>
                        updateTraveler(i, "skillLevel", e.target.value)
                      }
                    >
                      <option value="">Select…</option>
                      {SKILL_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </fieldset>
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="bg-ppa-navy p-7 text-white">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-vac-teal-pale">
            Your Reservation
          </p>
          <h3 className="mt-3 font-display text-xl uppercase leading-tight">
            {trip.destination}
          </h3>
          <p className="text-sm text-white/60">{trip.datesLabel}</p>

          <dl className="mt-6 space-y-3 border-t border-white/15 pt-6 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-white/65">Room</dt>
              <dd className="font-medium">{option.label}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-white/65">Travelers</dt>
              <dd className="font-medium">{count}</dd>
            </div>
            {occupancy === "double" && (
              <div className="flex justify-between gap-4">
                <dt className="text-white/65">Beds</dt>
                <dd className="font-medium">{bedType || "—"}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-white/65">Nights</dt>
              <dd className="font-medium">{trip.nights}</dd>
            </div>
          </dl>

          <div className="mt-6 flex items-baseline justify-between gap-4 border-t border-white/15 pt-6">
            <span className="text-sm text-white/65">Total due</span>
            <span className="font-display text-3xl text-vac-teal-pale">
              {formatUSD(option.total)}
            </span>
          </div>
          {option.perPersonNote && (
            <p className="mt-1 text-right text-xs text-white/45">
              {option.perPersonNote}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-7 w-full bg-vac-teal px-7 py-4 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-vac-teal-deep disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? "Redirecting to secure checkout…"
              : "Continue to Payment"}
          </button>
          <p className="mt-4 flex items-center justify-center gap-2 text-center text-[11px] text-white/45">
            <svg
              viewBox="0 0 20 20"
              className="h-3.5 w-3.5 shrink-0"
              fill="currentColor"
              aria-hidden
            >
              <path d="M10 1a4 4 0 00-4 4v2H5a2 2 0 00-2 2v7a2 2 0 002 2h10a2 2 0 002-2v-7a2 2 0 00-2-2h-1V5a4 4 0 00-4-4zm2 6H8V5a2 2 0 114 0v2z" />
            </svg>
            Secured by Stripe · Card details never touch our servers
          </p>
        </div>
      </aside>
    </form>
  );
}
