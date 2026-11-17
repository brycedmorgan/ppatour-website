"use client";

import { useState, useTransition } from "react";

/** A 6-digit authenticator code field. The action redirects on success. */
export function CodeForm({
  submitLabel,
  action,
}: {
  submitLabel: string;
  action: (code: string) => Promise<{ error: string } | undefined>;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const res = await action(code);
          if (res?.error) {
            setError(res.error);
            setCode("");
          }
        });
      }}
      className="space-y-3"
    >
      <label className="block">
        <span className="text-sm font-semibold">6-digit code</span>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          required
          autoFocus
          className="mt-1 w-full border border-ppa-line bg-white px-3 py-2 text-center font-mono text-2xl tracking-[0.4em] focus:border-ppa-blue focus:outline-none"
        />
      </label>
      {error && (
        <p role="alert" className="text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending || code.length !== 6}
        className="w-full bg-ppa-blue px-4 py-2.5 text-sm font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ppa-blue-deep disabled:opacity-60"
      >
        {pending ? "Checking…" : submitLabel}
      </button>
    </form>
  );
}
