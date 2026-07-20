# AI Tour-Coverage Approval Gate

**Directive (Connor Pardoe, 7/20/2026):** AI-generated tour coverage must not
go live — or silently change when players win/lose — without a human click.
**Approver: Dylan.**

## How it works today (articles live in `lib/news-articles.ts`)

1. Every article carries a **required** `status` field:
   - `"draft"` — invisible EVERYWHERE (no /news index, no article page — the
     slug 404s, no sitemap entry, no homepage newsroom, no event Coverage
     section, no search).
   - `"published"` — live.
2. **Any new or rewritten AI article MUST be committed as `status: "draft"`.**
   This includes updates to existing articles when results change: write the
   new version as a draft copy or flip the current one back to draft — the
   old approved text must not silently mutate.
3. **Approval = Dylan flips `status` to `"published"`** in a commit / PR
   review. That commit is the audit trail of who approved what, when.

The gate is enforced two ways:

- TypeScript: `status` is required on `NewsArticle`, so an article without a
  decision does not compile.
- Fail-closed rendering: every consumer renders from `publishedArticles`
  (drafts filtered out), never from the raw `newsArticles` array.

## When Sanity CMS lands

The `status` field maps 1:1 onto Sanity's native draft/publish. The pipeline
becomes: AI writes → document saved as a Sanity **draft** → Dylan reviews in
the Studio → **Publish** button. Nothing else on the site changes because all
consumers already read only published content.

## Who to ping

- Approvals: **Dylan**
- Pipeline / architecture: Bryce (owner), Wesley (API lane)
