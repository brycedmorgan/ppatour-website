/**
 * Replay real contact-form messages through the triage and print what each
 * would have done — category, route, status, the answer, what it left for a
 * person. The check before trusting the auto-reply, and the check after any
 * prompt or knowledge-pack change.
 *
 *   npx tsx scripts/triage-eval.ts path/to/fixture.json [--answers]
 *
 * Fixture: JSON array of { name?, topic?, message }. ⚠ KEEP FIXTURES OUT OF THE
 * REPO — they are fans' messages and this repository is public. The session
 * scratchpad holds the one built from #ppa-marketing-form on 9/17.
 *
 * Needs ANTHROPIC_API_KEY in .env.local (loaded by the shim). Sends nothing:
 * no email, no Slack, no sheet — this calls triageContact() only.
 */
import "../scratchpad/load-env";
import fs from "node:fs";
import { triageContact } from "../lib/forms/triage";

const file = process.argv[2];
const showAnswers = process.argv.includes("--answers");
if (!file) {
  console.error("usage: npx tsx scripts/triage-eval.ts fixture.json [--answers]");
  process.exit(1);
}
type Row = { name?: string; topic?: string; message: string };
const rows = JSON.parse(fs.readFileSync(file, "utf8")) as Row[];

const counts: Record<string, number> = {};
for (const [i, r] of rows.entries()) {
  const [firstName, ...rest] = (r.name || "").split(" ");
  const t0 = Date.now();
  const t = await triageContact({
    firstName,
    lastName: rest.join(" "),
    email: "fan@example.com",
    topic: r.topic || "Other",
    message: r.message,
  });
  const ms = Date.now() - t0;
  counts[t.status] = (counts[t.status] || 0) + 1;
  console.log(
    `${String(i + 1).padStart(2)}. ${t.status.padEnd(11)} ${String(t.category).padEnd(12)} → ${String(t.route).padEnd(13)} ${t.confidence ?? ""}  ${ms}ms  ${t.summary ?? t.skippedReason ?? ""}`,
  );
  if (t.openQuestions.length) console.log(`      still owed: ${t.openQuestions.join(" | ")}`);
  if (showAnswers && t.answer) console.log(`\n${t.answer.replace(/^/gm, "      ")}\n`);
}
console.log("\n", counts);
