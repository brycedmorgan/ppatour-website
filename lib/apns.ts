/**
 * Apple Push Notification service, spoken directly over HTTP/2 with a
 * provider token (ES256 JWT). No Expo push service, no third party between a
 * score and a phone. Node's built-in http2 and crypto cover all of it.
 *
 * Env (Production):
 *   APNS_KEY_ID   — the .p8 key id (App Store Connect → Keys)
 *   APNS_TEAM_ID  — Pickleball OpCo team id (A7FZ282VS8)
 *   APNS_KEY      — the .p8 contents, newlines as "\n"
 *   APNS_TOPIC    — bundle id, default com.ppatour.app
 *   APNS_SANDBOX  — "1" to hit the development gateway (Xcode debug builds)
 *
 * Until those are set, apnsConfigured() is false and nothing is attempted —
 * same contract as the VAPID keys for web push.
 */
import { createPrivateKey, sign } from "node:crypto";
import http2 from "node:http2";
import type { PushPayload } from "@/lib/push-send";

type Cfg = { keyId: string; teamId: string; key: string; topic: string; host: string };

function cfg(): Cfg | null {
  const keyId = process.env.APNS_KEY_ID;
  const teamId = process.env.APNS_TEAM_ID;
  const key = process.env.APNS_KEY?.replace(/\\n/g, "\n");
  if (!keyId || !teamId || !key) return null;
  return {
    keyId,
    teamId,
    key,
    topic: process.env.APNS_TOPIC || "com.ppatour.app",
    host: process.env.APNS_SANDBOX === "1" ? "https://api.sandbox.push.apple.com" : "https://api.push.apple.com",
  };
}

export function apnsConfigured(): boolean {
  return cfg() !== null;
}

let jwtCache: { token: string; at: number } | null = null;

/** Provider token, reused for up to 50 minutes (Apple allows 60). */
function providerToken(c: Cfg): string {
  const now = Math.floor(Date.now() / 1000);
  if (jwtCache && now - jwtCache.at < 50 * 60) return jwtCache.token;
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${b64({ alg: "ES256", kid: c.keyId })}.${b64({ iss: c.teamId, iat: now })}`;
  const sig = sign("sha256", Buffer.from(unsigned), { key: createPrivateKey(c.key), dsaEncoding: "ieee-p1363" });
  const token = `${unsigned}.${sig.toString("base64url")}`;
  jwtCache = { token, at: now };
  return token;
}

export type ApnsResult = { ok: boolean; status: number; reason?: string };

/** Send one alert to one device token. Resolves; never throws. */
export function apnsSend(token: string, payload: PushPayload): Promise<ApnsResult> {
  const c = cfg();
  if (!c) return Promise.resolve({ ok: false, status: 0, reason: "unconfigured" });
  // Sign before opening a session: a malformed APNS_KEY throws here, and this
  // function promises never to throw or leak a connection.
  let auth: string;
  try {
    auth = `bearer ${providerToken(c)}`;
  } catch (e) {
    return Promise.resolve({ ok: false, status: 0, reason: `bad key: ${String(e)}` });
  }
  return new Promise((resolve) => {
    let settled = false;
    const client = http2.connect(c.host);
    const done = (r: ApnsResult) => {
      if (settled) return;
      settled = true;
      client.close();
      resolve(r);
    };
    client.on("error", (e) => done({ ok: false, status: 0, reason: String(e) }));
    const body = JSON.stringify({
      aps: { alert: { title: payload.title, body: payload.body }, sound: "default", "thread-id": payload.tag ?? "ppa" },
      url: payload.url,
    });
    const req = client.request({
      ":method": "POST",
      ":path": `/3/device/${token}`,
      authorization: auth,
      "apns-topic": c.topic,
      "apns-push-type": "alert",
      "apns-priority": "10",
      ...(payload.tag ? { "apns-collapse-id": payload.tag.slice(0, 64) } : {}),
      "content-type": "application/json",
    });
    let status = 0;
    let text = "";
    req.on("response", (h) => {
      status = Number(h[":status"] ?? 0);
    });
    req.setEncoding("utf8");
    req.on("data", (d) => {
      text += d;
    });
    req.on("end", () => {
      let reason: string | undefined;
      try {
        reason = (JSON.parse(text) as { reason?: string }).reason;
      } catch {
        /* no body on 200 */
      }
      done({ ok: status === 200, status, reason });
    });
    // A destroyed stream emits 'close' without 'end' or 'error'; settle on it too.
    req.on("close", () => done({ ok: false, status, reason: status ? undefined : "closed" }));
    req.on("error", (e) => done({ ok: false, status: 0, reason: String(e) }));
    req.setTimeout(8000, () => done({ ok: false, status: 0, reason: "timeout" }));
    req.end(body);
  });
}
