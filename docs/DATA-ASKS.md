# Outstanding Data Asks

## 1. Registered-player counts — Jason (PT.com API) — BLOCKING

Connor (7/20) wants live **"X players registered"** on every event page.

- **Site status:** display component shipped (`components/events/RegisteredCount.tsx`
  in the event page's Get Involved section) rendering an honest
  "Registration Count Coming — syncs live from pickleballtournaments.com"
  placeholder. Adapter is `lib/registrations.ts`.
- **Needed from Jason:**
  1. Partner token + base URL → set `PT_API_TOKEN` and `PT_API_BASE_URL` in
     Vercel (production + preview) on `ppatour-website`.
  2. Confirm the endpoint + response shape. The adapter currently assumes
     `GET {base}/v1/tournaments/{uuid}/registrations/summary` →
     `{ total_registrations: number }`, keyed by the Pickleball.com
     `tournament_uuid` we already carry on every API-sourced event. If his
     endpoint differs, only `lib/registrations.ts` changes.
- Once env vars land + redeploy, counts light up on all event pages with no
  UI change.

## 2. Per-event sponsor lists — Jackalope / SponsorCX

Event pages now show a Sponsors section (event marquee partners + the
tour-wide roster) with a become-a-sponsor CTA into `/about/sponsors#inquire`
(→ Jacob's Leads pipeline). When a per-event sponsor export exists, thread it
through `Tournament` and swap the roster source in
`components/events/EventSponsors.tsx`.

## 3. Venue/aerial photography — Sadie

See `docs/VENUE-ASSETS.md` for the full per-event shot list.
