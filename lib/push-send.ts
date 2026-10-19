/**
 * Sending a web push. Thin wrapper over `web-push` with the two things that
 * actually matter in production: VAPID config from env, and pruning dead
 * endpoints.
 *
 * ⚠ A push endpoint dies silently. Uninstall the app, wipe the browser, and the
 * endpoint answers 404 or 410 forever after. Without the prune below the table
 * fills with corpses and every send gets slower for everyone.
 */
import webpush from "web-push";
import { apnsConfigured, apnsSend } from "@/lib/apns";
import { deleteSubscription, type StoredSubscription } from "@/lib/push-store";

export type PushPayload = {
  title: string;
  body: string;
  /** Where tapping it goes. */
  url: string;
  /** Replaces an earlier notification with the same tag instead of stacking. */
  tag?: string;
};

let configured = false;

function configure(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:info@ppatour.com";
  if (!publicKey || !privateKey) return false;
  if (!configured) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    configured = true;
  }
  return true;
}

export function pushSendConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) || apnsConfigured();
}

/** Fan out one payload. Returns how many devices actually took it. */
export async function sendToAll(
  subs: StoredSubscription[],
  payload: PushPayload,
): Promise<number> {
  if (subs.length === 0) return 0;
  // Phones registered through /api/push/native carry a prefixed pseudo-endpoint.
  const phones = subs.filter((s) => s.endpoint.startsWith("apns:"));
  const web = subs.filter((s) => !s.endpoint.startsWith("apns:") && !s.endpoint.startsWith("fcm:"));
  const body = JSON.stringify(payload);

  const webResults = configure()
    ? await Promise.all(
        web.map(async (s) => {
          try {
            await webpush.sendNotification(
              { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
              body,
            );
            return true;
          } catch (err) {
            const status = (err as { statusCode?: number }).statusCode;
            if (status === 404 || status === 410) await deleteSubscription(s.endpoint);
            return false;
          }
        }),
      )
    : [];

  const phoneResults = apnsConfigured()
    ? await Promise.all(
        phones.map(async (s) => {
          const r = await apnsSend(s.endpoint.slice("apns:".length), payload);
          // 410 Unregistered, or 400 BadDeviceToken: the app is gone from that phone.
          if (r.status === 410 || r.reason === "BadDeviceToken") await deleteSubscription(s.endpoint);
          return r.ok;
        }),
      )
    : [];

  return [...webResults, ...phoneResults].filter(Boolean).length;
}
