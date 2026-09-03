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

## Lovable billing (added 2026-09-02)

- Slack group DM (Chris Cantino, Jason Santerre, Bryce; External Connections →
  matchday-collab), 9/1: the workspace AI credit cap is 2000/month. Chris hit it
  building the PBTV prototype and paid overages on his personal card. Auto-top-up
  is off.
- Taylor told Jason MATCHDAY sits under PPA, so Bryce owns credit increases now.
- The MATCHDAY Lovable workspace is domain-linked to pickleball.com (6 members).
  bryce@pickleball.com is not a member yet; it can only "Request" to join. The
  8/5 invite went to b.morgan@ppatour.com, which is likely where the admin seat is.
- Open: join as admin, raise the cap or enable auto-top-up, reimburse Chris.
- 9/2 22:30Z, inside the workspace: Bryce is Admin. Plan is Lovable Business,
  2,000 monthly credits, renews the 8th. Auto top-up is ON (500 credits when
  below 10) and bills the card on file. Last 30 days 4,767 credits (pbtv 2,570,
  MATCHDAY 2,197). Business at 3,000 credits is $1,410/mo. Billing "Manage" is
  Owner-only (Chris); the card swap to a company card is his move.

## Access landed (2026-09-02, 22:30Z)

- Chris replied: invites sent, and he built `pblfg.com/migration-export`
  (edge function `migration-inventory`, password-gated; password is in his
  9/2 email to Bryce). It returns the live backend inventory. He also says
  Lovable Cloud is at 100% instance capacity and it is hurting performance.
  He wants this sooner. Plan is now the first event-free week in October.
- GitHub invite accepted as `brycedmorgan`. Clone: `~/pickleball/pbpulse`.
- `supabase/` IS in the repo: 154 edge functions, 1,001 migrations (latest
  2026-09-03), config.toml. 22 migrations schedule pg_cron jobs.
- Storage buckets: app-fonts, app-logos, event-guide-assets, player-avatars,
  team-avatars, user-avatars.
- Secrets to hand-carry (from `migration-inventory`): APNS_* (5), 
  FIREBASE_SERVICE_ACCOUNT, INTERNAL_FUNCTION_SECRET (also read as
  INTERNAL_SECRET), OIDC_CLIENT_SECRET, PBTV_BRIDGE_SECRET, PB_API_TOKEN,
  PB_USER_TOKEN, PB_DEV_TOKEN, PB_API_BASE_URL, LOVABLE_API_KEY (4 functions
  use Lovable's AI gateway; those need a replacement provider).
- Lovable coupling in the web build: only `lovable-tagger` in vite.config.ts.

## Export baseline (2026-09-03 05:10Z, from Chris's migration-export tool)

Saved at `~/pickleball/matchday-export/2026-09-03/` (outside any repo; it holds
password hashes and cron tokens verbatim. Never commit it.)

- DB is **14 GB**, 140 tables, ~13.6M rows. **~12M rows are logs/analytics**:
  polling_analytics 5.2M, notification_history 4.1M, scraper_analytics 1.2M,
  page_analytics 955k, device_token_attempts 423k, console_logs, error_analytics.
  Real app data is small: matches 39k, users 3,449, storage 315 MB / 1,550 files.
  The "100% capacity" Chris reports is log bloat. Prune these first; it fixes
  performance now and takes the migration under Lovable's 5 GB export cap.
- Users: 3,449 (3,264 with password hashes in the export, 184 anonymous).
  Providers: email 3,263, google 2. Hashes import into Supabase auth, so no
  forced reset if we bring the JWT secret across, else a forced re-login.
- 45 pg_cron jobs, all active. Commands carry URL + token; rewrite at cutover.
- Extensions: pg_cron, pg_net, pgmq, pgcrypto, supabase_vault, uuid-ossp.
- 8 realtime tables, 401 RLS policies, 217 DB functions, 109 triggers, 9 views.
- 6 public buckets. Object bytes are NOT in the export; copy by hand.
- Chris's HAND-CARRY-CHECKLIST.md in the export is the secrets list and the
  cutover order. It is good. Use it as the runbook skeleton.
