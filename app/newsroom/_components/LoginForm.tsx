"use client";

import { useActionState } from "react";
import { login } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="space-y-4 border border-ppa-line bg-white p-6">
      <label className="block">
        <span className="text-sm font-semibold">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          className="mt-1 w-full border border-ppa-line px-3 py-2 focus:border-ppa-blue focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1 w-full border border-ppa-line px-3 py-2 focus:border-ppa-blue focus:outline-none"
        />
      </label>
      {state?.error && (
        <p role="alert" className="text-sm font-semibold text-red-700">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-ppa-blue px-4 py-2.5 text-sm font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ppa-blue-deep disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
