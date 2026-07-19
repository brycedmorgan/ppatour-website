"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { VolunteerApplicationForm } from "@/components/volunteer/VolunteerApplicationForm";

/**
 * Get-Involved "Volunteer" CTA on the event page. Opens the same volunteer
 * application that lives on /events/volunteer in a modal, so fans can apply
 * without leaving the event page. The trigger mirrors the other Get-Involved
 * card CTAs; a "full volunteer page" link sits in the modal footer for people
 * who want the requirements/perks/FAQ context.
 */
export function VolunteerModalButton({
  label,
  eventName,
}: {
  label: string;
  eventName?: string;
}) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group mt-4 inline-flex items-center gap-1.5 self-start border-b-2 border-ppa-blue pb-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white/85 hover:text-white"
      >
        {label}
        <span
          aria-hidden
          className="inline-block transition-transform duration-300 group-hover:translate-x-1"
        >
          →
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={eventName ? `Volunteer at ${eventName}` : "Volunteer application"}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-ppa-navy-deep/80 p-4 backdrop-blur-sm motion-safe:animate-fade sm:p-8"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative my-auto flex w-full max-w-2xl flex-col bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-ppa-line bg-white px-6 py-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ppa-blue">
                  Volunteer
                </p>
                <h2 className="mt-0.5 font-display text-xl uppercase leading-[1.05] text-ppa-navy">
                  {eventName ? `Volunteer at ${eventName}` : "Volunteer Application"}
                </h2>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close volunteer application"
                className="-mr-1 flex size-9 shrink-0 items-center justify-center text-xl text-ppa-navy/50 transition-colors hover:text-ppa-navy"
              >
                ✕
              </button>
            </div>

            <VolunteerApplicationForm embedded />

            <p className="border-t border-ppa-line px-6 pb-6 text-xs text-ppa-navy/50">
              Want the full rundown — requirements, perks, and FAQs?{" "}
              <Link
                href="/events/volunteer"
                className="font-semibold text-ppa-blue hover:text-ppa-navy"
              >
                Visit the volunteer page ↗
              </Link>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
