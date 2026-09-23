"use client";

import { useState } from "react";

/**
 * Edit-mode unlock for Ambassador HQ graphics. One shared team password sets the
 * editor cookie; on success we bounce to /hq, where the upload / code-box /
 * delete controls now appear. Viewing HQ never needs this — it only gates edits.
 */
export function HqEditSignIn() {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/hq/editor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) {
        window.location.href = "/hq";
        return;
      }
      setErr(res.status === 401 ? "That password didn't match." : "Something went wrong. Try again.");
    } catch {
      setErr("Couldn't reach the server. Try again.");
    }
    setBusy(false);
  }

  return (
    <div className="signin">
      <div className="signin-card">
        <span className="eyebrow" style={{ color: "#E8BC4E" }}>
          PPA Tour · Ambassador Program
        </span>
        <h1>HQ edit mode</h1>
        <p>Enter the team password to upload and manage graphics. Everything else stays read-only.</p>
        <form onSubmit={submit} className="preview-as" style={{ display: "grid", gap: 12 }}>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Team password"
            autoFocus
            style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,.25)", background: "rgba(255,255,255,.06)", color: "#fff", fontSize: "1rem" }}
          />
          {err ? <span style={{ color: "#ffb4a8", fontSize: ".86rem" }}>{err}</span> : null}
          <button className="btn" type="submit" disabled={busy || pw.length < 1}>
            {busy ? "Unlocking…" : "Unlock edit mode"}
          </button>
        </form>
        <p style={{ fontSize: ".82rem", color: "var(--amb-navy-mute)" }}>
          <a href="/hq" style={{ color: "#fff" }}>← Back to HQ</a>
        </p>
      </div>
    </div>
  );
}
