"use client";

import { useEffect, useState } from "react";
import {
  AGE_BRACKETS,
  assembleTrip,
  casualOptions,
  competeChecklist,
  FORMAT_HELP,
  FORMATS,
  formatDateRange,
  projectWatchDays,
  recommendDivision,
  SKILL_LEVELS as SKILLS,
  type AgeBracket,
  type Format,
  type Intent,
  type PlayStyle,
  type SkillLevel,
  type Travel,
  type TripEvent,
  type TripPro,
} from "@/lib/trip";

/**
 * Trip Builder — the intent-first wizard on the event page's "Plan Your Trip"
 * section. Someone tells us what they want to do (watch / play / both), we
 * branch to the right path (camps & clinics vs a tournament bracket), then help
 * them get there (fly/drive), stay (official block + affiliate search), eat, and
 * explore — ending in a gamified readiness checklist they tick off as they book.
 *
 * v1: no login. Affiliate link-out for flights/hotels; wizard choices live in
 * the URL so a built trip is shareable; the checklist's ticked state persists in
 * localStorage per event. Phase 2 ties both to the Jackalope fan identity so
 * someone can sign in and track everything across devices.
 *
 * ⚠ NO EMOJI ANYWHERE (Bryce, standing rule for this site). Icons are inline
 * SVG only — see the Icon components at the bottom.
 */

type Step = "intent" | "play" | "watch" | "travel" | "summary";

type State = {
  intent: Intent | null;
  style: PlayStyle | null;
  skill: SkillLevel | null;
  age: AgeBracket | null;
  format: Format | null;
  from: string;
  travel: Travel | null;
  party: number;
  /** Slugs of pros the fan wants to catch. */
  watchPros: string[];
};

const EMPTY: State = {
  intent: null,
  style: null,
  skill: null,
  age: null,
  format: null,
  from: "",
  travel: null,
  party: 1,
  watchPros: [],
};

/** Which steps exist given the intent. Play adds a "play" step; watching adds a "watch" step. */
function stepsFor(s: State): Step[] {
  const steps: Step[] = ["intent"];
  if (s.intent === "play" || s.intent === "both") steps.push("play");
  if (s.intent === "watch" || s.intent === "both") steps.push("watch");
  if (s.intent) steps.push("travel", "summary");
  return steps;
}

// ---- URL sync (self-contained; no useSearchParams to avoid a static bailout) --
function readUrl(): Partial<State> {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  const g = (k: string) => p.get(k) ?? undefined;
  const num = Number(g("party"));
  return {
    intent: (g("intent") as Intent) ?? null,
    style: (g("style") as PlayStyle) ?? null,
    skill: (g("skill") as SkillLevel) ?? null,
    age: (g("age") as AgeBracket) ?? null,
    format: (g("fmt") as Format) ?? null,
    from: g("from") ?? "",
    travel: (g("travel") as Travel) ?? null,
    party: Number.isFinite(num) && num >= 1 ? Math.min(num, 8) : 1,
    watchPros: (g("pros") ?? "").split(",").filter(Boolean),
  };
}

