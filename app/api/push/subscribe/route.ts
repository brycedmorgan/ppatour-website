import { NextResponse } from "next/server";
import { deleteSubscription, pushStoreConfigured, saveSubscription } from "@/lib/push-store";

/**
 * This device's push subscription and the pros it follows.
 *
 *   POST   { subscription: PushSubscriptionJSON, follows: string[] }
 *   DELETE { endpoint: string }
 *
 * The device owns the follow list; this is the routing table the sender reads.
 * No account, no identifier of any kind beyond the browser's own push endpoint.
 *
 * Answers 200 with `{ stored: false }` when no database is configured, so the
 * client can save follows locally and simply not promise alerts.
 */
export const dynamic = "force-dynamic";

type Body = {
  subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  follows?: unknown;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const endpoint = body.subscription?.endpoint;
  const p256dh = body.subscription?.keys?.p256dh;
  const auth = body.subscription?.keys?.auth;
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "incomplete subscription" }, { status: 400 });
  }
  if (!pushStoreConfigured()) return NextResponse.json({ stored: false });

  // Cap the list: a follow list is a person's favourite pros, not a scrape.
  const follows = Array.isArray(body.follows)
    ? body.follows.filter((f): f is string => typeof f === "string").slice(0, 200)
    : [];

  try {
    await saveSubscription({ endpoint, p256dh, auth, follows });
    return NextResponse.json({ stored: true, follows: follows.length });
  } catch {
    return NextResponse.json({ stored: false }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  let endpoint: string | undefined;
  try {
    endpoint = ((await request.json()) as { endpoint?: string }).endpoint;
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  if (!endpoint) return NextResponse.json({ error: "no endpoint" }, { status: 400 });
  if (!pushStoreConfigured()) return NextResponse.json({ removed: false });

  await deleteSubscription(endpoint);
  return NextResponse.json({ removed: true });
}
