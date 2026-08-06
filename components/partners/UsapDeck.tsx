"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * USA Pickleball × Pickleball Inc — partnership presentation.
 *
 * A full-viewport slide deck rendered as a fixed overlay so it reads as a clean
 * on-screen presentation while still living at a real ppatour.com URL. It covers
 * the site chrome on purpose (this is a deck, not a browsable page) and locks
 * body scroll while mounted.
 *
 * ⚠ OUTWARD VISION ONLY. Governance-vs-commercialization, what each side does
 * best, our scale, and one connected pathway. No negotiating position, economics,
 * or org changes — those never touch this (public) repo.
 *
 * Brand: the deck ground is PPA navy; USA Pickleball's own red (#C8102E, taken
 * from their mark) is the shared thread that ties the two brands together, and
 * their slide flips to their natural white so their logo and colors read true.
 * PPA blue/sky carry our side.
 */

const SLIDES = 11;
const USAP_RED = "#C8102E";

type Dir = 1 | -1;

export function UsapDeck() {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState<Dir>(1);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const go = useCallback((n: number, d: Dir) => {
    setDir(d);
    setI((prev) => {
      const next = Math.max(0, Math.min(SLIDES - 1, n));
      return next === prev ? prev : next;
    });
  }, []);
  const next = useCallback(() => go(i + 1, 1), [go, i]);
  const prev = useCallback(() => go(i - 1, -1), [go, i]);

  // Lock scroll + broadcast a body flag (a hook for hiding site chrome if ever wanted).
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.dataset.deck = "usap";
    return () => {
      document.body.style.overflow = prevOverflow;
      delete document.body.dataset.deck;
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (["ArrowRight", "PageDown"].includes(e.key) || (e.key === " " && !e.shiftKey)) {
        e.preventDefault();
        next();
      } else if (["ArrowLeft", "PageUp"].includes(e.key) || (e.key === " " && e.shiftKey)) {
        e.preventDefault();
        prev();
      } else if (e.key === "Home") {
        e.preventDefault();
        go(0, -1);
      } else if (e.key === "End") {
        e.preventDefault();
        go(SLIDES - 1, 1);
      } else if (e.key === "f" || e.key === "F") {
        if (!document.fullscreenElement) void document.documentElement.requestFullscreen?.();
        else void document.exitFullscreen?.();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, go]);

  function onTouchStart(e: React.TouchEvent) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) (dx < 0 ? next : prev)();
    touchStart.current = null;
  }
  function onClick(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest("[data-nav]")) return;
    (e.clientX / window.innerWidth > 0.5 ? next : prev)();
  }

  return (
    <div
      className="usap-deck"
      onClick={onClick}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="region"
      aria-label="USA Pickleball partnership presentation"
    >
      <DeckStyles />

      {/* persistent top lockup */}
      <header className="usap-top" data-nav>
        <span className="usap-top-lockup">
          <b>USA&nbsp;Pickleball</b>
          <i aria-hidden>×</i>
          <b>Pickleball&nbsp;Inc</b>
        </span>
        <span className="usap-top-tag">Partnership Conversation</span>
      </header>

      {/* slides */}
      <Slide index={0} active={i} dir={dir}>
        <TitleSlide />
      </Slide>
      <Slide index={1} active={i} dir={dir}>
        <MomentSlide active={i === 1} />
      </Slide>
      <Slide index={2} active={i} dir={dir}>
        <LanesSlide />
      </Slide>
      <Slide index={3} active={i} dir={dir}>
        <TheirLaneSlide />
      </Slide>
      <Slide index={4} active={i} dir={dir}>
        <OurLaneSlide />
      </Slide>
      <Slide index={5} active={i} dir={dir}>
        <ScaleSlide active={i === 5} />
      </Slide>
      <Slide index={6} active={i} dir={dir}>
        <PathwaySlide />
      </Slide>
      <Slide index={7} active={i} dir={dir}>
        <WhyWinsSlide />
      </Slide>
      <Slide index={8} active={i} dir={dir}>
        <HorizonSlide />
      </Slide>
      <Slide index={9} active={i} dir={dir}>
        <QuoteSlide />
      </Slide>
      <Slide index={10} active={i} dir={dir}>
        <CloseSlide />
      </Slide>

      {/* progress */}
      <div className="usap-progress" aria-hidden>
        <span style={{ width: `${((i + 1) / SLIDES) * 100}%` }} />
      </div>

      {/* controls */}
      <div className="usap-controls" data-nav>
        <span className="usap-counter">
          <b>{String(i + 1).padStart(2, "0")}</b> / {String(SLIDES).padStart(2, "0")}
        </span>
        <div className="usap-nav">
          <button onClick={prev} aria-label="Previous slide" disabled={i === 0}>
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <button onClick={next} aria-label="Next slide" disabled={i === SLIDES - 1}>
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="usap-hint" aria-hidden>
        Arrow keys or click to advance · F for fullscreen
      </div>
    </div>
  );
}

