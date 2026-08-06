# Forms — architecture, storage, and deploy

Every inquiry/application form on the site runs through **one pipeline**. There
is no Gravity Forms / WordPress dependency — forms are native React + a single
Next.js route handler.

## How a submission flows

```
<InquiryForm formType="…" />   (client, components/forms/InquiryForm.tsx)
        │  POST { formType, ...fields, website(honeypot) }
        ▼
/api/form-submit  (app/api/form-submit/route.ts)
        │  validate against lib/forms/schema.ts
        ├─► 1. Google Sheet append   (lib/google-sheet.ts)      ← system of record
        ├─► 2. Slack mirror           (lib/forms/slack.ts)        ← visibility only, best-effort
        ├─► 3. Notification email     (Customer.io transactional) ← routed inbox, reply-to = submitter
        └─► 4. Customer.io identify   (optional, marketing forms)
```

- **Email notification** — Customer.io transactional send from the verified
  `info@ppatour.com` sender. Recipient is routed per form in
  `lib/forms/routing.ts` (contact routes by its Topic dropdown). `reply_to` is
  the submitter so staff reply directly — **except** reporting, which is
  anonymous-capable and never sets a reply-to.
- **Durable record** — one row appended to a Google Sheet, one tab per form.
  This is the "spreadsheet of all submissions." Best-effort: a Sheets outage
  never fails a request the team was already emailed about.
- **Slack mirror** — a copy of the submission posted to the forms channel, for
  visibility while the pipeline is being verified. Best-effort and never fails a
  request; see below for which forms are excluded.
- **Marketing sync** — only when a form sets `cioEvent` in routing.

Degrades gracefully: with no env configured (local dev) submissions are logged
to the server console and the form still shows success.

## Adding a new form (≈ 2 small edits)

1. Add a `FormSchema` entry in `lib/forms/schema.ts` (fields + copy).
2. Add a matching `FormRouting` entry in `lib/forms/routing.ts` (inbox +
   subject + sheet tab).
3. Drop `<InquiryForm formType="yourKey" />` on the page.

The route validates against the same schema the form renders, so they can't
drift.

## Environment variables

| Var | Used by | Notes |
|---|---|---|
| `CUSTOMERIO_APP_API_KEY` | notification email | already used by volunteer-apply |
| `FORM_SHEET_WEBHOOK_URL` | Google Sheet append | the Apps Script `/exec` URL (below) |
| `FORM_SHEET_SECRET` | Google Sheet append | shared secret, checked by the script |
| `BLOB_READ_WRITE_TOKEN` | file uploads | auto-set when a Vercel Blob store is linked |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | anti-spam (client widget) | Cloudflare Turnstile site key; unset → widget hidden, no check |
| `TURNSTILE_SECRET_KEY` | anti-spam (server verify) | Cloudflare Turnstile secret; unset → verification skipped |
| `FORM_INBOX_*` | notification routing | **Required in production** — see below |
| `FORM_NOTIFY_ALWAYS` | notification routing | Optional. Copied on **every** form notification, on top of the routed inbox — see below |
| `FORM_SLACK_BOT_TOKEN` | Slack mirror | Optional. Bot token (`chat:write`) — required for per-topic/per-form channels |
| `FORM_SLACK_CHANNEL_*` | Slack mirror | Optional. Channel ID per destination — see below |
| `FORM_SLACK_WEBHOOK_URL` | Slack mirror | Fallback only. Single-channel; used when no bot token is set |

### Notification inboxes (`FORM_INBOX_*`)

**This repo is public, so no staff address is hardcoded.** `lib/forms/routing.ts`
names an env var per destination and resolves it at submit time. Any unset var
falls back to `info@ppatour.com` with a `console.warn` — a lead gets misrouted to
a real person rather than dropped, but production should set all of them.

Each value may be a **comma-separated list** of addresses.

