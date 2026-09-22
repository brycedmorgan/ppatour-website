"use client";

import { useEffect, useRef, useState } from "react";
import type { Ev } from "@/components/ambassadors/types";

/** Event logo with a graceful fallback: an initials chip when there's no logo
 *  file or it fails to load (so a missing asset never shows a broken image). */
export function Logo({ ev, size = 44 }: { ev: Ev; size?: number }) {
  const src = ev.logo ? (ev.logo.startsWith("/") ? ev.logo : `/ambassadors/${ev.logo}`) : "";
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // The image can 404 before hydration attaches onError, so also check on mount.
  useEffect(() => {
    const el = ref.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, []);

  if (src && !failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img ref={ref} className="logo" style={{ width: size, height: size }} src={src} alt="" onError={() => setFailed(true)} />;
  }
  const initials = ev.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span className="logo" style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}>
      {initials}
    </span>
  );
}
