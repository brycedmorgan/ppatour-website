import { NextResponse } from "next/server";
import { cioIdentifyAndTrack } from "@/lib/customerio";
import { postVacSignupToJackalope } from "@/lib/vacations/jackalope";

/**
 * Lead capture endpoint (§9.8). Identifies the person in Customer.io and
 * records a `website_lead_capture` event carrying the lead-magnet variant
 * and source page, so welcome flows can differ per magnet (fan guide vs
 * player guide vs streaming reminders).
 */
export async function POST(request: Request) {
  let payload: {
    email?: string;
    variant?: string;
    region?: string;
    page?: string;
    event?: unknown;
  };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const email = payload.email?.trim();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  const variant = payload.variant ?? "fan";
  const page = payload.page ?? "";
  // Region is an opt-in tag set per call site, never inferred from the path —
  // a page can move and a regional page can be linked from anywhere.
  const region =
    typeof payload.region === "string" && /^[a-z-]{2,24}$/.test(payload.region)
      ? payload.region
      : undefined;

  const event = cleanEvent(payload.event);

  console.log("[lead-capture]", { email, variant, region, page, event: event?.key });

  const ok = await cioIdentifyAndTrack(
    email,
    {
      website_lead_variant: variant,
      website_lead_page: page,
      ...(region ? { website_lead_region: region } : {}),
      ...(variant === "vacations" ? { vacations_list: true } : {}),
      // The LAST event this person signed up from. Per-event lists come from
      // the `website_lead_capture` event's data below, which keeps every one.
      ...(event
        ? {
            website_lead_event: event.key,
            website_lead_event_name: event.name,
            ...(event.code ? { website_lead_event_code: event.code } : {}),
          }
        : {}),
    },
    "website_lead_capture",
    {
      variant,
      page,
      source: "ppatour-website",
      ...(region ? { region } : {}),
      ...(event
        ? {
            event: event.key,
            event_name: event.name,
            ...(event.code ? { event_code: event.code } : {}),
            ...(event.uuid ? { tournament_uuid: event.uuid } : {}),
          }
        : {}),
    },
  );
  if (!ok) {
    return NextResponse.json({ error: "Could not subscribe" }, { status: 502 });
  }
  // Vacations sign-ups are Lainey's list, kept in Jackalope (lib/vaclist.js
  // there), which adds them to the Customer.io vacations segment.
  if (variant === "vacations") await postVacSignupToJackalope(email, page);

  return NextResponse.json({ ok: true });
}

/**
 * The tour stop sent by an event-page form (Maxwell Hill, 11/17: segment by
 * event). It comes from the browser, so every field is checked against the
 * shape our own records use and anything else is dropped: a bad field must
 * never become a Customer.io attribute someone segments on.
 */
function cleanEvent(raw: unknown):
  | { key: string; name: string; code?: string; uuid?: string }
  | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const e = raw as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const slug = str(e.slug);
  const year = str(e.year);
  if (!/^[a-z0-9-]{2,100}$/.test(slug) || !/^20\d\d$/.test(year)) return undefined;
  const name = str(e.name).replace(/[\u0000-\u001f]/g, "").slice(0, 120) || slug;
  const code = str(e.code);
  const uuid = str(e.uuid);
  return {
    // "2027/cincinnati-open": the event page's own path, unique per edition.
    key: `${year}/${slug}`,
    name,
    ...(/^[0-9]{4}(-[A-Z0-9]{2,40}){2,5}$/.test(code) ? { code } : {}),
    ...(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid) ? { uuid } : {}),
  };
}
