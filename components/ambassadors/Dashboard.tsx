"use client";

import { useState } from "react";
import type { Board, Ev, LbRow, Me, MeData, Shared, Tournament } from "@/components/ambassadors/types";
import { GraphicsTab } from "@/components/ambassadors/GraphicsTab";
import { fmtDate, int, logoBox, money, money2, pct, statusPill } from "@/components/ambassadors/format";

const TABS: [string, string][] = [
  ["home", "Home"],
  ["results", "My tournaments"],
  ["boards", "Leaderboards"],
  ["graphics", "Graphics"],
  ["how", "How it works"],
];

export function Dashboard({ data, canUpload = false }: { data: MeData; canUpload?: boolean }) {
  const { me, shared } = data;
  const [tab, setTab] = useState<string>("home");
  const showComm = !me.hideCommission;
  const ev = (id: string): Ev | undefined => shared.events.find((e) => e.id === id);

  function go(t: string) {
    setTab(t);
    window.scrollTo(0, 0);
  }

  async function signOut() {
    try {
      await fetch("/api/ambassadors/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    window.location.href = "/ambassadors";
  }

  return (
    <>
      <header className="top">
        <div className="top-in">
          <div className="who">
            <div>
              <span className="eyebrow" style={{ color: "#E8BC4E" }}>
                PPA Tour ambassador · {me.pod.name} pod
              </span>
              <h1>Hi, {me.firstName}</h1>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
              <div className="codes">
                {me.codes.map((c) => (
                  <span className="codechip" key={c}>
                    {c}
                  </span>
                ))}
              </div>
              <button className="signout" onClick={signOut}>
                Sign out
              </button>
            </div>
          </div>
          <nav className="tabs" aria-label="Sections">
            {TABS.map(([k, l]) => (
              <button key={k} onClick={() => go(k)} aria-current={tab === k ? "page" : undefined}>
                {l}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main>
        {data.preview && (
          <div className="note">Preview — sample data, not live. Numbers and names here are fictional.</div>
        )}
        {tab === "home" && <Home me={me} ev={ev} go={go} showComm={showComm} />}
        {tab === "results" && <Results me={me} go={go} showComm={showComm} payoutMin={shared.program.payoutMinimum} />}
        {tab === "boards" && <Boards shared={shared} ev={ev} />}
        {tab === "graphics" && <GraphicsTab me={me} shared={shared} canUpload={canUpload} />}
        {tab === "how" && <How shared={shared} />}
      </main>
    </>
  );
}

/* ------------------------------- Home ---------------------------------- */

function Home({
  me,
  ev,
  go,
  showComm,
}: {
  me: Me;
  ev: (id: string) => Ev | undefined;
  go: (t: string) => void;
  showComm: boolean;
}) {
  const s = me.season;
  const r = me.rewards;
  const sr = me.seasonRank;
  const openLines = me.tournaments.filter((l) => l.nextTier);

  return (
    <>
      <section className="sec">
        <div className="stats">
          <div className="stat">
            <span className="v hi">{showComm ? money2(s.commission) : "—"}</span>
            <span className="l">Commission earned this fall</span>
          </div>
          <div className="stat">
            <span className="v">{int(s.registrations)}</span>
            <span className="l">Players registered with your code</span>
          </div>
          <div className="stat">
            <span className="v">{int(s.tickets)}</span>
            <span className="l">Tickets sold with your code</span>
          </div>
          <div className="stat">
            <span className="v">
              {sr.registrations ? "#" + sr.registrations.rank : "—"}
              <span style={{ fontSize: "1rem", color: "var(--amb-ink-3)" }}> · </span>
              {sr.tickets ? "#" + sr.tickets.rank : "—"}
            </span>
            <span className="l">Season rank: registrations · tickets</span>
          </div>
        </div>
      </section>

      {openLines.length > 0 && (
        <section className="sec">
          <div className="sec-h">
            <h2>Your next rate</h2>
            <span className="sub">Your rate goes up as more players register with your code at each tournament</span>
          </div>
          <div className="nudges">
            {openLines.map((l) => {
              const nt = l.nextTier!;
              const goal = l.registrations + nt.need;
              const event = ev(l.event);
              return (
                <div className="nudge" key={l.event}>
                  <span className="eyebrow">
                    {l.eventName} · {pct(nt.fromPct || 0)} now
                  </span>
                  <div className="t">
                    {nt.need} more registration{nt.need === 1 ? "" : "s"} moves you to {pct(nt.toPct)}
                  </div>
                  <div className="bar">
                    <span style={{ width: `${Math.min(100, (l.registrations / goal) * 100)}%` }} />
                  </div>
                  <div className="d">
                    {showComm ? (
                      <>
                        That&apos;s about <b>{money(nt.estGain)}</b> more commission, because the new rate applies to every registration at {l.eventName}.{" "}
                      </>
                    ) : (
                      <>Your rate applies to every registration at {l.eventName}. </>
                    )}
                    {event ? <>Registration closes {fmtDate(event.regClose)}.</> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="sec">
        <div className="sec-h">
          <h2>Rewards</h2>
          <span className="sub">Earned on top of commission</span>
        </div>
        <div className="nudges">
          <div className="nudge gold">
            <span className="eyebrow">Comp registrations</span>
            <div className="t">{int(r.compRegistrations)} earned</div>
            <div className="bar">
              <span style={{ width: `${((5 - r.toNextComp) / 5) * 100}%` }} />
            </div>
            <div className="d">
              1 free registration for every 5 players who register with your code. {r.toNextComp} more to your next one.
            </div>
          </div>
          <div className="nudge gold">
            <span className="eyebrow">Courtside tickets</span>
            <div className="t">{int(r.courtsideTickets)} earned</div>
            <div className="bar">
              <span style={{ width: `${((7 - r.toNextCourtside) / 7) * 100}%` }} />
            </div>
            <div className="d">
              1 courtside ticket for every 7 tickets sold. {r.toNextCourtside} more to your next one. Ask Amie to redeem (subject to availability).
            </div>
          </div>
        </div>
      </section>

      <section className="grid2">
        <div className="card pad sec">
          <div className="sec-h">
            <h2 style={{ fontSize: "1.45rem" }}>Tournaments you can promote</h2>
          </div>
          <div className="up">
            {me.upcoming.length === 0 && <div className="empty">No tournaments on sale right now.</div>}
            {me.upcoming.map((u) => {
              const e = ev(u.event);
              if (!e) return null;
              const l = me.tournaments.find((x) => x.event === u.event);
              return (
                <div className="up-i" key={u.event}>
                  {logoBox(e, 44)}
                  <div>
                    <div className="up-n">
                      {e.name} {statusPill(e.status)}
                    </div>
                    <div className="up-d">
                      {fmtDate(e.start)} – {fmtDate(e.end)} · {e.city} · code <b className="num">{u.code}</b>
                    </div>
                    <div className="up-d">
                      {l ? `${int(l.registrations)} registrations · ${int(l.tickets)} tickets so far` : "No sales yet"}
                      {e.status === "on-sale" ? ` · reg closes ${fmtDate(e.regClose)}` : ""}
                    </div>
                  </div>
                  <button className="btn ghost" style={{ padding: "6px 10px", fontSize: ".85rem" }} onClick={() => go("graphics")}>
                    Graphics
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card pad pod">
          <span className="eyebrow">Your pod</span>
          <div className="n">{me.pod.name}</div>
          <p style={{ color: "var(--amb-ink-2)" }}>
            {me.pod.lead
              ? `Your pod lead is ${me.pod.lead}. They're your go-to for local events, ideas and anything you need.`
              : "Your pod lead will introduce themselves soon. They'll be your go-to for local events, ideas and anything you need."}
          </p>
          {me.pod.leadEmail && (
            <a className="btn" href={`mailto:${me.pod.leadEmail}`}>
              Email your pod lead
            </a>
          )}
          <p className="sub">Questions about payouts? Reply to Amie&apos;s weekly ambassador email.</p>
        </div>
      </section>
    </>
  );
}

/* --------------------------- My tournaments ---------------------------- */

function Results({
  me,
  go,
  showComm,
  payoutMin,
}: {
  me: Me;
  go: (t: string) => void;
  showComm: boolean;
  payoutMin: number;
}) {
  if (!me.tournaments.length) {
    return (
      <section className="sec">
        <div className="sec-h">
          <h2>My tournaments</h2>
        </div>
        <div className="empty">
          No sales yet this fall. Share your graphics and code for an on-sale tournament. Your numbers show up here the morning after your first sale.
        </div>
        <div>
          <button className="btn" onClick={() => go("graphics")}>
            Get your graphics
          </button>
        </div>
      </section>
    );
  }
  const sum = (k: keyof Tournament) => me.tournaments.reduce((a, l) => a + (Number(l[k]) || 0), 0);
  const dollars = (n: number) => (showComm ? money2(n) : "—");

  return (
    <>
      <section className="sec">
        <div className="sec-h">
          <h2>My tournaments</h2>
          <span className="sub">Updated every morning</span>
        </div>
        <div className="tscroll">
          <table>
            <thead>
              <tr>
                <th>Tournament</th>
                <th>Code</th>
                <th className="r">Registrations</th>
                <th className="r">Your rate</th>
                <th className="r">Reg. commission</th>
                <th className="r">Tickets</th>
                <th className="r">Ticket commission</th>
                <th className="r">Total</th>
                <th>Payout</th>
              </tr>
            </thead>
            <tbody>
              {me.tournaments
                .slice()
                .reverse()
                .map((l) => (
                  <tr key={l.event}>
                    <td>
                      <b>{l.eventName}</b> {statusPill(l.eventStatus)}
                    </td>
                    <td className="num">{l.code}</td>
                    <td className="r num">{int(l.registrations)}</td>
                    <td className="r num">{l.registrations ? pct(l.ratePct) : "—"}</td>
                    <td className="r num">{dollars(l.registrationCommission)}</td>
                    <td className="r num">{int(l.tickets)}</td>
                    <td className="r num">{dollars(l.ticketCommission)}</td>
                    <td className="r num">
                      <b>{dollars(l.commission)}</b>
                    </td>
                    <td>
                      <span className={`pill ${l.payoutStatus === "Paid" ? "p-good" : l.payoutStatus === "Pending" ? "p-dim" : "p-amber"}`}>
                        {l.payoutStatus}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
            <tfoot>
              <tr>
                <td>This fall</td>
                <td />
                <td className="r num">{int(sum("registrations"))}</td>
                <td />
                <td className="r num">{dollars(sum("registrationCommission"))}</td>
                <td className="r num">{int(sum("tickets"))}</td>
                <td className="r num">{dollars(sum("ticketCommission"))}</td>
                <td className="r num">{dollars(sum("commission"))}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="sub">
          Commission counts net sales: refunds and withdrawals come off. Payouts under ${payoutMin} roll over to the next payout.
        </p>
      </section>

      <section className="sec">
        <div className="sec-h">
          <h2>All-time</h2>
        </div>
        <div className="stats">
          <div className="stat">
            <span className="v">{int(me.lifetime.tournaments)}</span>
            <span className="l">Tournaments worked</span>
          </div>
          <div className="stat">
            <span className="v">{int(me.lifetime.registrations)}</span>
            <span className="l">Registrations</span>
          </div>
          <div className="stat">
            <span className="v">{money(me.lifetime.revenue)}</span>
            <span className="l">Revenue you&apos;ve driven</span>
          </div>
          <div className="stat">
            <span className="v hi">{showComm ? money(me.lifetime.commission) : "—"}</span>
            <span className="l">Commission earned</span>
          </div>
        </div>
      </section>
    </>
  );
}

/* ----------------------------- Leaderboards ---------------------------- */

function Boards({ shared, ev }: { shared: Shared; ev: (id: string) => Ev | undefined }) {
  const [scope, setScope] = useState<string>("season");
  const scopes: [string, string][] = [["season", "Fall season"], ...Object.keys(shared.leaderboards.events).map((id) => [id, ev(id)?.name ?? id] as [string, string])];
  const board: Board = scope === "season" ? shared.leaderboards.season : shared.leaderboards.events[scope];

  const renderRow = (r: LbRow) => (
    <li className={`${r.rank <= 5 ? "prize" : ""} ${r.isYou ? "me" : ""}`} key={`${r.rank}-${r.name}`}>
      <span className="rk">{r.rank}</span>
      <span>
        {r.name}
        {r.isYou && <span className="you">YOU</span>}
      </span>
      <span className="pts">{int(r.points)}</span>
    </li>
  );
  const renderOne = (rows: LbRow[], title: string) => {
    const top = rows.slice(0, 10);
    const mine = rows.find((r) => r.isYou);
    const showMine = mine && !top.includes(mine);
    return (
      <div>
        <div className="bh">
          <h3>{title}</h3>
          <span className="eyebrow">points</span>
        </div>
        {rows.length ? (
          <ol className="lb">
            {top.map(renderRow)}
            {showMine && (
              <>
                <li className="gap" key="gap">…</li>
                {renderRow(mine!)}
              </>
            )}
          </ol>
        ) : (
          <div className="empty">No points yet</div>
        )}
        {!mine && (
          <p className="sub" style={{ marginTop: 8 }}>
            You&apos;re not on this board yet. Your first sale puts you on it.
          </p>
        )}
      </div>
    );
  };

  return (
    <section className="sec">
      <div className="sec-h">
        <h2>Leaderboards</h2>
        <select className="sel" value={scope} onChange={(e) => setScope(e.target.value)} aria-label="Leaderboard">
          {scopes.map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <p className="sub">
        1 point for every player who registers with your code, 1 point for every ticket. The top 5 on each board earn rewards (paddle, VIP tickets, free events).
      </p>
      <div className="boards">
        {renderOne(board.registrations, "Registrations")}
        {renderOne(board.tickets, "Tickets")}
      </div>
    </section>
  );
}

/* ----------------------------- How it works ---------------------------- */

function How({ shared }: { shared: Shared }) {
  const p = shared.program;
  return (
    <section className="sec">
      <div className="sec-h">
        <h2>How it works</h2>
      </div>
      <div className="rules">
        <div className="rule">
          <h3>Registration commission</h3>
          <p className="sub">{p.tierNote}</p>
          <div className="tiers">
            {p.registrationTiers.map((t, i, a) => (
              <div key={i}>
                <b>{pct(t.pct)}</b>
                <span>
                  {i ? (a[i - 1].upTo ?? 0) + 1 : 1}
                  {t.upTo ? "–" + t.upTo : "+"} players
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="rule">
          <h3>Ticket commission</h3>
          <p>
            <b className="num">{pct(p.ticketPct)}</b> of every ticket sale made with your code, at every tournament.
          </p>
        </div>
        <div className="rule">
          <h3>Rewards</h3>
          <p>
            1 comp registration for every {p.rewards.regsPerCompRegistration} players who register with your code. 1 courtside ticket for every {p.rewards.ticketsPerCourtsideTicket} tickets sold.
          </p>
        </div>
        <div className="rule">
          <h3>Getting paid</h3>
          <p>
            {p.payoutSchedule} Balances under ${p.payoutMinimum} roll over to your next payout.
          </p>
        </div>
      </div>
      <div className="card pad faq">
        <h3 style={{ fontSize: "1.35rem", marginBottom: 4 }}>Questions</h3>
        <details>
          <summary>Why don&apos;t I see a sale yet?</summary>
          <p>Numbers update every morning. A registration or ticket shows up the day after it&apos;s made. Refunds and withdrawals are taken off.</p>
        </details>
        <details>
          <summary>Someone used my code but it&apos;s not showing</summary>
          <p>Make sure they entered your exact code at checkout. If it&apos;s still missing after a day, reply to Amie&apos;s weekly email with their name and the tournament.</p>
        </details>
        <details>
          <summary>Can I promote tournaments outside my region?</summary>
          <p>Yes. Your code works at every tournament, and your sales count toward your pod wherever the event is.</p>
        </details>
        <details>
          <summary>How do the leaderboards work?</summary>
          <p>You earn 1 point for every player who registers with your code and 1 point for every ticket. The top 5 on each board earn rewards. Everyone earns commission no matter where they finish.</p>
        </details>
      </div>
    </section>
  );
}
