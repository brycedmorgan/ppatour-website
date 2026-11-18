# Newsroom dashboard

Editors write and edit news posts and pick the pickleball.com articles on the
home page. Modelled on the everyday-zing dashboard; built 11/17 (Wesley).

⚠ **This repo is public on GitHub.** Never write the dashboard's address, a
password, a hash or a secret into the repo, this file included.

## Where it lives

At a **secret address**: `https://<site>/<NEWSROOM_URL_KEY>/`, where the key is
`nr-` plus 24 random lowercase letters and digits. It is set per environment in
Vercel and is the only place the address exists. Send it to editors privately.

- `/newsroom/` (the internal route), a wrong key, or no key configured all give
  the site's ordinary 404, identical to any other missing page.
- Not in the sitemap, nav, search, or `robots.txt` (listing it there would
  publish it). Every response carries `X-Robots-Tag: noindex`, the page carries
  `<meta name="robots" content="noindex">`, and `Referrer-Policy: no-referrer`
  keeps the address out of the Referer header on links out.
- No analytics on it: GA4, Meta, Customer.io, Jackalope, Vercel Analytics and
  UserWay are wrapped in `TrackingGate` (components/global/TrackingGate.tsx),
  which renders nothing on private paths (lib/private-paths.ts).
- To move it (e.g. the key leaked): set a new `NEWSROOM_URL_KEY` and redeploy.
  The old address immediately 404s.

## Sign-in: password + a second step

1. Email + password.
2. **First sign-in:** the editor must set up a second step before anything
   else: a **passkey** (Face ID / Touch ID / Windows Hello / security key,
   recommended) or an **authenticator app** (6-digit code, QR made on our
   server).
3. **Every sign-in after:** the passkey or the code. The password alone opens
   nothing.

Rules (lib/newsroom/mfa.ts, app/newsroom/mfa-actions.ts):
- Setup is only possible while the editor has NO second step, so a stolen
  password can't add an attacker's device.
- A used code can't be reused; 5 wrong codes in a row lock the second step for
  15 minutes.
- The password step is good for 10 minutes; the full session for 7 days.
- **Lost phone/passkey:** confirm it's really them (call), then
  `node --env-file=.env.local scripts/newsroom-reset-mfa.mjs name@ppatour.com`
  (with the production `DATABASE_URL`, e.g. from `vercel env pull`). Their next
  sign-in sets up a new one.
- ⚠ A passkey belongs to one web address. In production set
  `NEWSROOM_RP_ID=ppatour.com` so passkeys work on www and the apex. Each
  Vercel preview deployment has its own address, so on previews use the
  authenticator app (or always review on the same preview URL).

### Sign in with Pickleball.com (11/18, dev only for now)

Step one can also be the Pickleball SSO (lib/sso) instead of a password. The
second step above is still required.

- **Who:** `NEWSROOM_PICKLEBALL_EDITORS` = Pickleball account ids (the SSO
  `sub`, a UUID), comma or newline separated. Removing an id signs that person
  out on their next request. Each SSO environment has its own account ids.
- **Flow:** the login page's "Sign in with Pickleball.com" button →
  `/auth/login/?returnTo=/auth/newsroom/` → Pickleball → `/auth/newsroom/`
  (app/auth/newsroom/route.ts) → the setup or verify screen. The button shows
  only when SSO is configured and the list isn't empty.
- **The Newsroom link** (its login page) goes straight to `/auth/newsroom/`
  wherever the button would show (Wesley, 11/18); `…/login/?password` still
  opens the password form. Signed-in editors also get **Go to Newsroom** on
  `/account/` (to `/auth/newsroom/`, so the address isn't in that page), and
  an editor who already has a Newsroom session skips the second step.
- **Not listed:** `/account/?error=newsroom_denied`, which shows the person
  their account id to send to Wesley. The Newsroom address is never revealed.
- **Identity:** the editor's verified Pickleball email (the MFA record and
  "Last saved by" use it); the token also carries `pb` = the account id,
  checked against the list on every request.
- The SSO-issued pending cookie is SameSite=Lax (the password one stays
  Strict): the sign-in ends in a redirect chain that began on Pickleball's
  site, and a Strict cookie wouldn't come back on the next screen.

## Start from a Google Doc

New post → **Start from a Google Doc**: paste a Google Docs link (the doc must be
shared "Anyone with the link can view"), or upload the doc as Word (Google Docs:
File → Download → Microsoft Word) for private docs. It creates a **draft** and
opens it; nothing publishes on its own. `lib/newsroom/doc-import.ts`.

- A link is fetched as Google's Word export, so links and uploads share one
  path: Word → HTML (mammoth) → numbered blocks. Images in the doc are copied to
  Blob (`newsroom/doc-images/`); an uploaded .docx is deleted after reading.
