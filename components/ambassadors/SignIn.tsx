"use client";

import { useState } from "react";

type DemoOption = { email: string; label: string };

/**
 * Passwordless sign-in. Submitting the email always shows the same neutral
 * "if that email is on the list…" screen — it never reveals whether the email
 * is a real ambassador. The preview panel appears only off-production (the
 * server passes `preview`) and signs straight in as a demo ambassador.
 */
export function SignIn({
  preview,
  demoOptions,
  linkError,
}: {
  preview: boolean;
  demoOptions: DemoOption[];
  linkError: boolean;
}) {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "sent">("email");
  const [busy, setBusy] = useState(false);
  const [who, setWho] = useState(demoOptions[0]?.email ?? "");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      await fetch("/api/ambassadors/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      /* still show neutral screen */
    }
    setBusy(false);
    setStep("sent");
  }

  async function enterPreview() {
    if (!who) return;
    setBusy(true);
    const res = await fetch("/api/ambassadors/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: who }),
    });
    if (res.ok) {
      window.location.href = "/ambassadors/dashboard";
    } else {
      setBusy(false);
    }
  }

  return (
    <div className="signin">
      <div className="signin-card">
        <span className="eyebrow" style={{ color: "#E8BC4E" }}>
          PPA Tour · Ambassador Program
        </span>
        <h1>Ambassador dashboard</h1>

        {linkError && (
          <p className="err">That sign-in link didn&apos;t work — it may have expired or already been used. Enter your email for a fresh one.</p>
        )}

        {step === "email" ? (
          <>
            <p>Sign in with the email you use for the ambassador program. We&apos;ll send you a link. No password needed.</p>
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label htmlFor="amb-email" className="eyebrow" style={{ color: "var(--amb-navy-mute)" }}>
                Email
              </label>
              <input
                id="amb-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                placeholder="you@email.com"
                required
              />
              <button className="btn" type="submit" disabled={busy}>
                {busy ? "Sending…" : "Email me a sign-in link"}
              </button>
            </form>
            <p style={{ fontSize: ".82rem" }}>
              Not an ambassador yet?{" "}
              <a href="https://www.ppatour.com" style={{ color: "#fff" }}>
                Apply here
              </a>
              .
            </p>
          </>
        ) : (
          <div className="sent">
            <p style={{ color: "#fff" }}>
              <b>Check your email.</b> If {email} is on our ambassador list, we&apos;ve sent a sign-in link. It works once and expires in 15 minutes.
            </p>
            <button className="signout" onClick={() => setStep("email")} style={{ color: "var(--amb-navy-mute)" }}>
              Use a different email
            </button>
          </div>
        )}

        {preview && demoOptions.length > 0 && (
          <div className="preview-as">
            <span className="eyebrow" style={{ color: "#E8BC4E" }}>
              Preview mode · not live
            </span>
            <p style={{ color: "var(--amb-navy-mute)", fontSize: ".9rem" }}>
              This is a staging preview. Enter as a sample ambassador to click through — no email needed.
            </p>
            <select value={who} onChange={(ev) => setWho(ev.target.value)} aria-label="Preview as">
              {demoOptions.map((o) => (
                <option key={o.email} value={o.email}>
                  {o.label}
                </option>
              ))}
            </select>
            <button className="btn" onClick={enterPreview} disabled={busy}>
              Enter preview
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
