"use client";

import { useState } from "react";

/**
 * Volunteer application (posts to /api/volunteer-apply — stub → Customer.io
 * once credentials land, same open question as lead capture §13).
 *
 * Application date is stamped server-side on submit; the acknowledgment
 * checkboxes mirror the four commitments every applicant makes: photo ID,
 * acceptance at the PPA Tour's sole discretion, two-shift minimum, and the
 * waiver + release.
 */
const SHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

const ACKNOWLEDGMENTS = [
  {
    key: "photo-id",
    text: "I understand applicants are required to be photographed for identification purposes.",
  },
  {
    key: "discretion",
    text: "I understand acceptance of an applicant as a volunteer is within the sole discretion of the PPA Tour.",
  },
  {
    key: "two-shifts",
    text: "I commit to a minimum of 2 shifts.",
  },
  {
    key: "waiver",
    text: "I agree to sign a waiver and release form.",
  },
] as const;

const inputCls =
  "h-11 w-full border border-ppa-line bg-white px-3.5 text-base text-ppa-navy placeholder:text-ppa-navy/35 focus:border-ppa-blue focus:outline-none sm:text-sm";
const labelCls =
  "mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy/60";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className={labelCls}>
        {label}
        {required && <span className="text-ppa-blue"> *</span>}
      </span>
      {children}
    </label>
  );
}

export function VolunteerApplicationForm({
  embedded = false,
}: {
  /** Drop the form's own card border/background when it already sits inside a
   *  chrome'd container (e.g. the event-page modal). */
  embedded?: boolean;
} = {}) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const formCls = embedded
    ? "p-6 sm:p-8"
    : "border border-ppa-line bg-white p-6 sm:p-8";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus("loading");
    try {
      const res = await fetch("/api/volunteer-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: data.get("firstName"),
          lastName: data.get("lastName"),
          dob: data.get("dob"),
          street: data.get("street"),
          city: data.get("city"),
          state: data.get("state"),
          zip: data.get("zip"),
          email: data.get("email"),
          heardAbout: data.get("heardAbout"),
          pastVolunteering: data.get("pastVolunteering"),
          shirtSize: data.get("shirtSize"),
          additionalInfo: data.get("additionalInfo"),
          acknowledgments: ACKNOWLEDGMENTS.map((a) => a.key),
        }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div
        className={`p-8 text-center ${embedded ? "" : "border border-ppa-line bg-white"}`}
      >
        <p className="font-display text-2xl uppercase text-ppa-navy">
          Application received
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ppa-navy/60">
          Thanks for applying to volunteer with the Carvana PPA Tour. Our
          volunteer team will review your application and follow up by email
          with next steps, including shift selection and orientation details.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={formCls}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First Name" required>
          <input name="firstName" required className={inputCls} autoComplete="given-name" />
        </Field>
        <Field label="Last Name" required>
          <input name="lastName" required className={inputCls} autoComplete="family-name" />
        </Field>
        <Field label="Date of Birth" required>
          <input name="dob" type="date" required className={inputCls} autoComplete="bday" />
        </Field>
        <Field label="Email" required>
          <input name="email" type="email" required className={inputCls} autoComplete="email" placeholder="you@email.com" />
        </Field>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[2fr_1fr]">
        <Field label="Street Address" required>
          <input name="street" required className={inputCls} autoComplete="street-address" />
        </Field>
        <Field label="City" required>
          <input name="city" required className={inputCls} autoComplete="address-level2" />
        </Field>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_2fr]">
        <Field label="State" required>
          <input name="state" required className={inputCls} autoComplete="address-level1" />
        </Field>
        <Field label="ZIP" required>
          <input name="zip" required className={inputCls} autoComplete="postal-code" />
        </Field>
        <Field label="T-Shirt Size" required>
          <select name="shirtSize" required defaultValue="" className={inputCls}>
            <option value="" disabled>
              Select a size
            </option>
            {SHIRT_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-4">
        <Field label="How did you hear about volunteering for the PPA Tour?">
          <input name="heardAbout" className={inputCls} />
        </Field>
      </div>
      <div className="mt-4">
        <Field label="Have you volunteered in the past? If so, when and what position?">
          <textarea
            name="pastVolunteering"
            rows={3}
            className="w-full border border-ppa-line bg-white px-3.5 py-2.5 text-base text-ppa-navy placeholder:text-ppa-navy/35 focus:border-ppa-blue focus:outline-none sm:text-sm"
          />
        </Field>
      </div>
      <div className="mt-4">
        <Field label="Additional Info">
          <textarea
            name="additionalInfo"
            rows={3}
            placeholder="Availability, friends or family you'd like to be scheduled with, questions…"
            className="w-full border border-ppa-line bg-white px-3.5 py-2.5 text-base text-ppa-navy placeholder:text-ppa-navy/35 focus:border-ppa-blue focus:outline-none sm:text-sm"
          />
        </Field>
      </div>

      <fieldset className="mt-6 border-t border-ppa-line pt-5">
        <legend className="sr-only">Acknowledgments</legend>
        <p className={labelCls}>
          Acknowledgments<span className="text-ppa-blue"> *</span>
        </p>
        <div className="flex flex-col gap-2.5">
          {ACKNOWLEDGMENTS.map((a) => (
            <label key={a.key} className="flex items-start gap-2.5 text-sm text-ppa-navy/70">
              <input
                type="checkbox"
                required
                className="mt-0.5 h-4 w-4 shrink-0 accent-ppa-blue"
              />
              {a.text}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={status === "loading"}
          className="h-11 bg-ppa-blue px-7 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ppa-blue-deep disabled:opacity-60"
        >
          {status === "loading" ? "Submitting…" : "Submit Application"}
        </button>
        {status === "error" && (
          <p className="text-sm text-red-600">
            Something went wrong — please try again.
          </p>
        )}
      </div>
    </form>
  );
}
