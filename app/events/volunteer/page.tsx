import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { VolunteerApplicationForm } from "@/components/volunteer/VolunteerApplicationForm";
import { getEvents } from "@/lib/events-api";
import { isTourStop } from "@/lib/placeholder-data";
import { VOLUNTEER_FAQS } from "@/lib/volunteer-faq";

export const metadata: Metadata = {
  title: "Volunteer",
  description:
    "Volunteer at a Carvana PPA Tour event — grounds access all week, a courtside ticket on shift days, swag, and a crew that makes tournament week run. Apply online.",
};

/* ── Content ────────────────────────────────────────────────── */

const REQUIREMENTS: { label: string; href?: string }[] = [
  { label: "NEW volunteers must submit an application online", href: "#apply" },
  { label: "Commit to a minimum of two shifts" },
  { label: "Sign a waiver and release form" },
  { label: "Must be 18 years of age by the first day of the tournament (exceptions for ball crew)" },
  { label: "Obtain the required training to learn the responsibilities of your position prior to tournament start" },
  { label: "Adhere to all tournament policies and volunteer guidelines" },
  { label: "Dedication to the success of the Carvana PPA Tour tournament, a commitment to excellence, and teamwork" },
];

const PERKS = [
  {
    title: "Volunteer Credential",
    body: "Access to the grounds all week.",
  },
  {
    title: "Volunteer Swag Package",
    body: "Tournament shirt, hat, and more to wear on shift.",
  },
  {
    title: "Free Parking",
    body: "On-site parking for every shift day.",
  },
  {
    title: "Volunteer Lounge",
    body: "Light snacks, cold drinks, and a lounge area with TVs to watch pickleball and relax.",
  },
  {
    title: "Meal On Shift",
    body: "A meal is provided during your shift.",
  },
  {
    title: "Courtside Ticket",
    body: "A Championship Court ticket for the day of your shift — use it before or after, or transfer it to a friend or family member.",
  },
  {
    title: "Volunteer Appreciation Party",
    body: "Pizza, drinks, and open courts at the venue the Monday of the event — plus a special visit from a few of our amazing pros hopping in to play. Bring a plus one!",
  },
  {
    title: "Pickleball Central Discount",
    body: "Volunteer discount at Pickleball Central.",
  },
  {
    title: "Ticket Discount Code",
    body: "A discount code for tickets to the event.",
  },
];

const POSITIONS = [
  {
    title: "Greeter",
    body: "Welcome guests as they arrive, hand out event information, and help direct them to the appropriate areas throughout the venue.",
  },
  {
    title: "VIP Check-In / Escort",
    body: "Check in VIP guests and personally escort them to the VIP area, ensuring they have a smooth and welcoming experience.",
  },
  {
    title: "Tournament Desk",
    body: "Assist players by distributing scorecards, collecting completed scorecards, and helping answer tournament-related questions.",
  },
  {
    title: "Medal Ceremony",
    body: "Help recognize tournament winners by presenting medals and announcing players during award ceremonies.",
  },
  {
    title: "Center Court Greeter",
    body: "Welcome guests to Center Court, assist with seating, and help create a positive fan experience.",
  },
  {
    title: "Center Court Usher",
    body: "Verify tickets and wristbands and ensure guests are seated in the correct sections according to their ticket type.",
  },
  {
    title: "Happy Hour Assistant",
    body: "Assist with setup, guest flow, and overall operations during Happy Hour activities and promotions.",
  },
  {
    title: "Pickletown Assistant",
    body: "Serve as a flexible support volunteer — setup, cleanup, guest assistance, trash pickup, and various entertainment team needs.",
  },
  {
    title: "Player Check-In",
    body: "Welcome players and distribute tournament materials, including player bags, towels, and other event giveaways.",
  },
  {
    title: "Court Monitor",
    body: "Help keep matches running smoothly by assisting with court operations, monitoring play schedules, providing balls, and supporting players as needed.",
  },
  {
    title: "Morning Programming Assistant",
    body: "Support the entertainment team with morning activities, games, and fan engagement experiences from 12:00 PM – 4:00 PM.",
  },
  {
    title: "Evening Programming Assistant",
    body: "Assist the entertainment team with evening events, including event check-in, guest support, and activity operations from 5:00 PM – 8:00 PM.",
  },
  {
    title: "Volunteer Lead",
    body: "Provide guidance and support to a group of volunteers, answer questions, and help ensure volunteer operations run efficiently.",
  },
  {
    title: "Pickleball Central Assistant",
    body: "Assist guests in the Pickleball Central area — help them locate products, answer basic questions, and support the retail experience.",
  },
  {
    title: "Pro Liaison Assistant",
    body: "Assist the Pro Liaison Team — monitor the pro lounge, keep it stocked with snacks and drinks, and fill the coolers on the courts.",
  },
];


/* ── Building blocks ────────────────────────────────────────── */

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="h-2 w-2 bg-ppa-blue" />
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
        {children}
      </p>
    </div>
  );
}

