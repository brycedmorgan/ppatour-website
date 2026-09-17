/**
 * Operational alerts to Slack.
 *
 * ⚠ THIS IS NOT lib/forms/slack.ts, AND THE DIFFERENCE IS THE CONTRACT, NOT THE
 * TRANSPORT. That file's own docblock calls itself "a mirror, never a
 * destination" — a third copy of something the sheet already holds and the team
 * was already emailed about, so every failure there is correctly swallowed.
 * This file is the opposite: it IS the destination. Nothing else tells anyone
 * that the upstream API is refusing us, so a silent failure here means the alert
 * simply never happened. Hence {@link postAlert} reports whether it delivered,
 * and its caller is expected to care.
 *
 * Transport is the same `chat.postMessage` + `FORM_SLACK_BOT_TOKEN` the forms
 * use, because one bot credential can already reach any conversation.
 *
 * Server-only.
 */

/**
 * Where alerts go: a Slack conversation ID.
 *
 * ⚠ A USER ID (`U…`) DMs THAT PERSON; A CHANNEL ID (`C…`) POSTS TO THE CHANNEL.
 * `chat.postMessage` accepts either, so the destination is a deployment
 * decision rather than a code one — which is why it is an env var and not a
 * literal. Wesley asked for a DM (9/17), so production holds his user ID.
 *
 * ⚠ DMing A USER NEEDS THE BOT TO HAVE `im:write` ON TOP OF `chat:write`. The
 * forms only ever post to channels, so that scope may not be granted yet; if it
 * is missing Slack answers `channel_not_found` and {@link postAlert} returns
 * false rather than throwing. See the fallback note below for what happens then.
 */
const TARGET_ENV = "ALERT_SLACK_TARGET";

/**
 * Post an operational alert. Returns true only if Slack accepted it.
 *
 * ⚠ IT FALLS BACK TO THE FORMS WEBHOOK, WHICH CHANGES WHO SEES THE ALERT. The
 * webhook is bound to the channel it was created for, so a fallback delivery
 * lands in that channel and NOT in the intended DM. That is deliberate: for an
 * ops alert the worst outcome is silence, and a message in the wrong room still
 * reaches a human. The returned flag lets the caller log which path was used.
 */
export async function postAlert(text: string, blocks?: unknown[]): Promise<boolean> {
  const token = process.env.FORM_SLACK_BOT_TOKEN;
  const target = process.env[TARGET_ENV];
  const webhook = process.env.FORM_SLACK_WEBHOOK_URL;

  // `text` is always set even when blocks are used: it is what Slack shows in
  // the notification and in the sidebar preview, which for an alert is most of
  // the value — a push notification reading "PPA Tour website" tells nobody
  // anything.
  const message = blocks ? { text, blocks } : { text };

  if (token && target) {
    try {
      const res = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ channel: target, ...message }),
        signal: AbortSignal.timeout(8000),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (json.ok) return true;
      // Slack returns 200 with `ok: false` — a bad channel, a revoked token or
      // a missing scope all land here, never as an HTTP error.
      console.error(`[alert] slack chat.postMessage failed: ${json.error ?? "unknown"}`);
    } catch (err) {
      console.error(`[alert] slack chat.postMessage threw: ${String(err)}`);
    }
  } else {
    console.warn(
      `[alert] ${!token ? "FORM_SLACK_BOT_TOKEN" : TARGET_ENV} is unset — trying the webhook fallback`,
    );
  }

  if (!webhook) {
    console.error("[alert] no Slack destination configured; alert dropped");
    return false;
  }
  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) return true;
    console.error(`[alert] slack webhook failed: ${res.status}`);
  } catch (err) {
    console.error(`[alert] slack webhook threw: ${String(err)}`);
  }
  return false;
}
