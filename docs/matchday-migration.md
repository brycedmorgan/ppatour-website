# MATCHDAY off Lovable — migration notes (2026-09-02)

MATCHDAY by Pickleball Inc. (pblfg.com, iOS `id6755119460`, Android
`com.cc.pbpulse.app`) is a separate product from the ppatour.com fan app. Both
run (Bryce, 8/18). These notes cover moving MATCHDAY off Lovable.

## What it is today (verified 9/2)

- Web build: Vite/React SPA in a Capacitor wrapper. Served by Lovable hosting
  (pblfg.com → 185.158.133.1, plus pbpulse.lovable.app).
- Backend: Lovable Cloud, which is a managed Supabase project
  (`grwhdhnlafqrcmiuqhhi.supabase.co`). From the client bundle: 57 tables,
  15 RPCs, 10 realtime channels, edge functions `official-score-ticker`,
  `official-match-detail`, `rte-proxy`, `rte-live-activity-bridge`. Server-side
  pollers and push senders are not visible from the client.
- Auth: email + password, plus anonymous identity claim. No social login seen.
- Push: `device_tokens`, `live_activity_tokens` tables. APNs/FCM keys are secrets.
- Stores: iOS seller Pickleball OpCo LLC, Play developer "Pickleball Inc".
  Store ownership is done.
- Code: GitHub `chriscantino/pbpulse` (Chris Cantino's personal account).
  Lovable workspace "MATCHDAY" is also Chris's personal workspace.
- Contract: term sheet signed 3/9–3/11/2026. Company owns the asset. Chris
  builds on contract, 20 hr/wk minimum.

## What Lovable lets you take (docs.lovable.dev, read 9/2)

- GitHub sync is two-way and pushes full source. Migrations and edge functions
  live under `supabase/` in the repo if Lovable synced them. Confirm.
- Cloud export (Cloud tab → Advanced settings → Export data): full schema +
  data, max 5 GB, one export per 24 h.
- NOT exported: storage bucket files (download separately), edge function code,
  project secrets, usable password hashes.
- No connection string, no dashboard, no pg_dump. No one-click move.
- Removing Cloud deletes the instance permanently.

## Status

- 9/2: Bryce emailed Chris (chris@color.capital) asking for a fresh GitHub
  invite or a transfer into the Pickleball-Inc-Crew org, the current Lovable
  bill, and the edge-function/cron/secret/bucket inventory. Proposed Nov 9–15.

## Plan

1. Access. Accept the Lovable workspace invite (sent 8/5 to b.morgan@ppatour.com).
   Get a fresh GitHub invite, or transfer the repo to a company org.
2. Inventory with Chris: edge functions, cron/scheduled jobs (score polling
   from pickleballtournaments.com), secrets, storage buckets, auth config,
   current Lovable bill.
3. Company Supabase org on a company card. Bryce + Jason owners, Chris member.
   Same region as Lovable Cloud.
4. Schema: `supabase db push` from repo migrations, or restore the export.
   Check RLS, RPCs, triggers, pg_cron.
5. Edge functions: `supabase functions deploy` from repo. Set secrets.
6. Storage: download from Lovable, upload to same-named buckets.
7. Auth: password hashes do not move. Plan a forced password reset. Anonymous
   users start over.
8. App: ship an iOS/Android update with the new backend URL BEFORE the data
   cutover. Use `app_settings` for a min-version gate. Store review is 1–5 days.
9. Web: strip `/~flock.js` and `lovable-tagger`, deploy to Vercel, point
   pblfg.com at Vercel.
10. Cutover in a gap between events. Freeze writes, final export, import, flip.
    Proposed window (Bryce → Chris, 9/2): **Nov 9–15 2026**, between Worlds
    (Nov 2–8, Farmers Branch) and Daytona (Nov 16–22). A store build with a
    switchable backend URL ships in October; the switch flips that week.
    Alternatives if that slips: Nov 23–25 (short), Dec 7–13 (Adelaide only).
    MLP fall dates not confirmed; Chris asked to flag conflicts.
11. Keep Lovable 30 days, then remove Cloud and downgrade.

⚠ Savings ledger row 16 ("Lovable → self-hosted", $75k, banked 7/31) is early.
The app is still on Lovable. Treat it as committed until step 11.