export default async function VolunteerPage() {
  // Feed the application's "which tournament?" picker with the live upcoming
  // schedule, sorted by date. Falls back to an empty list if the feed is down —
  // the picker simply hides rather than blocking the application.
  //
  // Scoped to the domestic main PPA Tour only — Majors, Cups and Opens, no
  // Challengers, no international series. Same "The Tour" predicate the events
  // page uses (region + tierKey + points), since that's where volunteering runs.
  const { events } = await getEvents();
  const tournaments = Array.from(
    new Set(
      events
        .filter(
          (t) =>
            t.status !== "completed" &&
            t.region !== "international" &&
            isTourStop(t),
        )
        .sort((a, b) => a.startDate.localeCompare(b.startDate))
        .map((t) => {
          const loc = [t.city, t.state].filter(Boolean).join(", ");
          return loc ? `${t.name} — ${loc}` : t.name;
        }),
    ),
  );

  return (
    <>
      {/* Hero */}
      <section className="relative isolate bg-ppa-navy text-white">
        <Image
          src="/ppa/nationals-crowd-stadium.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-35"
        />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:py-20">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-yellow" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
              Get Involved
            </p>
          </div>
          <h1 className="mt-2 max-w-2xl font-display text-4xl uppercase leading-[1.02] sm:text-5xl">
            Volunteer at the PPA Tour
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/75">
            Every PPA tournament week runs on volunteers — the crew that
            welcomes fans, keeps courts moving, and makes every tournament feel
            like the biggest event in pickleball. Be inside the ropes with us.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#apply"
              className="inline-flex h-11 items-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ppa-blue-deep"
            >
              Apply to Volunteer
            </a>
            <a
              href="#positions"
              className="inline-flex h-11 items-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:border-white hover:bg-white hover:text-ppa-navy"
            >
              See the Positions
            </a>
          </div>
        </div>
      </section>

      {/* The commitment */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <SectionEyebrow>Volunteer Expectations</SectionEyebrow>
              <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
                What We Ask of You
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-ppa-navy/60">
                Volunteers are required to commit to two shifts and to sign a
                waiver and release. Applicants are required to be photographed
                for identification purposes, and acceptance of an applicant as
                a volunteer is at the sole discretion of the Carvana PPA Tour.
              </p>
              <ul className="mt-5 flex flex-col gap-2.5">
                {REQUIREMENTS.map((r) => (
                  <li key={r.label} className="flex items-start gap-2.5 text-sm text-ppa-navy/70">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-ppa-blue" />
                    {r.href ? (
                      <a href={r.href} className="font-semibold text-ppa-blue hover:text-ppa-navy">
                        {r.label}
                      </a>
                    ) : (
                      r.label
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative isolate min-h-[18rem] overflow-hidden bg-ppa-navy">
              <Image
                src="/ppa/volunteers-group.jpg"
                alt="PPA Tour volunteers gathered on a championship court at night"
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 scrim-soft" />
              <div className="relative flex h-full flex-col justify-end p-5 text-white">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-yellow">
                  Every Main-Tour Stop
                </p>
                <p className="mt-1 font-display text-2xl uppercase leading-[1.02]">
                  Be Part of the Crew
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionEyebrow>Volunteers Receive</SectionEyebrow>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
            What You Get Back
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PERKS.map((p) => (
              <div key={p.title} className="flex flex-col border border-ppa-line bg-ppa-paper p-5">
                <h3 className="font-display text-lg uppercase leading-[1.1] text-ppa-navy">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ppa-navy/60">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Positions */}
      <section id="positions" className="bg-ppa-paper scroll-mt-24">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionEyebrow>Volunteer Positions</SectionEyebrow>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
            Find Your Spot on the Crew
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ppa-navy/60">
            Pay careful attention to the physical requirements of the position
            you're interested in — some involve lifting, long stretches on your
            feet, or time in the sun. Pick the role that fits you best.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {POSITIONS.map((p) => (
              <div key={p.title} className="flex flex-col border border-ppa-line bg-white p-5">
                <h3 className="font-display text-lg uppercase leading-[1.1] text-ppa-navy">
                  {p.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ppa-navy/60">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionEyebrow>Volunteer FAQs</SectionEyebrow>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
            Questions? We Have Answers
          </h2>
          <div className="mt-6 flex flex-col divide-y divide-ppa-line border border-ppa-line">
            {VOLUNTEER_FAQS.map((f) => (
              <details key={f.q} className="group bg-white open:bg-ppa-paper">
                <summary className="flex cursor-pointer items-center justify-between gap-4 p-4 text-sm font-bold uppercase tracking-[0.04em] text-ppa-navy marker:content-none [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span
                    aria-hidden
                    className="shrink-0 text-ppa-blue transition-transform duration-200 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="px-4 pb-4 text-sm leading-relaxed text-ppa-navy/65">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Application */}
      <section id="apply" className="bg-ppa-paper scroll-mt-24">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionEyebrow>Apply</SectionEyebrow>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
            Volunteer Application
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ppa-navy/60">
            New volunteers must submit an application online. Our volunteer
            team reviews every application and follows up by email.
          </p>
          <div className="mt-6 max-w-3xl">
            <VolunteerApplicationForm tournaments={tournaments} />
          </div>
          <p className="mt-4 text-xs text-ppa-navy/45">
            Questions about volunteering? Reach the team at{" "}
            <Link href="/about/contact" className="font-semibold text-ppa-blue hover:text-ppa-navy">
              our contact page
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
