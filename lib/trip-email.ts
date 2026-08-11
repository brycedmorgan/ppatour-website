/**
 * Composes the "email my trip plan" message from the SAME shared assembler the
 * on-page summary uses (`assembleTrip`), so the emailed plan and the page can't
 * drift. Rebuilt server-side from the saved selection — the API route never
 * trusts client-sent HTML.
 */
import "server-only";
import {
  assembleTrip,
  competeChecklist,
  formatDateRange,
  tripQueryString,
  type TripEvent,
  type TripSelection,
} from "@/lib/trip";

const NAVY = "#0C2B44";
const BLUE = "#228BE6";
const PAPER = "#F3F5F7";
const LINE = "#D7DEE4";
const INK = "#0C2B44";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Only allow http(s) links into the email (never javascript:, data:, etc.). */
function safeHref(href: string): string | null {
  try {
    const u = new URL(href);
    return u.protocol === "http:" || u.protocol === "https:" ? href : null;
  } catch {
    return null;
  }
}

function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "https://www.ppatour.com";
  return raw.replace(/\/+$/, "");
}

export function composeTripEmail(event: TripEvent, sel: TripSelection) {
  const dateRange = formatDateRange(event.startDate, event.endDate);
  const actions = assembleTrip(event, sel);
  const year = event.startDate.slice(0, 4);
  const planUrl = `${siteUrl()}/events/${year}/${event.slug}/${tripQueryString(sel)}#travel`;
  const prep =
    (sel.intent === "play" || sel.intent === "both") && sel.style === "compete"
      ? competeChecklist(event)
      : [];

  const subject = `Your ${event.city} pickleball trip — ${dateRange}`;

  const actionRows = actions
    .map((a) => {
      const linkList = (a.links ?? [])
        .map((l) => {
          const h = safeHref(l.href);
          return h
            ? `<div style="margin:2px 0;"><a href="${esc(h)}" style="color:${BLUE};text-decoration:none;font-weight:bold;">${esc(l.label)} &#8599;</a>${l.meta ? ` <span style="color:#5b6c77;">${esc(l.meta)}</span>` : ""}</div>`
            : "";
        })
        .join("");
      const ctaHref = a.href ? safeHref(a.href) : null;
      const cta = ctaHref
        ? `<div style="margin-top:8px;"><a href="${esc(ctaHref)}" style="display:inline-block;background:${BLUE};color:#fff;text-decoration:none;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;padding:9px 16px;">${esc(a.cta ?? "Open")} &#8599;</a></div>`
        : "";
      return `
      <tr>
        <td style="padding:14px 16px;border:1px solid ${LINE};border-top:none;vertical-align:top;">
          <div style="font-weight:bold;text-transform:uppercase;color:${NAVY};font-size:14px;">${esc(a.title)}</div>
          ${a.sub ? `<div style="color:#5b6c77;font-size:13px;margin-top:3px;">${esc(a.sub)}</div>` : ""}
          ${a.note ? `<div style="color:#5b6c77;font-size:12px;margin-top:3px;">${esc(a.note)}</div>` : ""}
          ${linkList ? `<div style="margin-top:8px;">${linkList}</div>` : ""}
          ${cta}
        </td>
      </tr>`;
    })
    .join("");

  const prepRows = prep.length
    ? `<p style="font-weight:bold;text-transform:uppercase;color:${NAVY};font-size:13px;letter-spacing:1px;margin:22px 0 6px;">Before you play</p>
       <ul style="margin:0;padding-left:18px;color:#3a4a57;font-size:13px;line-height:1.7;">${prep
         .map((c) => `<li>${esc(c)}</li>`)
         .join("")}</ul>`
    : "";

  const listBlock = (label: string, items: { name: string; tag: string; note: string }[]) =>
    items.length
      ? `<p style="font-weight:bold;text-transform:uppercase;color:${NAVY};font-size:13px;letter-spacing:1px;margin:22px 0 6px;">${esc(label)}</p>
         <ul style="margin:0;padding-left:18px;color:#3a4a57;font-size:13px;line-height:1.7;">${items
           .map(
             (d) =>
               `<li><strong>${esc(d.name)}</strong> <span style="color:#8a97a1;">${esc(d.tag)}</span> — ${esc(d.note)}</li>`,
           )
           .join("")}</ul>`
      : "";

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:${INK};">
    <div style="background:${NAVY};padding:28px 24px;">
      <p style="margin:0;color:${BLUE};letter-spacing:3px;font-size:11px;font-weight:bold;">YOUR PPA TOUR TRIP</p>
      <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;text-transform:uppercase;">${esc(event.city)} &middot; ${esc(dateRange)}</h1>
      <p style="margin:6px 0 0;color:#aebfce;font-size:13px;">${esc(event.name)} &middot; ${esc(event.venue)}</p>
    </div>
    <div style="padding:24px;background:#ffffff;">
      <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">Here's your plan. Tick each one off as you book it — your saved version lives at the link below.</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:10px 16px;border:1px solid ${LINE};background:${PAPER};font-weight:bold;text-transform:uppercase;font-size:12px;letter-spacing:1px;color:${NAVY};">Your checklist</td></tr>
        ${actionRows}
      </table>
      ${prepRows}
      ${listBlock("Where to eat", event.dining)}
      ${listBlock(`Explore ${event.city}`, event.doing)}
      <div style="text-align:center;margin:28px 0 8px;">
        <a href="${esc(planUrl)}" style="display:inline-block;background:${NAVY};color:#fff;text-decoration:none;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;padding:12px 22px;">Open your trip plan &#8599;</a>
      </div>
      <p style="font-size:11px;color:#8a97a1;text-align:center;margin:14px 0 0;">Player-watch days are projected from current rankings. See you on the courts.</p>
    </div>
  </div>`;

  const text = [
    `Your ${event.city} pickleball trip — ${dateRange}`,
    `${event.name} · ${event.venue}`,
    ``,
    ...actions.flatMap((a) => {
      const lines = [`• ${a.title}${a.sub ? ` — ${a.sub}` : ""}`];
      if (a.note) lines.push(`  ${a.note}`);
      if (a.href) lines.push(`  ${a.cta ?? "Link"}: ${a.href}`);
      for (const l of a.links ?? []) lines.push(`  ${l.label}: ${l.href}`);
      return lines;
    }),
    ...(prep.length ? ["", "Before you play:", ...prep.map((c) => `• ${c}`)] : []),
    ``,
    `Open your plan: ${planUrl}`,
  ].join("\n");

  return { subject, html, text };
}
