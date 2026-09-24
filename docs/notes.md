# ppatour-website — durable notes

Facts that outlive a session: decisions, gotchas, who asked for what. The Session Log in
`CLAUDE.md` is the timeline; this file is the reference. Newest section at the bottom.

## 2026-09-17 — Europe credential QR → /europe/eventlinks

- QR on every PPA Tour Europe credential points at **https://ppatoureurope.com/eventlinks**
  (Payton Pemberton, DM, 9/17). The code is printed and fixed; the page changes per stop.
  Never move or rename this route without a redirect.
- Per-stop links: `lib/europe-eventlinks.ts`, keyed by feed slug. Empty until the Europe team
  sends URLs. Map link is derived from venue + city; the event-page link mirrors
  FeaturedEvents' internal/external guard.
- Any host other than ppatoureurope.com redirects `/eventlinks` → `/europe/eventlinks`.
  ⚠ Redirects run before `beforeFiles` rewrites, so the redirect carries
  `missing: host ppatoureurope.com` or it hijacks the Europe host too.
- Stops are filtered by `endDate >= today` as well as status: the feed left P125 Portorož
  (July) "upcoming" in September.

## 2026-09-17 — Contact-form triage (auto-route + auto-answer)

- Bryce's brief, from #ppa-marketing-form (C0BPDLYNMCY): tickets → ticketing team,
  volunteering → volunteer team, marketing's routine questions answered automatically,
  everything still visible in the channel marked as handled. Built in
  `lib/forms/{triage,knowledge,reply,contact-pipeline}.ts`; runbook in `FORMS.md`.
- **Who is who.** Ticketing = Tanner Thygerson (Ticketing Manager), Cem Aslan, Lainey
  O'Connor — the `FORM_INBOX_TICKETING` list Wesley set 8/6. Volunteer team = Hailey Lunt
  (`FORM_INBOX_VOLUNTEER` = hailey.lunt@pickleball.com, the same default
  `/api/volunteer-apply` ships). Tyler Dodd has been triaging the channel by hand and
  marks handled posts with ✅ — the automation uses his mark.
- **The knowledge pack is read, never written.** Answers can only cite what the site
  already renders. When a question keeps landing in `triageOpen` (coolers, umbrellas,
  shade, food), that is the website gap to fill — which is the second half of Bryce's ask.
- **The route is a table** (`ROUTE_BY_CATEGORY`), not the model's call, and it applies
  only to Other/Marketing topics. Change routing there, not in a prompt.
- ⚠ `ANTHROPIC_API_KEY` is not in this project's Vercel env (Jackalope's is a sensitive
  var and cannot be pulled). Until it is set the contact form runs the old path.
- Slack ✅ reactions need `reactions:write` on the PPA Website Forms app (Wesley owns it).

## 2026-09-24 — Europe logo SVGs and the Turnstile hostname

- `public/ppa/logos/ppa-tour-horizontal-{white,blue}.svg` are the PPA TOUR half of the Carvana lockup
  with the Carvana paths **deleted**, not viewBox-cropped. iOS Safari ignores the viewBox clip on a
  lazy-loaded `<img>` SVG and painted Carvana in the /europe footer (Payton, 9/24). Never crop a
  sponsor out of a shared file with a viewBox; delete the geometry.
- Cloudflare Turnstile allows hostnames per widget. ppatoureurope.com must be on the list or every
  form that needs a token (all but the newsletters) fails with error 110200 and the widget shows
  "Unable to connect to website". Any new host that serves a form needs adding there too.
