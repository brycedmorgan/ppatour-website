"use client";

import { useState, useTransition } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import { Fingerprint } from "lucide-react";
import { passkeyLoginFinish, passkeyLoginOptions, totpLogin } from "../mfa-actions";
import { CodeForm } from "./CodeForm";

/** Every sign-in after the first: passkey and/or authenticator code. */
export function MfaVerify({
  email,
  passkey,
  totp,
  passkeyElsewhere,
}: {
  email: string;
  passkey: boolean;
  totp: boolean;
  passkeyElsewhere: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function signInWithPasskey() {
    setError(null);
    start(async () => {
      const opts = await passkeyLoginOptions();
      if (!opts.options) return setError(opts.error ?? "Something went wrong. Try again.");
      try {
        const response = await startAuthentication({ optionsJSON: opts.options });
        const res = await passkeyLoginFinish(response);
        if (res?.error) setError(res.error);
      } catch (err) {
        setError(
          (err as Error)?.name === "NotAllowedError"
            ? "The passkey prompt was closed. Try again."
            : "This device couldn't use your passkey.",
        );
      }
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ppa-navy/75">Signing in as {email}.</p>
      {passkey && (
        <button
          type="button"
          disabled={pending}
          onClick={signInWithPasskey}
          className="flex w-full items-center justify-center gap-2 bg-ppa-blue px-4 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ppa-blue-deep disabled:opacity-60"
        >
          <Fingerprint className="size-5" aria-hidden />
          {pending ? "Waiting for your device…" : "Use your passkey"}
        </button>
      )}
      {passkey && totp && <p className="text-center text-xs uppercase tracking-[0.14em] text-ppa-navy/45">or</p>}
      {totp && <CodeForm submitLabel="Sign in" action={totpLogin} />}
      {passkeyElsewhere && !totp && (
        <p className="border-l-4 border-ppa-blue bg-white p-3 text-sm">
          Your passkey was set up on a different web address, so it can&apos;t be used here. Sign
          in where you set it up, or ask Wesley to reset your sign-in.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
