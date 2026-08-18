"use client";

import { readFollows } from "@/components/app/follows";

/**
 * Web push, client half.
 *
 * ⚠ iOS ONLY DELIVERS PUSH TO AN INSTALLED APP. Safari 16.4+ supports the Web
 * Push API, but only from a page added to the home screen — in a normal Safari
 * tab `Notification.requestPermission` is not even callable. That is the single
 * biggest reason the installable shell had to come first.
 *
 * ⚠ Permission must be requested from a user gesture, and asking on load is how
 * you get a permanent "Denied" with no way back. The toggle on the Following
 * screen is the only caller.
 */
const KEY_PARAM = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function pushConfigured(): boolean {
  return Boolean(KEY_PARAM);
}

export function permissionState(): NotificationPermission | "unsupported" {
  if (!pushSupported()) return "unsupported";
  return Notification.permission;
}

/**
 * VAPID keys travel as base64url; PushManager wants raw bytes.
 *
 * Returns the backing ArrayBuffer rather than the view: TypeScript's DOM types
 * require an `ArrayBuffer`-backed BufferSource, and a plain `Uint8Array` is
 * typed as possibly `SharedArrayBuffer`-backed.
 */
function urlBase64ToBytes(base64: string): ArrayBuffer {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes.buffer;
}

/**
 * Send this device's subscription and follow list to the server. Called after
 * subscribing and again on every follow change, so the routing table cannot
 * drift from what the fan sees on their own screen.
 */
export async function syncSubscription(): Promise<void> {
  if (!pushSupported()) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ subscription: sub.toJSON(), follows: readFollows().map((f) => f.slug) }),
  }).catch(() => {
    /* a failed sync is retried on the next follow change */
  });
}

/** Ask, subscribe, register. Returns the resulting permission state. */
export async function enablePush(): Promise<NotificationPermission | "unsupported"> {
  if (!pushSupported()) return "unsupported";
  if (!KEY_PARAM) return Notification.permission;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission;

  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (!existing) {
    await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToBytes(KEY_PARAM),
    });
  }
  await syncSubscription();
  return "granted";
}

export async function disablePush(): Promise<void> {
  if (!pushSupported()) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  await fetch("/api/push/subscribe", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  }).catch(() => {});
  await sub.unsubscribe();
}