/* ─────────────────────────── slide shell ─────────────────────────── */

function Slide({
  index,
  active,
  dir,
  children,
}: {
  index: number;
  active: number;
  dir: Dir;
  children: React.ReactNode;
}) {
  const state = index === active ? "active" : index < active ? "past" : "future";
  return (
    <section className="usap-slide" data-state={state} data-dir={dir} aria-hidden={state !== "active"}>
      <div className="usap-slide-inner">{children}</div>
    </section>
  );
}

function Eyebrow({ no, children, red }: { no: string; children: React.ReactNode; red?: boolean }) {
  return (
    <p className="usap-eyebrow" style={red ? { color: USAP_RED } : undefined}>
      <span>{no}</span>
      {children}
    </p>
  );
}

/* ─────────────────────────── logos ─────────────────────────── */

function UsapLogo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/ppa/partners/usa-pickleball-logo.png" alt="USA Pickleball" className={className} />
  );
}
function PpaLogo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/ppa/logos/ppa-horizontal-white.svg" alt="Carvana PPA Tour" className={className} />
  );
}

/* ─────────────────────────── slide 1 — title ─────────────────────────── */

function TitleSlide() {
  return (
    <div className="usap-title">
      <div className="usap-bg" style={{ backgroundImage: "url(/ppa/nationals-crowd-stadium.jpg)" }} />
      <div className="usap-scrim" />
      <div className="usap-title-body">
        <div className="usap-lockup-row">
          <span className="usap-plate usap-plate--light">
            <UsapLogo className="usap-plate-logo" />
          </span>
          <span className="usap-x">×</span>
          <span className="usap-plate usap-plate--dark">
            <PpaLogo className="usap-plate-logo" />
          </span>
        </div>
        <h1>
          One Aligned
          <br />
          <span style={{ color: USAP_RED }}>Ecosystem</span>
        </h1>
        <div className="usap-title-foot">
          <p>
            Two organizations, each doing what it does best — <strong>governing the game</strong> and{" "}
            <strong>growing the business of the game</strong> — pulling the same direction for the first time.
          </p>
          <span className="usap-date">
            Thursday · Aug 6, 2026
            <em>Salt Lake City</em>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── slide 2 — the moment ─────────────────────────── */

function MomentSlide({ active }: { active: boolean }) {
  return (
    <div className="usap-photo-slide">
      <div
        className={`usap-bg ${active ? "usap-kb" : ""}`}
        style={{ backgroundImage: "url(/ppa/tickets-worlds-crowd.jpg)" }}
      />
      <div className="usap-scrim usap-scrim--left" />
      <div className="usap-photo-body">
        <Eyebrow no="01">The Moment</Eyebrow>
        <h2>
          The fastest sport in
          <br />
          America has <span className="usap-accent-sky">outgrown</span>
          <br />
          its structure.
        </h2>
        <p className="usap-lede">
          Pickleball is no longer emerging. It is <strong>established</strong> — and the sport has reached the point
          where governing it and commercializing it are two different jobs, each best done by the organization built
          for it. Too many entities compete for the same players, sponsors, and attention. There is a better way to
          grow.
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────── slide 3 — two lanes ─────────────────────────── */

function LanesSlide() {
  return (
    <div className="usap-standard">
      <Eyebrow no="02">The Idea</Eyebrow>
      <h2 className="usap-h2-center">
        Two lanes. <span className="usap-accent-sky">One sport.</span>
      </h2>
      <div className="usap-lanes">
        <div className="usap-lane">
          <span className="usap-plate usap-plate--light usap-plate--sm">
            <UsapLogo className="usap-plate-logo" />
          </span>
          <h3 style={{ color: USAP_RED }}>Governance</h3>
          <ul className="usap-dots" data-tone="red">
            <li>
              The <strong>steward</strong> of the game
            </li>
            <li>The standard everyone plays by</li>
            <li>The keeper of the sport&rsquo;s integrity</li>
          </ul>
        </div>
        <div className="usap-net" aria-hidden>
          <span>THE&nbsp;LINE</span>
        </div>
        <div className="usap-lane">
          <span className="usap-plate usap-plate--dark usap-plate--sm">
            <PpaLogo className="usap-plate-logo" />
          </span>
          <h3 className="usap-accent-sky">Commercialization</h3>
          <ul className="usap-dots" data-tone="sky">
            <li>
              The <strong>engine</strong> of the game
            </li>
            <li>The reach, the revenue, the show</li>
            <li>The platform careers are built on</li>
          </ul>
        </div>
      </div>
      <p className="usap-lede usap-lede--center">
        Same net. Same court. Clear lines. Together we build <strong>one aligned ecosystem</strong> instead of many
        organizations rowing against each other.
      </p>
    </div>
  );
}

/* ─────────────────────────── slide 4 — their lane (light) ─────────────────────────── */

function TheirLaneSlide() {
  return (
    <div className="usap-standard usap-light">
      <Eyebrow no="03" red>
        USA Pickleball&rsquo;s Lane
      </Eyebrow>
      <div className="usap-split">
        <div>
          <span className="usap-plate usap-plate--light usap-plate--bare">
            <UsapLogo className="usap-plate-logo usap-plate-logo--lg" />
          </span>
          <h2 className="usap-dark-ink">
            Steward of
            <br />
            the <span style={{ color: USAP_RED }}>game.</span>
          </h2>
          <p className="usap-lede usap-lede--ink">
            USA Pickleball stays focused on what only a national governing body can do — and does it without the
            distraction of running a commercial business.
          </p>
        </div>
        <ul className="usap-capsule" data-tone="red">
          <li>
            Grow participation<span>The on-ramp for every new player in America</span>
          </li>
          <li>
            Youth, high school &amp; collegiate<span>Building the sport&rsquo;s next generation</span>
          </li>
          <li>
            The Olympic pathway<span>Carrying the flag toward the Games</span>
          </li>
          <li>
            Rules, officiating &amp; equipment standards<span>The integrity of the sport, protected</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

/* ─────────────────────────── slide 5 — our lane ─────────────────────────── */

function OurLaneSlide() {
  return (
    <div className="usap-standard">
      <Eyebrow no="04">Pickleball Inc&rsquo;s Lane</Eyebrow>
      <div className="usap-split">
        <ul className="usap-capsule" data-tone="sky">
          <li>
            Events &amp; live experiences<span>PPA Tour &amp; MLP — pro pickleball&rsquo;s biggest stage</span>
          </li>
          <li>
            Media &amp; broadcast<span>Pickleball.tv and a national broadcast footprint</span>
          </li>
          <li>
            Sponsorship &amp; partnerships<span>A proven engine bringing brands to the sport</span>
          </li>
          <li>
            Technology, membership &amp; fans<span>The digital home of the pickleball fan</span>
          </li>
        </ul>
        <div>
          <div className="usap-ourmarks">
            <PpaLogo className="usap-mark-ppa" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/pbtv/brand/pbtv-wordmark-white.svg" alt="Pickleball.tv" className="usap-mark-sm" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/ppa/ecosystem/pickleball-com-mark-white.svg"
              alt="Pickleball.com"
              className="usap-mark-sm"
            />
          </div>
          <h2>
            Engine of
            <br />
            the <span className="usap-accent-sky">game.</span>
          </h2>
          <p className="usap-lede">
            Pickleball Inc does what it has already proven it can do at national scale — and puts that machine to work
            behind the governing body.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── slide 6 — scale ─────────────────────────── */

const STATS = [
  { to: 24.3, dp: 1, suf: "M", label: "American players\nto reach & convert" },
  { to: 30.2, dp: 1, suf: "M", label: "Social impressions\nper tournament" },
  { to: 1.6, dp: 1, suf: "B", label: "Minutes watched\non Pickleball.tv" },
  { to: 60, dp: 0, suf: "K", label: "Fans at the\nWorld Championships" },
];
const NETWORKS = [
  { src: "/ppa/networks/espn.svg", alt: "ESPN" },
  { src: "/ppa/networks/fox.svg", alt: "FOX" },
  { src: "/ppa/networks/cbs.svg", alt: "CBS" },
  { src: "/ppa/networks/tennis-channel.svg", alt: "Tennis Channel" },
  { src: "/ppa/networks/pickleballtv-white.svg", alt: "Pickleball.tv", dark: true },
];

function ScaleSlide({ active }: { active: boolean }) {
  return (
    <div className="usap-standard">
      <Eyebrow no="05">What We Bring</Eyebrow>
      <h2>
        A commercial engine already
        <br />
        at <span className="usap-accent-sky">national scale.</span>
      </h2>
      <div className="usap-stats">
        {STATS.map((s) => (
          <div className="usap-stat" key={s.label}>
            <div className="usap-stat-num">
              <CountUp to={s.to} dp={s.dp} run={active} />
              <span className="usap-stat-suf">{s.suf}</span>
            </div>
            <div className="usap-stat-label">
              {s.label.split("\n").map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="usap-networks">
        <span className="usap-networks-cap">Seen on</span>
        {NETWORKS.map((n) => (
          <span className={`usap-net-chip ${n.dark ? "usap-net-chip--dark" : ""}`} key={n.alt}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={n.src} alt={n.alt} />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────── slide 7 — pathway ─────────────────────────── */

const RUNGS = [
  { step: "START", lvl: "Local Play", note: "Every community court, every rec player — the base of the sport." },
  { step: "RISE", lvl: "USA Pickleball Series", note: "Four premier national events, carrying real meaning and points." },
  { step: "PEAK", lvl: "Nationals", note: "The Series culminates in the National Championships." },
  { step: "SUMMIT", lvl: "World Championships", note: "From your home court to the biggest stage in the sport." },
];

function PathwaySlide() {
  return (
    <div className="usap-standard">
      <Eyebrow no="06">One Competitive Pathway</Eyebrow>
      <h2 className="usap-h2-center">One ladder every player can climb.</h2>
      <div className="usap-ladder">
        {RUNGS.map((r, idx) => (
          <div className="usap-rung" key={r.lvl} data-peak={idx === RUNGS.length - 1}>
            <span className="usap-rung-step">{r.step}</span>
            <span className="usap-rung-lvl">{r.lvl}</span>
            <p>{r.note}</p>
          </div>
        ))}
      </div>
      <p className="usap-lede usap-lede--center">
        A single, connected journey — from a first game to a world title — under one aligned banner.
      </p>
    </div>
  );
}

/* ─────────────────────────── slide 8 — why it wins ─────────────────────────── */

const CARDS = [
  {
    k: "For players",
    tone: "red",
    body: "One membership, one calendar, one clear path from the local court to the national stage — instead of competing systems to navigate.",
  },
  {
    k: "For sponsors",
    tone: "sky",
    body: "One aligned story and one front door to the entire sport — amateur and pro — not a fragmented market splitting the same dollars.",
  },
  {
    k: "For the sport",
    tone: "red",
    body: "Energy and investment compounding in one direction, so the whole game grows faster than any organization could alone.",
  },
];

function WhyWinsSlide() {
  return (
    <div className="usap-standard">
      <Eyebrow no="07">Why It Wins</Eyebrow>
      <h2 className="usap-h2-center">One ecosystem the whole sport feels.</h2>
      <div className="usap-cards">
        {CARDS.map((c) => (
          <div className="usap-card" key={c.k}>
            <div className="usap-card-k" style={{ color: c.tone === "red" ? USAP_RED : undefined }}>
              {c.k}
            </div>
            <p>{c.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────── slide 9 — horizon ─────────────────────────── */

function HorizonSlide() {
  return (
    <div className="usap-photo-slide">
      <div className="usap-bg" style={{ backgroundImage: "url(/ppa/nationals-drone-sunset.jpg)" }} />
      <div className="usap-scrim usap-scrim--left" />
      <div className="usap-photo-body">
        <Eyebrow no="08">The Horizon</Eyebrow>
        <h2>
          From a first game to
          <br />
          the <span className="usap-accent-gold">Olympic</span> dream.
        </h2>
        <p className="usap-lede">
          The same idea that unifies the sport at home points toward one clear international pathway — local courts, to
          national championships, to a true World Championship, to the Games — with USA Pickleball helping lead the way
          rather than competing for the same ground. <strong>One sport, one direction, one future.</strong>
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────── slide 10 — quote ─────────────────────────── */

function QuoteSlide() {
  return (
    <div className="usap-photo-slide">
      <div className="usap-bg" style={{ backgroundImage: "url(/ppa/action-champ-sunday.jpg)" }} />
      <div className="usap-scrim" />
      <div className="usap-photo-body usap-quote-body">
        <Eyebrow no="09">The Case</Eyebrow>
        <blockquote>
          Better for the sport <span style={{ color: USAP_RED }}>together</span> than apart.
        </blockquote>
        <p className="usap-attrib">
          Each organization in its strongest position — a durable partnership that outlasts any single deal, owner, or
          season.
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────── slide 11 — close ─────────────────────────── */

const STEPS = [
  { n: "Step 01", t: "Agree we share the vision for the sport." },
  { n: "Step 02", t: "Stand up a small working group together." },
  { n: "Step 03", t: "Shape the framework toward definitive terms." },
];

function CloseSlide() {
  return (
    <div className="usap-photo-slide">
      <div className="usap-bg" style={{ backgroundImage: "url(/ppa/nationals-championship-court.jpg)" }} />
      <div className="usap-scrim" />
      <div className="usap-photo-body">
        <Eyebrow no="10">Let&rsquo;s Build It</Eyebrow>
        <h1 className="usap-close-h1">
          Let&rsquo;s build it
          <br />
          <span className="usap-accent-gold">together.</span>
        </h1>
        <p className="usap-lede">
          We&rsquo;re not here to hand over a contract today. We&rsquo;re here to see if we share the{" "}
          <strong>vision</strong> — and, if we do, to start shaping the framework side by side.
        </p>
        <div className="usap-steps">
          {STEPS.map((s) => (
            <div className="usap-step" key={s.n}>
              <h4>{s.n}</h4>
              <p>{s.t}</p>
            </div>
          ))}
        </div>
        <div className="usap-signoff">
          <span className="usap-plate usap-plate--light usap-plate--sm">
            <UsapLogo className="usap-plate-logo" />
          </span>
          <span className="usap-x usap-x--sm">×</span>
          <PpaLogo className="usap-signoff-ppa" />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── count-up ─────────────────────────── */

function CountUp({ to, dp, run }: { to: number; dp: number; run: boolean }) {
  const [v, setV] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    if (!run || done.current) return;
    done.current = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const start = performance.now();
    const dur = reduce ? 0 : 1200;
    // rAF from the first frame (never a synchronous setState in the effect body).
    const tick = (t: number) => {
      const p = dur === 0 ? 1 : Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setV(to * e);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, to]);
  return <>{v.toFixed(dp)}</>;
}

/* ─────────────────────────── styles ─────────────────────────── */

function DeckStyles() {
  return (
    <style>{`
.usap-deck{
  position:fixed; inset:0; z-index:60; overflow:hidden;
  font-family:var(--font-gotham), ui-sans-serif, system-ui, sans-serif;
  color:#F3F6FC; cursor:default; -webkit-font-smoothing:antialiased;
  background:
    radial-gradient(120% 80% at 80% -10%, rgba(200,16,46,.20), transparent 55%),
    radial-gradient(110% 90% at 10% 115%, rgba(34,139,230,.20), transparent 55%),
    linear-gradient(160deg, #061229, #05233F 70%);
}
.usap-deck *{box-sizing:border-box}

/* top bar */
.usap-top{position:absolute;top:0;left:0;right:0;z-index:20;display:flex;align-items:center;
  justify-content:space-between;padding:clamp(14px,2.2vw,24px) clamp(20px,4vw,64px);
  text-transform:uppercase;letter-spacing:.16em;font-size:clamp(9px,1vw,11px);color:#9FB4D6}
.usap-top-lockup{display:flex;align-items:center;gap:.7em}
.usap-top-lockup b{color:#fff;font-weight:700}
.usap-top-lockup i{color:${USAP_RED};font-style:normal;font-weight:700}
.usap-top-tag{color:#6E86AD}

/* slide shell */
.usap-slide{position:absolute;inset:0;z-index:1;display:flex;align-items:center;justify-content:center;
  padding:clamp(64px,10vh,104px) clamp(24px,5vw,80px);opacity:0;visibility:hidden;
  transform:translateY(14px);transition:opacity .5s ease,transform .6s cubic-bezier(.2,.7,.2,1),visibility .5s}
.usap-slide[data-state="active"]{opacity:1;visibility:visible;transform:none;z-index:2}
.usap-slide[data-state="past"]{transform:translateY(-14px)}
.usap-slide-inner{width:100%;max-width:1160px;margin:0 auto}

/* type */
.usap-eyebrow{display:flex;align-items:center;gap:.9em;text-transform:uppercase;letter-spacing:.24em;
  font-weight:700;font-size:clamp(10px,1.15vw,13px);color:#E7C079;margin:0 0 clamp(16px,2.5vh,28px)}
.usap-eyebrow>span{color:${USAP_RED}}
.usap-eyebrow::after{content:"";flex:0 0 auto;width:clamp(24px,4vw,56px);height:1px;background:rgba(159,180,214,.34)}
.usap-deck h1{font-family:var(--font-gotham);font-weight:900;line-height:.94;letter-spacing:-.02em;
  text-transform:uppercase;text-wrap:balance;font-size:clamp(42px,8vw,112px);margin:0}
.usap-deck h2{font-family:var(--font-gotham);font-weight:900;line-height:.98;letter-spacing:-.015em;
  text-transform:uppercase;text-wrap:balance;font-size:clamp(30px,5.2vw,66px);margin:0}
.usap-h2-center{margin-bottom:clamp(8px,1.5vh,16px)}
.usap-accent-sky{color:#4DC1EF}
.usap-accent-gold{color:#E7C079}
.usap-lede{font-size:clamp(15px,1.75vw,22px);line-height:1.45;color:#B7C6E0;max-width:60ch;
  margin:clamp(18px,3vh,30px) 0 0;font-weight:400}
.usap-lede strong{color:#fff;font-weight:600}
.usap-lede--center{margin-left:auto;margin-right:auto;text-align:center}
.usap-lede--ink{color:#3d4f66}
.usap-lede--ink strong{color:#0b1b30}

/* light slide */
.usap-light{--ink:#0b1b30}
.usap-dark-ink{color:#0b1b30}

/* title */
.usap-title,.usap-photo-slide{position:relative;width:100%;height:100%;display:flex;align-items:center}
.usap-bg{position:absolute;inset:0;background-size:cover;background-position:center;z-index:0}
.usap-kb{animation:usap-kb 16s cubic-bezier(.2,.6,.4,1) both}
@keyframes usap-kb{from{transform:scale(1.09)}to{transform:scale(1)}}
.usap-scrim{position:absolute;inset:0;z-index:1;background:
  linear-gradient(180deg, rgba(5,15,32,.55), rgba(5,15,32,.72)),
  linear-gradient(90deg, rgba(5,15,32,.86), rgba(5,15,32,.35) 60%, rgba(5,15,32,.5))}
.usap-scrim--left{background:linear-gradient(90deg, rgba(5,15,32,.92) 0%, rgba(5,15,32,.72) 42%, rgba(5,15,32,.35) 100%)}
.usap-title-body,.usap-photo-body{position:relative;z-index:2;width:100%;max-width:1160px;
  margin:0 auto;padding:0 clamp(4px,2vw,20px)}
.usap-title h1{font-size:clamp(46px,9.6vw,150px);margin-top:clamp(20px,3.5vh,40px)}

.usap-lockup-row{display:flex;align-items:center;gap:clamp(14px,2.4vw,30px)}
.usap-x{font-family:var(--font-gotham);font-weight:900;color:${USAP_RED};font-size:clamp(22px,3vw,40px)}
.usap-x--sm{font-size:clamp(16px,2vw,24px)}
.usap-plate{display:inline-flex;align-items:center;justify-content:center;border-radius:14px;
  padding:clamp(12px,1.4vw,18px) clamp(16px,1.8vw,24px)}
.usap-plate--light{background:#fff;box-shadow:0 10px 40px rgba(0,0,0,.35)}
.usap-plate--dark{background:rgba(255,255,255,.05);border:1px solid rgba(159,180,214,.28)}
.usap-plate--sm{padding:9px 13px;border-radius:11px}
.usap-plate--bare{padding:0;background:none;box-shadow:none;margin-bottom:clamp(16px,2.4vh,26px)}
.usap-plate-logo{height:clamp(34px,4vw,58px);width:auto;display:block}
.usap-plate--sm .usap-plate-logo{height:clamp(26px,2.6vw,36px)}
.usap-plate-logo--lg{height:clamp(52px,7vw,104px)}

.usap-title-foot{display:flex;flex-wrap:wrap;gap:clamp(18px,4vw,56px);align-items:flex-end;
  justify-content:space-between;margin-top:clamp(22px,4vh,42px)}
.usap-title-foot p{max-width:46ch;font-size:clamp(14px,1.6vw,20px);line-height:1.45;color:#C4D2E8;margin:0}
.usap-title-foot strong{color:#fff;font-weight:600}
.usap-date{text-transform:uppercase;letter-spacing:.12em;font-size:clamp(11px,1.2vw,14px);font-weight:600;
  color:#E7C079;border-left:2px solid ${USAP_RED};padding-left:14px;line-height:1.5;white-space:nowrap}
.usap-date em{display:block;font-style:normal;color:#6E86AD}

/* photo-body slides */
.usap-photo-body h2{margin-top:0}
.usap-quote-body{max-width:22ch}
.usap-quote-body blockquote{font-family:var(--font-gotham);font-weight:900;text-transform:uppercase;
  line-height:1;letter-spacing:-.02em;font-size:clamp(32px,6vw,84px);margin:0;text-wrap:balance}
.usap-attrib{text-transform:uppercase;letter-spacing:.14em;font-size:clamp(11px,1.2vw,14px);color:#9FB4D6;
  margin-top:clamp(18px,3vh,30px);line-height:1.6;max-width:44ch}

/* standard slide */
.usap-standard{width:100%}

/* lanes */
.usap-lanes{display:grid;grid-template-columns:1fr auto 1fr;gap:0;margin-top:clamp(20px,3.2vh,38px);align-items:stretch}
.usap-lane{padding:clamp(14px,2vw,26px) clamp(16px,2.4vw,36px)}
.usap-lane h3{text-transform:uppercase;letter-spacing:.16em;font-size:clamp(12px,1.3vw,15px);font-weight:700;
  margin:clamp(12px,1.8vh,18px) 0 .8em}
.usap-dots{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:.55em}
.usap-dots li{position:relative;padding-left:1.1em;font-size:clamp(13px,1.35vw,17px);color:#B7C6E0;line-height:1.3}
.usap-dots li strong{color:#fff;font-weight:600}
.usap-dots li::before{content:"";position:absolute;left:0;top:.55em;width:6px;height:6px;border-radius:50%}
.usap-dots[data-tone="red"] li::before{background:${USAP_RED}}
.usap-dots[data-tone="sky"] li::before{background:#4DC1EF}
.usap-net{width:3px;align-self:stretch;background:linear-gradient(${USAP_RED},#4DC1EF);position:relative;border-radius:2px}
.usap-net span{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-90deg);
  background:#05233F;padding:6px 0;font-size:10px;letter-spacing:.3em;color:#6E86AD;white-space:nowrap}

/* split */
.usap-split{display:grid;grid-template-columns:1.02fr .98fr;gap:clamp(26px,5vw,72px);align-items:center;
  margin-top:clamp(10px,2vh,20px)}
.usap-capsule{list-style:none;margin:0;padding:clamp(18px,2.4vw,30px);border-radius:16px;display:grid;
  gap:.85em;background:linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,0))}
.usap-capsule[data-tone="red"]{border:1px solid rgba(200,16,46,.4)}
.usap-capsule[data-tone="sky"]{border:1px solid rgba(77,193,239,.4)}
.usap-capsule li{position:relative;padding-left:1.7em;font-size:clamp(14px,1.5vw,19px);line-height:1.3;
  color:#fff;font-weight:600}
.usap-capsule li span{display:block;font-weight:400;font-size:.8em;color:#B7C6E0;margin-top:.15em}
.usap-capsule li::before{content:"";position:absolute;left:0;top:.15em;width:1.05em;height:1.05em;border-radius:5px}
.usap-capsule[data-tone="red"] li::before{background:rgba(200,16,46,.18);border:1px solid ${USAP_RED}}
.usap-capsule[data-tone="sky"] li::before{background:rgba(77,193,239,.16);border:1px solid #4DC1EF}

/* light-slide overrides */
.usap-light{background:#F3F6FC;border-radius:0}
.usap-slide[data-state] .usap-light{color:#0b1b30}
.usap-light .usap-lede{color:#41536b}
.usap-light .usap-lede strong{color:#0b1b30}
.usap-light .usap-capsule{background:#fff;box-shadow:0 12px 40px rgba(11,27,48,.10)}
.usap-light .usap-capsule li{color:#0b1b30}
.usap-light .usap-capsule li span{color:#5a6b82}
.usap-light-wrap{position:absolute;inset:0}

/* our marks row */
.usap-ourmarks{display:flex;align-items:center;gap:clamp(16px,2.4vw,32px);margin-bottom:clamp(16px,2.4vh,26px);
  flex-wrap:wrap}
.usap-mark-ppa{height:clamp(26px,3vw,40px);width:auto}
.usap-mark-sm{height:clamp(18px,2vw,26px);width:auto;opacity:.9}

/* stats */
.usap-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:clamp(14px,2vw,26px);margin-top:clamp(26px,4.5vh,48px)}
.usap-stat{border-top:2px solid rgba(159,180,214,.34);padding-top:clamp(10px,1.6vh,16px)}
.usap-stat-num{font-family:var(--font-gotham);font-weight:900;line-height:.9;letter-spacing:-.02em;
  font-size:clamp(34px,5.4vw,70px);font-variant-numeric:tabular-nums;color:#fff}
.usap-stat-suf{color:#E7C079;font-size:.5em;margin-left:.04em}
.usap-stat-label{display:flex;flex-direction:column;text-transform:uppercase;letter-spacing:.12em;
  font-size:clamp(10px,1.05vw,12.5px);color:#9FB4D6;margin-top:.85em;line-height:1.45}
.usap-networks{display:flex;align-items:center;gap:clamp(10px,1.4vw,16px);flex-wrap:wrap;margin-top:clamp(24px,4vh,42px)}
.usap-networks-cap{text-transform:uppercase;letter-spacing:.16em;font-size:11px;color:#6E86AD;margin-right:.4em}
.usap-net-chip{display:inline-flex;align-items:center;justify-content:center;background:#fff;border-radius:8px;
  height:clamp(30px,3.4vw,42px);padding:0 clamp(10px,1.2vw,16px)}
.usap-net-chip img{height:clamp(13px,1.5vw,18px);width:auto;display:block}
.usap-net-chip--dark{background:#0b1b30;border:1px solid rgba(159,180,214,.25)}

/* ladder */
.usap-ladder{display:flex;flex-wrap:wrap;margin-top:clamp(24px,4.2vh,50px)}
.usap-rung{flex:1 1 0;min-width:150px;padding:clamp(14px,2vw,24px) clamp(12px,1.7vw,22px);position:relative}
.usap-rung+.usap-rung{border-left:1px solid rgba(159,180,214,.18)}
.usap-rung-step{text-transform:uppercase;letter-spacing:.2em;font-size:clamp(10px,1vw,12px);color:#6E86AD}
.usap-rung-lvl{display:block;font-family:var(--font-gotham);font-weight:900;text-transform:uppercase;
  letter-spacing:-.01em;line-height:1;font-size:clamp(18px,2.2vw,30px);margin:.5em 0 .35em}
.usap-rung p{font-size:clamp(12px,1.25vw,15px);color:#9FB4D6;line-height:1.35;margin:0}
.usap-rung[data-peak="true"] .usap-rung-lvl{color:#E7C079}
.usap-rung[data-peak="true"]::after{content:"";position:absolute;inset:0;border-radius:12px;
  background:linear-gradient(180deg, rgba(231,192,121,.12), transparent);pointer-events:none}

/* cards */
.usap-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(14px,2vw,22px);margin-top:clamp(26px,4.4vh,48px)}
.usap-card{border:1px solid rgba(159,180,214,.2);border-radius:14px;padding:clamp(18px,2.2vw,28px);
  background:linear-gradient(180deg, rgba(255,255,255,.03), transparent)}
.usap-card-k{font-family:var(--font-gotham);font-weight:900;text-transform:uppercase;letter-spacing:-.01em;
  font-size:clamp(19px,2.2vw,28px);color:#4DC1EF}
.usap-card p{margin:.6em 0 0;font-size:clamp(13px,1.35vw,16px);color:#B7C6E0;line-height:1.4}

/* close */
.usap-close-h1{font-size:clamp(44px,8.6vw,128px)}
.usap-steps{display:flex;flex-wrap:wrap;gap:clamp(14px,2vw,22px);margin-top:clamp(26px,4vh,44px)}
.usap-step{flex:1 1 200px;border-left:2px solid ${USAP_RED};padding-left:15px}
.usap-step:nth-child(2){border-color:#E7C079}
.usap-step:nth-child(3){border-color:#4DC1EF}
.usap-step h4{text-transform:uppercase;letter-spacing:.16em;font-size:clamp(10px,1.1vw,13px);color:#9FB4D6;margin:0 0 .5em}
.usap-step p{font-size:clamp(14px,1.5vw,18px);color:#fff;line-height:1.35;margin:0}
.usap-signoff{display:flex;align-items:center;gap:clamp(14px,2vw,26px);margin-top:clamp(28px,4.5vh,52px)}
.usap-signoff-ppa{height:clamp(24px,2.8vw,36px);width:auto}

/* progress */
.usap-progress{position:absolute;left:0;right:0;bottom:0;height:3px;z-index:20;background:rgba(255,255,255,.07)}
.usap-progress span{display:block;height:100%;background:linear-gradient(90deg,${USAP_RED},#E7C079);
  transition:width .55s cubic-bezier(.5,.05,.2,1)}

/* controls */
.usap-controls{position:absolute;right:clamp(20px,4vw,64px);bottom:clamp(16px,3vh,32px);z-index:20;
  display:flex;align-items:center;gap:14px}
.usap-counter{text-transform:uppercase;letter-spacing:.14em;font-size:clamp(11px,1.1vw,13px);color:#9FB4D6}
.usap-counter b{color:#fff;font-weight:700}
.usap-nav{display:flex;gap:8px}
.usap-nav button{width:clamp(34px,3.2vw,42px);height:clamp(34px,3.2vw,42px);display:grid;place-items:center;
  border-radius:50%;border:1px solid rgba(159,180,214,.34);background:transparent;color:#9FB4D6;cursor:pointer;
  transition:.2s ease}
.usap-nav button:hover:not(:disabled){color:#fff;border-color:${USAP_RED};background:rgba(200,16,46,.16)}
.usap-nav button:disabled{opacity:.3;cursor:default}
.usap-nav button:focus-visible{outline:2px solid #E7C079;outline-offset:2px}
.usap-nav svg{width:44%;height:44%;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.usap-hint{position:absolute;left:clamp(20px,4vw,64px);bottom:clamp(16px,3vh,32px);z-index:20;
  text-transform:uppercase;letter-spacing:.16em;font-size:clamp(9px,1vw,11px);color:#5E77A0}

@media (max-width:820px){
  .usap-lanes{grid-template-columns:1fr;gap:16px}
  .usap-net{width:auto;height:2px}
  .usap-net span{transform:translate(-50%,-50%)}
  .usap-split{grid-template-columns:1fr;gap:22px}
  .usap-stats{grid-template-columns:repeat(2,1fr)}
  .usap-cards{grid-template-columns:1fr}
}
@media (max-width:600px){
  .usap-hint,.usap-top-tag{display:none}
  .usap-title-foot{flex-direction:column;align-items:flex-start;gap:16px}
}
@media (prefers-reduced-motion: reduce){
  .usap-slide{transition:opacity .001s,visibility .001s;transform:none}
  .usap-kb{animation:none}
  .usap-progress span{transition:none}
}
`}</style>
  );
}