| Var | Routes | Live GF recipient (2026-07-27 export) |
|---|---|---|
| `FORM_INBOX_SUPPORT` | Contact → *Pickleball Brackets/Tournaments* | Pickleball.com support |
| `FORM_INBOX_REGISTRATIONS` | Contact → *Registrations* | registrations lead |
| `FORM_INBOX_TICKETING` | Contact → *Tickets* | ticketing (2 addresses) |
| `FORM_INBOX_BROADCAST` | Contact → *PBTV/Broadcasting* | PBTV support |
| `FORM_INBOX_PR` | Contact → *Public Relations* | PR lead |
| `FORM_INBOX_SPONSORSHIP` | Contact → *Sponsorship* | Connor + Jacob (2 addresses) |
| `FORM_INBOX_MARKETING` | Contact → *Marketing*, *Other*, and any unmapped topic | marketing lead |
| `FORM_INBOX_CHALLENGER` | Contact → *PPA Challenger* | challengers inbox |
| `FORM_INBOX_CAREERS` | Careers application | careers inbox |
| `FORM_INBOX_INTEGRITY` | Reporting (anonymous-capable) | integrity lead |
| `FORM_INBOX_HOSPITALITY` | Hospitality booking | hospitality lead |
| `FORM_INBOX_EVENTS` | Host-a-tournament RFP + Event inquiry | events lead |
| `FORM_INBOX_PRIVATE_EVENTS` | Private/sponsored event | private-events lead |
| `FORM_INBOX_AMBASSADOR` | Ambassador application | ambassador team (4 addresses) |
| `FORM_INBOX_OPT_IN` | Fan opt-in | CRM lead |
| `FORM_INBOX_NEWSLETTER` | Footer newsletter signup | `info@ppatour.com` |

The addresses were never committed, so they are **not recoverable from git** —
they live in the Gravity Forms export, in Vercel's env store, and in each dev's
gitignored `.env.local`. Get them from there, and never paste them back into a
tracked file.

`newsletter-junior` intentionally has **no** inbox (list-only, matching the live
site).

### Copying one person on everything (`FORM_NOTIFY_ALWAYS`)

Set `FORM_NOTIFY_ALWAYS` to a comma-separated list and those addresses are added
to **every** form notification, on top of whatever inbox the form already routes
to. Added 8/6 (Wesley) to watch delivery across all forms at once.

```
FORM_NOTIFY_ALWAYS=someone@ppatour.com
```

- Applies to all three routes that email: `/api/form-submit` (every form in
  `FORM_ROUTING`), `/api/sponsor-inquiry`, and `/api/volunteer-apply`.
- The routed inbox stays **first** — `sendFormNotification` derives the
  Customer.io identifier from the first address, so the send is still attributed
  to the destination inbox, not the observer.
- Dedupe is case-insensitive: someone already on a form's `FORM_INBOX_*` list
  gets one copy of that form, not two.
- A form with no inbox still sends nothing — `newsletter-junior` stays silent.
- **To stop:** unset the variable and redeploy. One line, which is the reason it
  isn't an address appended to sixteen `FORM_INBOX_*` vars.
- ⚠ Set it in **Production and Preview** if preview submissions should be seen
  too; the address is a real person's inbox, so preview/test traffic lands there.

## Slack mirror

Every non-newsletter submission also posts to Slack — by default
**#website-form-submissions** (private), or to a per-topic / per-form channel
where one is configured. Added 8/6 (Wesley). Implementation: `lib/forms/slack.ts`.

```
FORM_SLACK_BOT_TOKEN=xoxb-…            # chat:write (+ chat:write.public)
FORM_SLACK_CHANNEL_DEFAULT=C0BNBKP0B99 # #website-form-submissions
```

### Channel routing

Resolution order: **contact Inquiry Topic → form → `FORM_SLACK_CHANNEL_DEFAULT`**.
Every level falls back rather than dropping, so an unmapped topic or an unset
variable lands in the default channel — a submission in the wrong-but-monitored
channel is recoverable, one that goes nowhere looks like a broken form.

⚠ **Routes that share a channel name the SAME variable**, so one channel is one
ID in one place. `FORM_SLACK_CHANNEL_SPONSORSHIP` serves both the contact topic
*Sponsorship* and the sponsorship form; `FORM_SLACK_CHANNEL_EVENTS` serves both
event forms. Moving that channel is one edit, and the two routes cannot drift
apart. Values are channel **IDs** (`C…`) so a rename doesn't break routing.

