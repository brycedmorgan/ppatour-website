"use client";

import { useEffect, useRef } from "react";

/**
 * Cloudflare Turnstile widget — anti-spam parity with the ppatour.com Gravity
 * Forms. Loads the Turnstile script once, renders an explicit widget, and hands
 * the resulting token back via `onToken`. Renders nothing (and the form skips
 * verification) when NEXT_PUBLIC_TURNSTILE_SITE_KEY is unset, so local dev and
 * unconfigured environments still work.
 *
 * The parent bumps `resetKey` to force a fresh token after a failed submit
 * (tokens are single-use).
 */
declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      remove: (id: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

export function turnstileEnabled(): boolean {
  return Boolean(SITE_KEY);
}

export function Turnstile({
  onToken,
  resetKey,
}: {
  onToken: (token: string) => void;
  resetKey: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!SITE_KEY) return;
    let widgetId: string | undefined;
    let cancelled = false;

    function render() {
      if (cancelled || !window.turnstile || !containerRef.current) return;
      containerRef.current.innerHTML = "";
      widgetId = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: (token: string) => onToken(token),
        "error-callback": () => onToken(""),
        "expired-callback": () => onToken(""),
        theme: "auto",
      });
    }

    if (window.turnstile) {
      render();
    } else {
      let script = document.querySelector<HTMLScriptElement>("script[data-turnstile]");
      if (!script) {
        script = document.createElement("script");
        script.src = SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        script.setAttribute("data-turnstile", "");
        document.head.appendChild(script);
      }
      script.addEventListener("load", render);
    }

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [onToken, resetKey]);

  if (!SITE_KEY) return null;
  return <div ref={containerRef} className="mt-1" />;
}
