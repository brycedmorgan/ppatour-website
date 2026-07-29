/**
 * Durable form-submission store. Every form submission is appended as a row
 * to a Google Sheet via a Google Apps Script Web App (deployed as a webhook).
 * One tab per form type; staff open the sheet like any spreadsheet.
 *
 * Why Apps Script and not the Sheets API: no OAuth/service-account keys to
 * manage, no npm deps — just one webhook URL + a shared secret. The script
 * creates the tab and header row on first write. See docs/FORMS.md for the
 * script source and deploy steps.
 *
 * Env (unset locally → append is skipped and logged, never throws):
 *   FORM_SHEET_WEBHOOK_URL — the Apps Script /exec URL
 *   FORM_SHEET_SECRET      — shared secret, checked by the script
 */
const WEBHOOK_URL = process.env.FORM_SHEET_WEBHOOK_URL;
const SHEET_SECRET = process.env.FORM_SHEET_SECRET;

export function sheetConfigured(): boolean {
  return Boolean(WEBHOOK_URL && SHEET_SECRET);
}

/**
 * Append one submission to the sheet. `tab` is the worksheet name (form
 * type); `record` is a flat map of column → value. Returns false on failure
 * but never throws — the caller decides whether a failed append should fail
 * the whole request (it shouldn't, as long as the notification email sends).
 */
export async function appendToSheet(
  tab: string,
  record: Record<string, unknown>,
): Promise<boolean> {
  if (!sheetConfigured()) {
    console.warn("[google-sheet] not configured — append skipped", { tab });
    return true;
  }
  try {
    const res = await fetch(WEBHOOK_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: SHEET_SECRET, tab, record }),
    });
    if (!res.ok) {
      console.error("[google-sheet] append failed", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (err) {
    console.error("[google-sheet] append error", err, { tab });
    return false;
  }
}
