/**
 * Push subscriptions, server side.
 *
 * ⚠ THERE IS NO USER TABLE HERE, AND THAT IS THE DESIGN. A row is a device
 * (keyed by its push endpoint) plus the slugs that device follows. No email, no
 * name, no account — Bryce's 8/18 call. That keeps this out of PII territory:
 * the worst thing the table can tell you is that some browser somewhere likes
 * Anna Leigh Waters.
 *
 * `sent` is the dedupe log. Every alert computes a stable key ("draw:<event>",
 * "live:<match>") and the sender refuses to fire the same key twice. Without it
 * a cron that runs every few minutes would tell a fan four times an hour that
 * the same match is on.
 *
 * ⚠ Reads and writes NO-OP when `DATABASE_URL` is unset. The app then still
 * runs, follows still save on the device, and the Following screen says alerts
 * are not switched on. This is deliberate: the fan app shipped before the
 * database existed, and a missing env var must degrade, not 500.
 */
import { neon } from "@neondatabase/serverless";

export type StoredSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
  follows: string[];
};

let ready: Promise<void> | null = null;

function db() {
  const url = process.env.DATABASE_URL;
  return url ? neon(url) : null;
}

export function pushStoreConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/** Create the two tables once per process. Cheap, idempotent, no migrations. */
async function init(sql: NonNullable<ReturnType<typeof db>>): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS push_subscriptions (
          endpoint    TEXT PRIMARY KEY,
          p256dh      TEXT NOT NULL,
          auth        TEXT NOT NULL,
          follows     TEXT[] NOT NULL DEFAULT '{}',
          created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
        )`;
      await sql`
        CREATE TABLE IF NOT EXISTS push_sent (
          key       TEXT PRIMARY KEY,
          sent_at   TIMESTAMPTZ NOT NULL DEFAULT now()
        )`;
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

export async function saveSubscription(sub: StoredSubscription): Promise<void> {
  const sql = db();
  if (!sql) return;
  await init(sql);
  await sql`
    INSERT INTO push_subscriptions (endpoint, p256dh, auth, follows)
    VALUES (${sub.endpoint}, ${sub.p256dh}, ${sub.auth}, ${sub.follows})
    ON CONFLICT (endpoint) DO UPDATE
      SET p256dh = EXCLUDED.p256dh,
          auth = EXCLUDED.auth,
          follows = EXCLUDED.follows,
          updated_at = now()`;
}

export async function deleteSubscription(endpoint: string): Promise<void> {
  const sql = db();
  if (!sql) return;
  await init(sql);
  await sql`DELETE FROM push_subscriptions WHERE endpoint = ${endpoint}`;
}

/** Every device following at least one of these slugs. */
export async function subscribersFollowing(slugs: string[]): Promise<StoredSubscription[]> {
  const sql = db();
  if (!sql || slugs.length === 0) return [];
  await init(sql);
  const rows = await sql`
    SELECT endpoint, p256dh, auth, follows
    FROM push_subscriptions
    WHERE follows && ${slugs}`;
  return rows as StoredSubscription[];
}

/** Every device, for tour-wide alerts. */
export async function allSubscribers(): Promise<StoredSubscription[]> {
  const sql = db();
  if (!sql) return [];
  await init(sql);
  const rows = await sql`SELECT endpoint, p256dh, auth, follows FROM push_subscriptions`;
  return rows as StoredSubscription[];
}

/**
 * Claim a dedupe key. Returns true only for the FIRST caller — the insert
 * either lands or conflicts, so two overlapping cron runs cannot both send.
 */
export async function claimOnce(key: string): Promise<boolean> {
  const sql = db();
  if (!sql) return false;
  await init(sql);
  const rows = await sql`
    INSERT INTO push_sent (key) VALUES (${key})
    ON CONFLICT (key) DO NOTHING
    RETURNING key`;
  return rows.length > 0;
}
