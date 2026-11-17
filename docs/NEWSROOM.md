# Newsroom dashboard (`/newsroom`)

Editors write and edit news posts and pick the pickleball.com articles on the
home page. Modelled on the everyday-zing dashboard; built 11/17 (Wesley).

## Setup (once per environment)

1. Make a password hash for each editor:

   ```bash
   node scripts/newsroom-hash-password.mjs "their password"
   ```

2. Set in Vercel (Production + Preview) and `.env.local`:

   - `NEWSROOM_ADMINS` — `name@ppatour.com=scrypt:…`, comma- or newline-separated
     for several people. Removing someone signs them out on their next request.
   - `NEWSROOM_SESSION_SECRET` — 32+ random characters. Changing it signs everyone out.

   `DATABASE_URL` (Neon) and `BLOB_READ_WRITE_TOKEN` are already set. The two
   tables (`newsroom_posts`, `newsroom_settings`) create themselves on first use.

3. Sign in at `/newsroom/login/` and press **Import hand-written posts** on the
   Overview once. It copies the 22 posts in `lib/news-articles.ts` and
   `lib/news-posts-authored.ts` into the dashboard. The site looks the same
   afterwards.

Local dev has no `DATABASE_URL`, so posts are saved to `.data/newsroom.json`
(gitignored) instead.

## How it fits together

| Piece | Where |
| --- | --- |
| Sign-in (email + password, signed cookie) | `lib/newsroom/session.ts`, `lib/newsroom/auth.ts`, gate in `proxy.ts` |
| Storage (Neon, or a JSON file locally) | `lib/newsroom/store.ts` |
| What the public site reads (10 s version probe, fails open) | `lib/newsroom/published.ts` |
| Merge into the news feed | `lib/news.ts` (dashboard posts are the third source) |
| Dashboard pages + actions | `app/newsroom/` |
| Image uploads (direct to Blob, `newsroom/` prefix) | `app/api/newsroom/upload/route.ts` |

- **A dashboard post wins over a code post with the same slug.** Every dashboard
  post's slug, plus an imported post's original slug, hides the code copy,
  drafts included. So unpublishing an imported post takes it off the site, and
  **deleting** it brings the code copy back.
- If the database is unreachable, the site serves the last good copy, or falls
  back to the code posts. A database outage never takes /news down.
- Bodies are HTML, sanitized on output by `renderPostHtml` (lib/news-html.ts),
  with player names auto-linked. Paste from Google Docs/Word is cleaned in the editor.
- Every save calls `revalidatePath("/", "layout")`; the change shows on the next request.
- **Home page picks:** up to 4 pinned pickleball.com articles, stored as snapshots,
  in order; the newest articles fill empty slots (`homePickleballNews`).
- Not editable here: the 811 posts migrated from WordPress and the 39 PPA Blog posts.

## Later

- pickleball.com SSO (Jason's OIDC client) replaces the password: the callback
  calls `startSession(email)` for an allowed email. Nothing else changes.
- Once production has run on the dashboard copies for a while, the code copies in
  `lib/news-articles.ts` / `lib/news-posts-authored.ts` can go. Three client-side
  readers still use `lib/news-articles.ts` directly (`NationalsLive`,
  `lib/event-spotlight.ts`, `lib/site-promo.ts`) and need moving first.