function writeUrl(s: State) {
  if (typeof window === "undefined") return;
  const p = new URLSearchParams(window.location.search);
  const set = (k: string, v: string | null) => (v ? p.set(k, v) : p.delete(k));
  set("intent", s.intent);
  set("style", s.style);
  set("skill", s.skill);
  set("age", s.age);
  set("fmt", s.format);
  set("from", s.from.trim() || null);
  set("travel", s.travel);
  set("party", s.party > 1 ? String(s.party) : null);
  set("pros", s.watchPros.length ? s.watchPros.join(",") : null);
  const qs = p.toString();
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`,
  );
}

export function TripBuilder({ event }: { event: TripEvent }) {
  const [s, setS] = useState<State>(EMPTY);
  const [step, setStep] = useState<Step>("intent");
  const [hydrated, setHydrated] = useState(false);

  // Restore a shared trip on mount. This MUST be post-mount, not a lazy state
  // initializer: SSR has no URL to read, so restoring during render would
  // hydration-mismatch (server renders EMPTY, client would render restored).
  useEffect(() => {
    const restored = { ...EMPTY, ...readUrl() };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see above: URL-derived initial state can only be applied after mount
    setS(restored);
    if (restored.intent && (restored.travel || restored.from)) setStep("summary");
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeUrl(s);
  }, [s, hydrated]);

  const steps = stepsFor(s);
  const idx = Math.max(0, steps.indexOf(step));
  const set = (patch: Partial<State>) => setS((prev) => ({ ...prev, ...patch }));

  function goNext() {
    const next = steps[idx + 1];
    if (next) setStep(next);
  }
  function goBack() {
    const prev = steps[idx - 1];
    if (prev) setStep(prev);
  }
  function restart() {
    setS(EMPTY);
    setStep("intent");
  }

  const dateRange = formatDateRange(event.startDate, event.endDate);

  return (
    <div className="border border-ppa-line bg-white">
      <div className="border-b border-ppa-line bg-ppa-navy px-5 py-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppa-sky">
              Trip Builder
            </p>
            <p className="mt-0.5 font-display text-lg uppercase leading-tight">
              Build your {event.city} trip
            </p>
          </div>
          {s.intent && (
            <button
              type="button"
              onClick={restart}
              className="shrink-0 text-[10px] font-bold uppercase tracking-[0.12em] text-white/50 transition-colors hover:text-white"
            >
              Start over
            </button>
          )}
        </div>
        <div className="mt-3 flex gap-1">
          {steps.map((st, i) => (
            <span
              key={st}
              className={`h-1 flex-1 transition-colors ${
                i <= idx ? "bg-[var(--event-accent)]" : "bg-white/15"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="px-5 py-6">
        {step === "intent" && (
          <IntentStep
            city={event.city}
            value={s.intent}
            onPick={(intent) => {
              set({ intent });
              setTimeout(
                () => setStep(intent === "watch" ? "watch" : "play"),
                140,
              );
            }}
          />
        )}
        {step === "play" && (
          <PlayStep event={event} state={s} set={set} onDone={goNext} onBack={goBack} />
        )}
        {step === "watch" && (
          <WatchStep event={event} state={s} set={set} onDone={goNext} onBack={goBack} />
        )}
        {step === "travel" && (
          <TravelStep
            event={event}
            state={s}
            set={set}
            dateRange={dateRange}
            onDone={goNext}
            onBack={goBack}
          />
        )}
        {step === "summary" && (
          <Summary event={event} state={s} dateRange={dateRange} onBack={goBack} />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Step 1 */

function IntentStep({
  city,
  value,
  onPick,
}: {
  city: string;
  value: Intent | null;
  onPick: (i: Intent) => void;
}) {
  const options: { key: Intent; label: string; note: string; icon: IconName }[] = [
    { key: "watch", label: "Watch pickleball", note: "Catch the pros live", icon: "ticket" },
    { key: "play", label: "Play pickleball", note: "Get on the court yourself", icon: "ball" },
    { key: "both", label: "Watch & play", note: "The full weekend", icon: "star" },
  ];
  return (
    <div>
      <StepHeading eyebrow="First up" title={`What brings you to ${city}?`} />
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {options.map((o) => (
          <ChoiceCard key={o.key} selected={value === o.key} onClick={() => onPick(o.key)}>
            <Icon name={o.icon} className="size-6 text-[var(--event-accent)]" />
            <span className="mt-2 font-display text-sm uppercase leading-tight text-ppa-navy">
              {o.label}
            </span>
            <span className="mt-1 text-xs text-ppa-navy/55">{o.note}</span>
          </ChoiceCard>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Step 2 */

function PlayStep({
  event,
  state,
  set,
  onDone,
  onBack,
}: {
  event: TripEvent;
  state: State;
  set: (p: Partial<State>) => void;
  onDone: () => void;
  onBack: () => void;
}) {
  const style = state.style;
  return (
    <div>
      <StepHeading eyebrow="Your game" title="How do you want to play?" />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <ChoiceCard selected={style === "casual"} onClick={() => set({ style: "casual" })}>
          <span className="font-display text-sm uppercase text-ppa-navy">Just for fun</span>
          <span className="mt-1 text-xs text-ppa-navy/55">
            Camps, clinics, and open play near the venue
          </span>
        </ChoiceCard>
        <ChoiceCard selected={style === "compete"} onClick={() => set({ style: "compete" })}>
          <span className="font-display text-sm uppercase text-ppa-navy">Compete</span>
          <span className="mt-1 text-xs text-ppa-navy/55">
            Enter the amateur tournament draw
          </span>
        </ChoiceCard>
      </div>

      {style === "casual" && (
        <div className="mt-5 space-y-2.5">
          {casualOptions(event).map((o) => (
            <div key={o.title} className="border border-ppa-line bg-ppa-paper p-4">
              <p className="font-display text-sm uppercase text-ppa-navy">{o.title}</p>
              <p className="mt-1 text-xs text-ppa-navy/60">{o.note}</p>
            </div>
          ))}
        </div>
      )}

      {style === "compete" && (
        <div className="mt-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ppa-blue">
            Find your bracket
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Picker label="Skill level" options={SKILLS} value={state.skill} onChange={(v) => set({ skill: v as SkillLevel })} />
            <Picker label="Age group" options={AGE_BRACKETS} value={state.age} onChange={(v) => set({ age: v as AgeBracket })} />
            <Picker label="Format" options={FORMATS} value={state.format} onChange={(v) => set({ format: v as Format })} />
          </div>
          {state.format && (
            <p className="mt-2 text-xs text-ppa-navy/55">
              <span className="font-bold text-ppa-navy">{state.format}:</span>{" "}
              {FORMAT_HELP[state.format]}
            </p>
          )}
          {state.skill && state.age && state.format && (
            <div className="mt-4 border border-[var(--event-accent)]/40 bg-ppa-paper p-4 motion-safe:animate-fade">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ppa-navy/50">
                Your recommended division
              </p>
              <p className="mt-1 font-display text-lg uppercase text-ppa-navy">
                {recommendDivision(state.skill, state.age, state.format).label}
              </p>
              <p className="mt-1 text-xs text-ppa-navy/60">
                {recommendDivision(state.skill, state.age, state.format).blurb}
              </p>
              <div className="mt-2 flex items-start gap-2 border-t border-ppa-line pt-2">
                <Icon name="calendar" className="mt-0.5 size-3.5 shrink-0 text-ppa-blue" />
                <p className="text-[11px] text-ppa-navy/55">
                  {recommendDivision(state.skill, state.age, state.format).when}
                </p>
              </div>
              <p className="mt-2 text-[10px] uppercase tracking-[0.08em] text-ppa-navy/35">
                Guidance only — confirm the exact division when you register.
              </p>
            </div>
          )}
        </div>
      )}

      <StepNav onBack={onBack} onNext={onDone} nextLabel="Next: getting there" nextDisabled={!style} />
    </div>
  );
}

/* ------------------------------------------------------- Step: who to watch */

function WatchStep({
  event,
  state,
  set,
  onDone,
  onBack,
}: {
  event: TripEvent;
  state: State;
  set: (p: Partial<State>) => void;
  onDone: () => void;
  onBack: () => void;
}) {
  const [q, setQ] = useState("");
  const selected = new Set(state.watchPros);
  const query = q.trim().toLowerCase();

  // Selected pros always show; otherwise filter by the search, and cap the
  // list so it stays a picker, not the whole board.
  const shown = event.pros.filter((p) => {
    if (selected.has(p.slug)) return true;
    if (!query) return false;
    return p.name.toLowerCase().includes(query);
  });
  const list = query ? shown.slice(0, 12) : event.pros.filter((p) => selected.has(p.slug));

  const toggle = (slug: string) =>
    set({
      watchPros: selected.has(slug)
        ? state.watchPros.filter((s) => s !== slug)
        : [...state.watchPros, slug],
    });

  return (
    <div>
      <StepHeading eyebrow="Who to watch" title="Any players you're hoping to catch?" />
      <p className="mt-1 text-xs text-ppa-navy/50">
        Pick a pro and we&apos;ll project the best day to see them on court. Optional —
        skip if you just want to soak it all in.
      </p>

      {event.pros.length > 0 ? (
        <>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search a player, e.g. Anna Leigh Waters"
            className="mt-4 w-full border border-ppa-line bg-ppa-paper px-3 py-2.5 text-base text-ppa-navy outline-none focus:border-ppa-blue sm:text-sm"
          />

          {list.length > 0 && (
            <ul className="mt-3 space-y-2">
              {list.map((p) => (
                <ProRow key={p.slug} pro={p} selected={selected.has(p.slug)} onToggle={() => toggle(p.slug)} />
              ))}
            </ul>
          )}
          {query && list.filter((p) => !selected.has(p.slug)).length === 0 && (
            <p className="mt-3 text-xs text-ppa-navy/45">
              No match in the top field — try a different spelling.
            </p>
          )}
          {!query && state.watchPros.length === 0 && (
            <p className="mt-3 text-xs text-ppa-navy/45">
              Start typing a name to search the field.
            </p>
          )}
        </>
      ) : (
        <p className="mt-4 text-xs text-ppa-navy/45">
          The player field loads with live rankings — check back once seeding is set.
        </p>
      )}

      <StepNav
        onBack={onBack}
        onNext={onDone}
        nextLabel={state.watchPros.length ? "Next: getting there" : "Skip for now"}
      />
    </div>
  );
}

function ProRow({
  pro,
  selected,
  onToggle,
}: {
  pro: TripPro;
  selected: boolean;
  onToggle: () => void;
}) {
  const proj = projectWatchDays(pro.rank);
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={selected}
        className={`flex w-full items-start gap-3 border p-3 text-left transition-colors ${
          selected
            ? "border-[var(--event-accent)] bg-[var(--event-accent)]/[0.06]"
            : "border-ppa-line bg-white hover:border-ppa-blue"
        }`}
      >
        <span className="mt-0.5 shrink-0">
          <CheckBox done={selected} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="font-display text-sm uppercase text-ppa-navy">{pro.name}</span>
          {pro.divisions.length > 0 && (
            <span className="ml-2 text-[11px] text-ppa-navy/45">
              {pro.divisions.join(" · ")}
            </span>
          )}
          <span className="mt-1 flex items-center gap-1.5 text-xs text-ppa-navy/60">
            <Icon name="calendar" className="size-3 shrink-0 text-ppa-blue" />
            {proj.confidence === "Very likely" ? "Very likely" : proj.confidence === "Likely" ? "Likely" : "Projected"}{" "}
            to play into <span className="font-bold text-ppa-navy">{proj.day}</span> ({proj.round})
          </span>
        </span>
      </button>
    </li>
  );
}

/* ------------------------------------------------------------------ Step 3 */

function TravelStep({
  event,
  state,
  set,
  dateRange,
  onDone,
  onBack,
}: {
  event: TripEvent;
  state: State;
  set: (p: Partial<State>) => void;
  dateRange: string;
  onDone: () => void;
  onBack: () => void;
}) {
  return (
    <div>
      <StepHeading eyebrow="Getting there" title="Where are you coming from?" />
      <p className="mt-1 text-xs text-ppa-navy/50">
        {dateRange}
        {event.airport ? ` · closest airport ${event.airport}` : ""}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="block">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy/50">
            Your city or home airport
          </span>
          <input
            value={state.from}
            onChange={(e) => set({ from: e.target.value })}
            placeholder="e.g. LAX or Los Angeles"
            className="mt-1 w-full border border-ppa-line bg-ppa-paper px-3 py-2.5 text-base text-ppa-navy outline-none focus:border-ppa-blue sm:text-sm"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy/50">
            Travelers
          </span>
          <div className="mt-1 flex items-center border border-ppa-line bg-ppa-paper">
            <button type="button" aria-label="Fewer travelers" onClick={() => set({ party: Math.max(1, state.party - 1) })} className="px-3 py-2.5 text-ppa-navy/60 hover:text-ppa-navy">
              −
            </button>
            <span className="min-w-6 text-center text-sm font-bold text-ppa-navy">{state.party}</span>
            <button type="button" aria-label="More travelers" onClick={() => set({ party: Math.min(8, state.party + 1) })} className="px-3 py-2.5 text-ppa-navy/60 hover:text-ppa-navy">
              +
            </button>
          </div>
        </label>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <ChoiceCard selected={state.travel === "fly"} onClick={() => set({ travel: "fly" })}>
          <Icon name="plane" className="size-6 text-[var(--event-accent)]" />
          <span className="mt-2 font-display text-sm uppercase text-ppa-navy">Flying</span>
          <span className="mt-1 text-xs text-ppa-navy/55">
            We&apos;ll pull fares into {event.airport ?? event.city}
          </span>
        </ChoiceCard>
        <ChoiceCard selected={state.travel === "drive"} onClick={() => set({ travel: "drive" })}>
          <Icon name="car" className="size-6 text-[var(--event-accent)]" />
          <span className="mt-2 font-display text-sm uppercase text-ppa-navy">Driving</span>
          <span className="mt-1 text-xs text-ppa-navy/55">Get directions to {event.venue}</span>
        </ChoiceCard>
      </div>

      <StepNav onBack={onBack} onNext={onDone} nextLabel="See my trip" nextDisabled={!state.travel} />
    </div>
  );
}

/* ------------------------------------------------------------------ Summary */

function Summary({
  event,
  state,
  dateRange,
  onBack,
}: {
  event: TripEvent;
  state: State;
  dateRange: string;
  onBack: () => void;
}) {
  const { done, toggle, mark } = useChecklist(event.slug);
  const wantsPlay = state.intent === "play" || state.intent === "both";

  // The action list comes from the SHARED assembler, so the emailed plan and
  // this on-page checklist can never drift.
  const items = assembleTrip(event, state);

  // Compete prep — checkable "make sure you're ready" items (no link).
  const prep =
    wantsPlay && state.style === "compete"
      ? competeChecklist(event).map((c, i) => ({ id: `prep-${i}`, text: c }))
      : [];

  const allIds = [...items.map((i) => i.id), ...prep.map((p) => p.id)];
  const doneCount = allIds.filter((id) => done[id]).length;
  const total = allIds.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  const allDone = total > 0 && doneCount === total;

  return (
    <div>
      <StepHeading eyebrow="Your trip" title={`${event.city} · ${dateRange}`} />

      {/* Readiness meter — the gamified core */}
      <div className="mt-4 border border-ppa-line bg-ppa-paper p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ppa-navy/50">
            {allDone ? "You're all set" : "Trip readiness"}
          </p>
          <p className="font-display text-sm text-ppa-navy">
            {doneCount} / {total} done
          </p>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden bg-ppa-line">
          <div
            className="h-full bg-[var(--event-accent)] transition-[width] duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Actionable checklist */}
      <div className="mt-4 space-y-2.5">
        {items.map((item) => (
          <CheckRow key={item.id} done={!!done[item.id]} onToggle={() => toggle(item.id)}>
            <p className="font-display text-sm uppercase leading-tight text-ppa-navy">
              {item.title}
            </p>
            {item.sub && <p className="mt-0.5 text-xs text-ppa-navy/55">{item.sub}</p>}
            {item.note && (
              <p className="mt-1 flex items-start gap-1.5 text-[11px] text-ppa-navy/50">
                <Icon name="calendar" className="mt-0.5 size-3 shrink-0 text-ppa-blue" />
                {item.note}
              </p>
            )}

            {item.links && (
              <ul className="mt-2 space-y-1.5">
                {item.links.map((l) => (
                  <li key={l.href} className="text-xs">
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => mark(item.id)}
                      className="font-display text-sm uppercase text-ppa-navy underline-offset-2 hover:text-ppa-blue hover:underline"
                    >
                      {l.label} <span aria-hidden>↗</span>
                    </a>
                    {l.meta && <span className="ml-2 text-ppa-navy/50">{l.meta}</span>}
                  </li>
                ))}
              </ul>
            )}

            {item.href && item.cta && (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => mark(item.id)}
                className="mt-2 inline-flex items-center bg-ppa-blue px-4 py-2 text-[11px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-ppa-blue-deep"
              >
                {item.cta} <span aria-hidden className="ml-1">↗</span>
              </a>
            )}
          </CheckRow>
        ))}
      </div>

      {/* Compete prep list — checkable */}
      {prep.length > 0 && (
        <div className="mt-4 border border-ppa-line bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ppa-navy/45">
            Before you play
          </p>
          <ul className="mt-2 space-y-1">
            {prep.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => toggle(p.id)}
                  className="flex w-full items-start gap-2 py-1 text-left"
                >
                  <CheckBox done={!!done[p.id]} />
                  <span
                    className={`text-xs transition-colors ${
                      done[p.id] ? "text-ppa-navy/40 line-through" : "text-ppa-navy/65"
                    }`}
                  >
                    {p.text}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Reference — where to eat / explore (not checklist items) */}
      {event.dining.length > 0 && (
        <RefBlock title="Where to eat" footer="Partner dining deals coming soon.">
          {event.dining.map((d) => (
            <RefRow key={d.name} name={d.name} tag={d.tag} note={d.note} />
          ))}
        </RefBlock>
      )}
      {event.doing.length > 0 && (
        <RefBlock title={`Explore ${event.city}`}>
          {event.doing.map((d) => (
            <RefRow key={d.name} name={d.name} tag={d.tag} note={d.note} />
          ))}
        </RefBlock>
      )}

      {/* Email the plan */}
      <EmailPlan event={event} state={state} />

      {/* Coming soon */}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {[
          { t: "Gear, ready on arrival", n: "Discounted paddle + PPA apparel waiting at check-in" },
          { t: `${event.city} bucket list`, n: "The can't-miss local picks" },
        ].map((c) => (
          <div key={c.t} className="border border-dashed border-ppa-line bg-ppa-paper p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-ppa-navy/40">
              Coming soon
            </p>
            <p className="mt-0.5 font-display text-xs uppercase text-ppa-navy/70">{c.t}</p>
            <p className="mt-0.5 text-[11px] text-ppa-navy/45">{c.n}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy/45 hover:text-ppa-navy"
        >
          ← Back
        </button>
        <ShareButton />
      </div>
    </div>
  );
}

/**
 * Ticked-state for the readiness checklist, persisted per event in
 * localStorage. This is the interim for "track all of this" — Phase 2 moves it
 * behind the Jackalope fan identity so it follows the user across devices.
 */
function useChecklist(slug: string) {
  const key = `ppa-trip-checklist:${slug}`;
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- persisted state can only be read after mount (no localStorage during SSR)
      if (raw) setDone(JSON.parse(raw));
    } catch {
      /* private mode / bad JSON — start empty */
    }
    setReady(true);
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(done));
    } catch {
      /* storage full / blocked — the session still works, just doesn't persist */
    }
  }, [done, key, ready]);

  return {
    done,
    toggle: (id: string) => setDone((d) => ({ ...d, [id]: !d[id] })),
    mark: (id: string) => setDone((d) => ({ ...d, [id]: true })),
  };
}

/* ------------------------------------------------------------------ Shared UI */

function StepHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ppa-blue">{eyebrow}</p>
      <h3 className="mt-1 event-display text-xl uppercase leading-tight text-ppa-navy">{title}</h3>
    </div>
  );
}

function ChoiceCard({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex flex-col items-start border p-4 text-left transition-all active:scale-[0.99] ${
        selected
          ? "border-[var(--event-accent)] bg-[var(--event-accent)]/5 ring-1 ring-[var(--event-accent)]"
          : "border-ppa-line bg-ppa-paper hover:border-ppa-blue"
      }`}
    >
      {children}
    </button>
  );
}

function Picker({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy/50">
        {label}
      </span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border border-ppa-line bg-ppa-paper px-3 py-2.5 text-sm text-ppa-navy outline-none focus:border-ppa-blue"
      >
        <option value="" disabled>
          Select…
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function StepNav({
  onBack,
  onNext,
  nextLabel,
  nextDisabled,
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
  nextDisabled?: boolean;
}) {
  return (
    <div className="mt-6 flex items-center justify-between gap-3 border-t border-ppa-line pt-4">
      <button
        type="button"
        onClick={onBack}
        className="text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy/45 hover:text-ppa-navy"
      >
        ← Back
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="bg-ppa-blue px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-ppa-blue-deep disabled:cursor-not-allowed disabled:bg-ppa-navy/20"
      >
        {nextLabel} →
      </button>
    </div>
  );
}

/** A checklist row: a tickable box on the left, content on the right. */
function CheckRow({
  done,
  onToggle,
  children,
}: {
  done: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex gap-3 border p-4 transition-colors ${
        done ? "border-[var(--event-accent)]/40 bg-[var(--event-accent)]/[0.06]" : "border-ppa-line bg-white"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={done}
        aria-label={done ? "Mark as not done" : "Mark as done"}
        className="mt-0.5 shrink-0"
      >
        <CheckBox done={done} />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function CheckBox({ done }: { done: boolean }) {
  return (
    <span
      className={`flex size-5 items-center justify-center border transition-all ${
        done
          ? "border-[var(--event-accent)] bg-[var(--event-accent)] text-white"
          : "border-ppa-navy/30 bg-white text-transparent"
      }`}
    >
      <Icon name="check" className="size-3.5" />
    </span>
  );
}

function RefBlock({
  title,
  footer,
  children,
}: {
  title: string;
  footer?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 border border-ppa-line bg-white p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ppa-navy/45">{title}</p>
      <ul className="mt-2 space-y-1.5">{children}</ul>
      {footer && (
        <p className="mt-2 text-[10px] uppercase tracking-[0.08em] text-ppa-navy/35">{footer}</p>
      )}
    </div>
  );
}

function RefRow({ name, tag, note }: { name: string; tag: string; note: string }) {
  return (
    <li className="text-xs text-ppa-navy/65">
      <span className="font-bold text-ppa-navy">{name}</span>
      <span className="ml-2 text-ppa-navy/45">{tag}</span> — {note}
    </li>
  );
}

function EmailPlan({ event, state }: { event: TripEvent; state: State }) {
  const [email, setEmail] = useState("");
  const [hp, setHp] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setStatus("error");
      setMsg("Enter a valid email.");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/trip/email/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          company: hp,
          slug: event.slug,
          year: event.startDate.slice(0, 4),
          selection: {
            intent: state.intent,
            style: state.style,
            skill: state.skill,
            age: state.age,
            format: state.format,
            from: state.from,
            travel: state.travel,
            party: state.party,
            watchPros: state.watchPros,
          },
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setStatus("sent");
        setMsg(`Sent to ${email} — check your inbox.`);
      } else {
        setStatus("error");
        setMsg(data.error || "Couldn't send that just now. Try again shortly.");
      }
    } catch {
      setStatus("error");
      setMsg("Couldn't send that just now. Try again shortly.");
    }
  }

  if (status === "sent") {
    return (
      <div className="mt-4 flex items-center gap-2 border border-[var(--event-accent)]/40 bg-[var(--event-accent)]/[0.06] p-4">
        <Icon name="check" className="size-4 text-[var(--event-accent)]" />
        <p className="text-sm text-ppa-navy">{msg}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-4 border border-ppa-line bg-ppa-paper p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ppa-navy/50">
        Email me this plan
      </p>
      <p className="mt-1 text-xs text-ppa-navy/55">
        Send yourself the whole trip — checklist, links, and who to watch.
      </p>
      {/* Honeypot — real users never fill this. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        value={hp}
        onChange={(e) => setHp(e.target.value)}
        className="hidden"
        aria-hidden
      />
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          aria-label="Your email"
          className="min-w-0 flex-1 border border-ppa-line bg-white px-3 py-2.5 text-base text-ppa-navy outline-none focus:border-ppa-blue sm:text-sm"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="bg-ppa-blue px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-ppa-blue-deep disabled:bg-ppa-navy/20"
        >
          {status === "sending" ? "Sending…" : "Email my plan"}
        </button>
      </div>
      {status === "error" && <p className="mt-2 text-xs text-red-600">{msg}</p>}
    </form>
  );
}

function ShareButton() {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          /* clipboard blocked — the URL already reflects the trip */
        }
      }}
      className="bg-ppa-navy px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-ppa-navy-deep"
    >
      {copied ? "Link copied" : "Share this trip"}
    </button>
  );
}

/* ------------------------------------------------------------------ Icons
 * Inline SVG only — no emoji anywhere on this site. Stroke-based, currentColor,
 * so they inherit text color and size via className.
 */

type IconName = "ticket" | "ball" | "star" | "plane" | "car" | "check" | "calendar";

function Icon({ name, className }: { name: IconName; className?: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };
  switch (name) {
    case "ticket":
      return (
        <svg {...common}>
          <path d="M3 9a2 2 0 0 0 0 6v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2a2 2 0 0 0 0-6V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z" />
          <path d="M13 5v14" strokeDasharray="1.5 3" />
        </svg>
      );
    case "ball":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="9" cy="8.5" r="0.6" fill="currentColor" stroke="none" />
          <circle cx="15" cy="8.5" r="0.6" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="0.6" fill="currentColor" stroke="none" />
          <circle cx="9" cy="15.5" r="0.6" fill="currentColor" stroke="none" />
          <circle cx="15" cy="15.5" r="0.6" fill="currentColor" stroke="none" />
        </svg>
      );
    case "star":
      return (
        <svg {...common}>
          <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9z" />
        </svg>
      );
    case "plane":
      return (
        <svg {...common}>
          <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
        </svg>
      );
    case "car":
      return (
        <svg {...common}>
          <path d="M3 13l1.8-4.6A2 2 0 0 1 6.7 7h10.6a2 2 0 0 1 1.9 1.4L21 13v4a1 1 0 0 1-1 1h-1.5 M3 13v4a1 1 0 0 0 1 1h1.5 M3 13h18" />
          <circle cx="7.5" cy="17.5" r="1.6" />
          <circle cx="16.5" cy="17.5" r="1.6" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="M5 12.5 10 17l9-10" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="4.5" width="18" height="16" rx="2" />
          <path d="M3 9h18 M8 2.5v4 M16 2.5v4" />
        </svg>
      );
  }
}
