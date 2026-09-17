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