- Claude (`claude-opus-5-5`, override with `NEWSROOM_DOC_MODEL`) maps the blocks
  to headline, standfirst, dek, byline, category, tour stop, tags, end button,
  hero image, and which blocks are NOT body. **The body is the writer's own
  blocks, never rewritten.** The only text it may write is the dek, when the doc
  has none, and the draft says so. Notes for the editor (missing photo,
  placeholders, instructions left in the doc) show in a banner on the draft.
- Needs `ANTHROPIC_API_KEY` in that environment (it is set for Production only
  as of 11/17). Without it a simple fill runs: first heading → headline, first
  image → hero, the rest → body.

## Reformat

**Reformat** (next to the Body label) suggests a cleaner structure: section
headings in longer posts, over-long paragraphs split, obvious lists turned into
bullets, images placed and captioned, and clutter removed (editor notes,
placeholders, a repeated headline/byline, a line that repeats the end button).
`lib/newsroom/reformat.ts`.

- **The writer's wording can't change.** Code checks that every word outside a
  heading appears in the original, in order; a result that rewords, adds or
  reorders text is refused. Image sources must already be in the post.
- The editor sees New / Current, the list of changes and every removed passage,
  then **Apply** (editor only, unsaved) or **Discard**. **Undo reformat** puts the
  old body back until the post is saved.
- Needs `ANTHROPIC_API_KEY` (Production + Preview as of 11/17). Each run costs a
  few cents.

## Setup (once per environment)

Vercel (Production; Preview scoped to the branch) and `.env.local`:

| Variable | How to make it |
| --- | --- |
| `NEWSROOM_URL_KEY` | `node scripts/newsroom-hash-password.mjs --url-key` |
| `NEWSROOM_ADMINS` | `email=hash` pairs, comma-separated; hash from `node scripts/newsroom-hash-password.mjs "their password"` |
| `NEWSROOM_SESSION_SECRET` | `node scripts/newsroom-hash-password.mjs --secret` (changing it signs everyone out) |
| `NEWSROOM_RP_ID` | Production only: `ppatour.com` |

Pass values with `vercel env add NAME <env> [branch] --value "…"`. Piping into
`vercel env add` from PowerShell stored EMPTY values (11/17).

`DATABASE_URL` (Neon) and `BLOB_READ_WRITE_TOKEN` are already set. Tables
(`newsroom_posts`, `newsroom_settings`, `newsroom_mfa`) create themselves.
⚠ Preview and Production share `DATABASE_URL`: posts published or pins saved on
a preview are what production shows once merged.

Then sign in and press **Import hand-written posts** on the Overview once. It
copies the 22 posts in `lib/news-articles.ts` and `lib/news-posts-authored.ts`
into the dashboard. The site looks the same afterwards.

Local dev has no `DATABASE_URL`, so posts and sign-in steps are saved to
`.data/newsroom.json` (gitignored).

## How it fits together

| Piece | Where |
| --- | --- |
| Tokens, secret address | `lib/newsroom/session.ts` |
| Password + session cookies | `lib/newsroom/auth.ts` |
| Second step (TOTP, passkeys, lockout) | `lib/newsroom/mfa.ts`, `app/newsroom/mfa-actions.ts`, `/setup`, `/verify` |
| Address gate + rewrite | `proxy.ts` (`newsroomGate`) |
| Storage (Neon, or a JSON file locally) | `lib/newsroom/store.ts` |
| What the public site reads (10 s version probe, fails open) | `lib/newsroom/published.ts` |
| Merge into the news feed | `lib/news.ts` (dashboard posts are the third source) |
| Dashboard pages + actions | `app/newsroom/` |
| Image uploads (direct to Blob, `newsroom/` prefix) | `app/api/newsroom/upload/route.ts` |

- **A dashboard post wins over a code post with the same slug.** Every dashboard
  post's slug, plus an imported post's original slug, hides the code copy,
  drafts included. Unpublishing an imported post takes it off the site;
  **deleting** it brings the code copy back.
- If the database is unreachable, the site serves the last good copy, or falls
  back to the code posts.
- Bodies are HTML, sanitized on output by `renderPostHtml` (lib/news-html.ts),
  with player names auto-linked. Paste from Google Docs/Word is cleaned.
- Every save calls `revalidatePath("/", "layout")`.
- **Home page picks:** up to 4 pinned pickleball.com articles (snapshots), in
  order; the newest fill empty slots (`homePickleballNews`).
- Not editable here: the 811 posts migrated from WordPress and the 39 PPA Blog posts.

## Later

- pickleball.com SSO (Jason's OIDC client) replaces the password step; the
  second step stays.
- Let editors add a second passkey or switch method from inside the dashboard.
- Once production has run on the dashboard copies for a while, the code copies
  can go. `NationalsLive`, `lib/event-spotlight.ts` and `lib/site-promo.ts`
  still read `lib/news-articles.ts` directly and need moving first.
