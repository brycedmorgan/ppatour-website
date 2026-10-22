"use client";

import { useState } from "react";

/**
 * Staff sign-in for Ambassador HQ. Phase 1: a preview bypass off-production so
 * the on-domain HQ can be reviewed before Google SSO is wired. On production
 * the Google button is shown but disabled until the OAuth client is set up
 * (Phase 2, restricted to @pickleball.com with roles).
 */
export function HqSignIn({ preview }: { preview: boolean }) {
  const [busy, setBusy] = useState(false);

  async function enterPreview() {
    setBusy(true);
    const res = await fetch("/api/hq/preview", { method: "POST" });
    if (res.ok) window.location.href = "/hq";
    else setBusy(false);
  }

  return (
    <div className="signin">
      <div className="signin-card">
        <span className="eyebrow" style={{ color: "#E8BC4E" }}>
          PPA Tour · Ambassador Program
        </span>
        <h1>Ambassador HQ</h1>
        <p>The internal hub for staff, pod leads and leadership — everyone&apos;s numbers, CRM, applicants, pods, volunteers and graphics.</p>

        {preview ? (
          <div className="preview-as">
            <span className="eyebrow" style={{ color: "#E8BC4E" }}>
              Preview mode · read-only · not live
            </span>
            <p style={{ color: "var(--amb-navy-mute)", fontSize: ".9rem" }}>
              This is a preview of HQ on ppatour.com. Enter to click through the read-only view — no login needed yet.
            </p>
            <button className="btn" onClick={enterPreview} disabled={busy}>
              {busy ? "Entering…" : "Enter HQ preview"}
            </button>
          </div>
        ) : (
          <>
            <button className="btn" disabled title="Coming in Phase 2">
              Sign in with Google (@pickleball.com)
            </button>
            <p style={{ fontSize: ".82rem", color: "var(--amb-navy-mute)" }}>
              Staff sign-in isn&apos;t switched on yet. For now, HQ lives at{" "}
              <a href="https://claude.ai/artifact/38LekXDQUkrZwkCKQ8j9zh" style={{ color: "#fff" }}>
                claude.ai
              </a>
              .
            </p>
          </>
        )}
      </div>
    </div>
  );
}
