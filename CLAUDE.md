@AGENTS.md

# PPA Tour Website Rebuild — `ppatour-website`

Content-first rebuild of `ppatour.com`. The site is the **content / discovery /
streaming** layer; commerce redirects out to partners (tixr for tickets,
pickleballtournaments.com for amateur registration). Do **not** embed checkout,
build a cart, or replicate registration forms.

**Full brief:** read [`CLAUDE_CODE_PASSOFF_v2.md`](CLAUDE_CODE_PASSOFF_v2.md)
end-to-end before touching code. The strategy doc (`Option B — Content-First
Strategy`) is the ultimate source of truth.

**Owner:** Bryce Morgan (President + CMO, PPA Tour)

## Stack

Next.js 16 (App Router) · TypeScript strict · Tailwind v4 · shadcn/ui ·
Sanity (CMS, pending confirm) · Vercel (staging) → AWS (prod, Phase 3).

## Session Log

### 2026-05-18 — Phase 0: repo + scaffold
- Created GitHub repo `brycedmorgan/ppatour-website` (public) and local folder
  `/Users/bryce/Documents/ppatour-website`.
- Scaffolded with `create-next-app` (Next.js 16.2.6, App Router, TypeScript
  strict, Tailwind v4, ESLint, `@/*` import alias, no `src/` dir).
- Initialized shadcn/ui (`components/ui/button.tsx`, `lib/utils.ts`).
- Laid down the §5 directory scaffold (`.gitkeep` placeholders) for marketing /
  content / events / athletes / api routes, component groups, and `lib/`.
- Saved the passoff brief as `CLAUDE_CODE_PASSOFF_v2.md`.
- Deployed to Vercel (`gull-stack` scope): project `ppatour-website`, live at
  https://ppatour-website-mpohate97-gull-stack.vercel.app — auto-deploys on
  push to `main`.
- **State:** empty scaffold, default create-next-app homepage. Nothing built yet.
- **Next:** Phase 0 remaining items — Sanity studio decision, GTM container,
  env vars, Playwright + Vitest + CI. Then
  Phase 2 build starts with the global components (§9). Resolve §13 open
  questions with Bryce/Jason (repo org transfer, scoring API creds, tixr API,
  CMS confirm, brand hex values).
