# Launch Runbook — ppatour.com cutover

What flips, in order, when this site takes over the ppatour.com domain.
Measurement/SEO infrastructure status as of 2026-07-16.

## Already live (nothing to do)

| Piece | Where | Notes |
|---|---|---|
| GA4 (gtag) | `Analytics.tsx` | Stream **G-NKVE1BRLK7** ("PPA Tour \| New" — same stream as current ppatour.com, so history is continuous). Consent Mode v2, denied by default. |
| Outbound conversion clicks | `OutboundClickTracker.tsx` | `ticket_click` / `register_click` / `partner_click` with per-placement labels from each link's `utm_content`. |
| Meta Pixel | `MetaPixel.tsx` | Pixel **694427120146195** ("PPA - Meta Pixel"), consent-gated, `TicketClick`/`RegisterClick` custom events. |
| Lead capture → Customer.io | `/api/lead-capture` | Person + `website_lead_capture` event (variant + page). |
| Volunteer applications | `/api/volunteer-apply` | Emails hailey.lunt@pickleball.com (Customer.io transactional) + person/event in Customer.io. |
| Legacy 301s | `next.config.ts` | Every URL pattern from the old site's sitemaps. Inert until the domain moves. |
| Staging noindex | `lib/site.ts` + robots | Site is noindex/disallow until the env vars below are set. |

## Ported from the old site at the launch audit (2026-08-01)

The current ppatour.com fires these through GTM container **GTM-KG5F7W6**,
which this site deliberately does not load (gtag is wired directly so Consent
Mode lives in code). Each one is now supported in `MarketingTags.tsx` /
`Analytics.tsx` but **ships dark** — set the env var to turn it on.

| Tag | Env var | ID on the live site |
|---|---|---|
| GA4 — second property | `NEXT_PUBLIC_GA_MEASUREMENT_ID_SECONDARY` | `G-VFNFRP66Z5` |
| TikTok pixel | `NEXT_PUBLIC_TIKTOK_PIXEL_ID` | `D41T2AJC77U69K483TK0` |
| Microsoft Clarity | `NEXT_PUBLIC_CLARITY_ID` | `vx8dxhws9k` |
| Hotjar | `NEXT_PUBLIC_HOTJAR_ID` | `3598441` |

⚠ **Clarity and Hotjar record real sessions.** They're consent-gated in code,
but switching them on is a privacy call — get whoever owns the accounts to make
it, don't just paste the IDs.

⚠ **UserWay (accessibility widget, account `YBUtdPKa3d`) is on ppatour.com and
is NOT ported.** Dropping it changes the site's accessibility posture at
cutover. That needs a decision, not an omission — it is not wired up here.

**Vercel Web Analytics + Speed Insights** are live in `app/layout.tsx`. Both are
cookieless, so they sit outside the consent banner and outside the production
gate — Speed Insights on previews is how a Core Web Vitals regression gets
caught before it reaches the domain.

## At cutover (ordered)

1. **Vercel env (production):**
   ```
   NEXT_PUBLIC_SITE_URL=https://www.ppatour.com
   NEXT_PUBLIC_SITE_INDEXABLE=true
   ```
   Redeploy. This flips robots/meta-robots to indexable and moves the
   sitemap, canonical metadataBase, and JSON-LD URLs to ppatour.com.

   ⚠ **It also switches the marketing tags on.** GA4, Meta, and anything in
   `MarketingTags` are gated on `NEXT_PUBLIC_SITE_INDEXABLE` (see
   `lib/analytics.ts`), because until the audit every preview and staging
   deployment was reporting into the **production** GA4 stream and the
   **production** Meta Pixel — months of QA clicks and crawls landing in the
   property the business reads. Nothing reports until this flag is true.
2. **Point the domain** at the Vercel project; verify the legacy 301s
   (`/schedule` → `/events`, `/athlete/ben-johns` → `/athletes/ben-johns`).
3. **GA4** (property *PPA - GA4*, 358407319): update the "PPA Tour | New"
   stream's default URI if it still shows the old platform. Same
   measurement ID = no data break.
4. **Google Search Console**: submit `https://www.ppatour.com/sitemap.xml`;
   watch Coverage + 404 reports daily for two weeks (the redirect map
   should absorb legacy URLs — investigate any 404 spike).
5. **Spot-check analytics end-to-end**: click a Buy Tickets CTA on the live
   domain → confirm `ticket_click` in GA4 Realtime and `TicketClick` in
   Meta Events Manager.

## Manual config (accounts, not code — can be done before cutover)

- [ ] **GA4**: mark `ticket_click` + `register_click` as key events
      (Admin → Events). The API credentials on file are read-only, so this
      is a UI step. ~2 min.
- [ ] **Google Ads**: import both GA4 key events as conversions
      (Tools → Conversions → Import → GA4). Requires the GA4↔Ads link.
- [ ] **Customer.io**: three welcome campaigns triggered on
      `website_lead_capture`, filtered by `data.variant`
      (`fan` / `amateur` / `streaming`).
- [ ] **Meta**: audiences already created —
      *PPA Website Visitors — 30d (new site)* (120249415327040761) and
      *PPA Ticket Clickers — 30d (new site)* (120249415331800761).
      Once TicketClick volume builds: custom conversion on TicketClick,
      lookalike seeded from the clickers audience.
- [ ] **GSC access**: confirm who owns the ppatour.com Search Console
      property before launch day.

## Deferred (needs content migration)

- Old blog posts published at **root level** (e.g.
  `/player-of-the-month-kyle-yates/`) can't be pattern-redirected.
  When news slugs are final in Sanity, add individual 301s for the posts
  worth keeping (source list: `https://ppatour.com/post-sitemap.xml`).
