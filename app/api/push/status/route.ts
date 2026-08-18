import { NextResponse } from "next/server";
import { ALERT_LABEL, enabledAlerts } from "@/lib/push-alerts";
import { pushSendConfigured } from "@/lib/push-send";
import { pushStoreConfigured } from "@/lib/push-store";

/**
 * Can this deployment actually deliver an alert?
 *
 * ⚠ THE CLIENT CANNOT WORK THIS OUT ALONE, AND GUESSING IS THE WORST OUTCOME.
 * A browser only needs the public VAPID key to subscribe successfully, so
 * without this check the app would happily ask for notification permission,
 * take the yes, show "Alerts are on" — and then never send anything, because
 * there is no database to store the subscription in or no private key to sign
 * with. A fan who has been told alerts are on and hears nothing concludes the
 * app is broken, and the permission they granted is the one thing that cannot
 * be asked for twice.
 *
 * So the Following screen asks here first, and only offers the toggle when both
 * halves are real.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const store = pushStoreConfigured();
  const sender = pushSendConfigured();
  return NextResponse.json({
    ready: store && sender,
    store,
    sender,
    // The Following screen lists these verbatim, so it can only ever promise
    // an alert that actually fires. Adding one to PUSH_ALERTS updates the copy
    // on the fan's screen with no deploy.
    alerts: enabledAlerts().map((a) => ALERT_LABEL[a]),
  });
}