| Var | Routes |
|---|---|
| `FORM_SLACK_CHANNEL_SUPPORT` | Contact → *Pickleball Brackets/Tournaments* |
| `FORM_SLACK_CHANNEL_REGISTRATIONS` | Contact → *Registrations* |
| `FORM_SLACK_CHANNEL_TICKETING` | Contact → *Tickets* |
| `FORM_SLACK_CHANNEL_BROADCAST` | Contact → *PBTV/Broadcasting* |
| `FORM_SLACK_CHANNEL_PR` | Contact → *Public Relations* |
| `FORM_SLACK_CHANNEL_SPONSORSHIP` | Contact → *Sponsorship* **and** the sponsorship form |
| `FORM_SLACK_CHANNEL_MARKETING` | Contact → *Marketing*, *Other*, any unmapped topic |
| `FORM_SLACK_CHANNEL_CHALLENGER` | Contact → *PPA Challenger* |
| `FORM_SLACK_CHANNEL_CAREERS` | Careers |
| `FORM_SLACK_CHANNEL_HOSPITALITY` | Hospitality |
| `FORM_SLACK_CHANNEL_EVENTS` | Host-a-tournament RFP **and** Event inquiry |
| `FORM_SLACK_CHANNEL_PRIVATE_EVENTS` | Private/sponsored event |
| `FORM_SLACK_CHANNEL_AMBASSADOR` | Ambassador |
| `FORM_SLACK_CHANNEL_VOLUNTEER` | Volunteer |
| `FORM_SLACK_CHANNEL_OPT_IN` | Fan opt-in |

The names mirror the `FORM_INBOX_*` set above, so each channel is visibly the
counterpart of the inbox that gets the same submission by email.

⚠ **`chat.postMessage` answers HTTP 200 when it refuses** — `channel_not_found`,
`not_in_channel` and `invalid_auth` all arrive as `{ok:false, error}`. The code
checks the body, so those log an error rather than reporting a phantom success.
If a channel stays empty, the Vercel log names the Slack error.

- **Best-effort, always.** The sheet is the system of record and the routed
  inbox is how the team is actually notified — this is a third copy. Every
  failure (outage, revoked webhook, rate limit, 5s timeout) is logged and
  swallowed, and the post runs **before** the email so a Customer.io outage
  doesn't also cost the channel its copy.
- **Excluded forms:** `newsletter`, `newsletter-junior` (list signups — they'd
  bury real submissions) and ⚠ **`reporting`**.
- ⚠ **`reporting` is excluded deliberately** — it's the integrity form:
  anonymous-capable, the only form that never sets a reply-to, routed to the
  integrity inbox alone. A Slack channel is a durable searchable copy whose
  membership can widen later without anyone revisiting it. Removing it from
  `SLACK_EXCLUDED_FORMS` is a decision about who may read misconduct reports,
  not a cleanup.
- Long values are truncated (700 chars each, 6 section blocks max) and the
  truncation is **stated in the message** rather than silent — the email and the
  sheet always hold the full submission.
- **To stop:** unset the variable and redeploy.

### Setting up the bot token

1. <https://api.slack.com/apps> → the **PPA Website Forms** app →
   **OAuth & Permissions** → **Bot Token Scopes** → add **`chat:write`** and
   **`chat:write.public`**.
2. **Install to Workspace** (reinstall if it's already installed — new scopes
   need it) → copy the **Bot User OAuth Token** (`xoxb-…`).
3. Set `FORM_SLACK_BOT_TOKEN` in Vercel (Production + Preview) and redeploy.
4. `/invite @PPA Website Forms` in every **private** destination channel.
   `chat:write.public` covers public channels without joining; private ones
   always require the invite, and without it the post fails `not_in_channel`.

⚠ The bot token is a bearer credential — it goes in Vercel's env store, never in
a tracked file. Rotate from the same OAuth page.

### The webhook fallback (`FORM_SLACK_WEBHOOK_URL`)

An incoming webhook is bound to **one channel at creation**, so it cannot honour
any routing. It is kept only as the no-token fallback: with `FORM_SLACK_BOT_TOKEN`
unset, every form posts to that single channel — the behaviour from before
routing existed — and a warning is logged saying so. Once the token is in, the
webhook is unused and can be deleted from both Vercel and the Slack app.

## Cloudflare Turnstile (anti-spam)

