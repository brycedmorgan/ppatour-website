"use client";

import { useState, useTransition } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import { Fingerprint, KeyRound, Smartphone } from "lucide-react";
import { passkeySetupFinish, passkeySetupOptions, totpSetupFinish } from "../mfa-actions";
import { CodeForm } from "./CodeForm";

const card =
  "flex w-full items-start gap-3 border border-ppa-line bg-white p-4 text-left transition-colors hover:border-ppa-blue";

/** First sign-in: pick a passkey or an authenticator app, and set it up. */
export function MfaSetup({ email, qr, secret }: { email: string; qr: string; secret: string }) {
  const [mode, setMode] = useState<"choose" | "totp">("choose");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function addPasskey() {
    setError(null);
    start(async () => {
      const opts = await passkeySetupOptions();
      if (!opts.options) return setError(opts.error ?? "Something went wrong. Try again.");
      try {
        const response = await startRegistration({ optionsJSON: opts.options });
        const res = await passkeySetupFinish(response);
        if (res?.error) setError(res.error);
      } catch (err) {
        const name = (err as Error)?.name;
        setError(
          name === "NotAllowedError"
            ? "The passkey prompt was closed. Try again, or use an authenticator app."
            : "This device couldn't create a passkey. Use an authenticator app instead.",
        );
      }
    });
  }

  if (mode === "totp") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-ppa-navy/75">
          Scan this with an authenticator app (Google Authenticator, Microsoft Authenticator,
          1Password, Authy), then enter the 6-digit code it shows.
        </p>
        <div className="flex justify-center border border-ppa-line bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt={`QR code to add ${email} to an authenticator app`} width={220} height={220} />
        </div>
        <details className="text-xs text-ppa-navy/65">
          <summary className="cursor-pointer font-semibold">Can&apos;t scan? Enter this key instead</summary>
          <code className="mt-2 block break-all bg-white p-2 font-mono text-[13px] tracking-wider">
            {secret.match(/.{1,4}/g)?.join(" ")}
          </code>
        </details>
        <CodeForm submitLabel="Confirm and sign in" action={totpSetupFinish} />
        <button type="button" onClick={() => setMode("choose")} className="text-sm text-ppa-blue hover:underline">
          ← Use a passkey instead
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-ppa-navy/75">
        Your password is right. Before your first sign-in, add a second step. You&apos;ll use it
        every time you sign in.
      </p>
      <button type="button" disabled={pending} onClick={addPasskey} className={card}>
        <Fingerprint className="mt-0.5 size-6 shrink-0 text-ppa-blue" aria-hidden />
        <span>
          <span className="block font-semibold">
            {pending ? "Waiting for your device…" : "Use a passkey"}{" "}
            <span className="ml-1 bg-ppa-blue px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white">
              Recommended
            </span>
          </span>
          <span className="text-sm text-ppa-navy/65">
            Face ID, Touch ID, Windows Hello or a security key. Nothing to type.
          </span>
        </span>
      </button>
      <button type="button" disabled={pending} onClick={() => setMode("totp")} className={card}>
        <Smartphone className="mt-0.5 size-6 shrink-0 text-ppa-blue" aria-hidden />
        <span>
          <span className="block font-semibold">Use an authenticator app</span>
          <span className="text-sm text-ppa-navy/65">
            A 6-digit code from Google Authenticator, 1Password, Authy and similar apps.
          </span>
        </span>
      </button>
      {error && (
        <p role="alert" className="text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
      <p className="flex items-start gap-2 pt-2 text-xs text-ppa-navy/55">
        <KeyRound className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Lost your phone or passkey later? Wesley can reset it so you can set up a new one.
      </p>
    </div>
  );
}