Matches the Gravity Forms' Turnstile. The widget shows above every form's
submit button and its token is verified server-side in `/api/form-submit`.
Both keys unset → the widget is hidden and verification is skipped, so local
dev and unconfigured environments still work.

Setup: Cloudflare dashboard → **Turnstile → Add site** (add `ppatour.com`
and the Vercel preview domain). Copy the **Site Key** → `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
and **Secret Key** → `TURNSTILE_SECRET_KEY` in Vercel, then redeploy.
Cloudflare's always-pass test keys (`1x00000000000000000000AA` /
`1x0000000000000000000000000000000AA`) are handy for a staging check.

Set all three in Vercel (production + preview). Unset locally is fine.

## Google Sheet storage — one-time setup

1. Create a Google Sheet (e.g. "PPA Tour — Website Submissions").
2. Extensions → **Apps Script**, paste the script below, set `SECRET` to a
   long random string.
3. **Deploy → New deployment → Web app**: execute as *me*, access *Anyone*.
   Copy the `/exec` URL.
4. In Vercel set `FORM_SHEET_WEBHOOK_URL` = that URL and `FORM_SHEET_SECRET` =
   the same secret. Redeploy.

The script creates a tab + header row automatically the first time each form is
submitted. Columns follow the first record's keys (`submittedAt` first).

```javascript
// Apps Script — bound to the submissions Sheet. Deploy as a Web app.
const SECRET = 'REPLACE_WITH_A_LONG_RANDOM_STRING'; // must equal FORM_SHEET_SECRET

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.secret !== SECRET) {
      return json_({ ok: false, error: 'unauthorized' });
    }
    const tab = String(body.tab || 'Submissions').slice(0, 90);
    const record = body.record || {};

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(tab);
    if (!sheet) {
      sheet = ss.insertSheet(tab);
    }

    // Header row: reuse existing, else create from this record's keys.
    let headers = [];
    if (sheet.getLastRow() === 0) {
      headers = Object.keys(record);
      sheet.appendRow(headers);
    } else {
      headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      // Add any new keys as columns so later fields aren't dropped.
      Object.keys(record).forEach(function (k) {
        if (headers.indexOf(k) === -1) {
          headers.push(k);
          sheet.getRange(1, headers.length).setValue(k);
        }
      });
    }

    const row = headers.map(function (h) { return record[h] != null ? record[h] : ''; });
    sheet.appendRow(row);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## Full ppatour.com forms inventory → plan

Already built this pass: **contact**, **careers**, **reporting**. Already in the
repo from earlier: **sponsorship** (`/api/sponsor-inquiry` → Jackalope leads),
**volunteer** (`/api/volunteer-apply`), **lead-capture** (email signup).

| ppatour.com form | Mechanic | Status |
|---|---|---|
| Search (header) | client `/search` | ✅ exists (not a submission) |
| Newsletter signup (gform_2, footer) | email-only → Customer.io | reuse lead-capture variant |
| Contact (gform_5) | inquiry | ✅ this pass |
| Careers (gform_9) | inquiry | ✅ this pass |
| Reporting / press (gform_8) | inquiry | ✅ this pass (integrity) |
| Sponsorship (gform_4) | inquiry → Jackalope | ✅ exists |
| Hospitality / VIP (gform_17) | inquiry | add schema+routing entry |
| Host-a-tournament (gform_7) | inquiry | add schema+routing entry |
| Private event (gform_19) | inquiry | add schema+routing entry |
| International event (gform_20) | inquiry | add schema+routing entry |
| Ambassador / volunteer (gform_6) | inquiry | ✅ volunteer exists (extend for ambassador) |
| Fan video submission (gform_15) | upload → Vercel Blob + inquiry | needs file storage — custom |
| Fan/player opt-in (gform_11) | email-only → Customer.io | reuse lead-capture variant |
| Privacy / CCPA-GDPR (cmplz) | inquiry → legal inbox | add schema+routing entry |
| Tournament filter (schedule) | client filter | ✅ exists on /events |
| Email signup (gform_10, gform_14) | email-only → Customer.io | reuse lead-capture variant |

The remaining inquiry forms are each ~2 edits (schema + routing) once this
pattern is approved. Email-only signups reuse the existing lead-capture route
with a new `variant`. Fan video is the one true custom case (file upload).
