"use client";

import { useEffect, useRef, useState } from "react";
import type { Ev, Graphic, Me, Shared } from "@/components/ambassadors/types";
import { fmtDate, logoBox } from "@/components/ambassadors/format";

/** Loads stamp.js once and reports when window.Stamp is ready. */
function useStamp(): boolean {
  const [ready, setReady] = useState<boolean>(() => typeof window !== "undefined" && !!window.Stamp);
  useEffect(() => {
    if (ready) return;
    let done = false;
    const mark = () => {
      if (!done && window.Stamp) {
        done = true;
        setReady(true);
      }
    };
    // Already present: mark asynchronously (avoids a synchronous effect setState).
    if (window.Stamp) {
      queueMicrotask(mark);
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-stamp="1"]');
    if (existing) {
      existing.addEventListener("load", mark);
      return () => existing.removeEventListener("load", mark);
    }
    const s = document.createElement("script");
    s.src = "/ambassadors/stamp.js";
    s.async = true;
    s.dataset.stamp = "1";
    s.onload = mark;
    document.body.appendChild(s);
  }, [ready]);
  return ready;
}

function srcFor(file: string): string {
  return file.startsWith("/") ? file : `/ambassadors/${file}`;
}

type Rendered = { url: string; blob: Blob; name: string };

export function GraphicsTab({ me, shared }: { me: Me; shared: Shared }) {
  const stampReady = useStamp();
  const [rendered, setRendered] = useState<Record<string, Rendered>>({});
  const started = useRef(false);

  const evById = (id: string): Ev | undefined => shared.events.find((e) => e.id === id);
  const groups = me.upcoming
    .map((u) => ({ ev: evById(u.event), code: u.code, items: shared.graphics.filter((g) => g.event === u.event) }))
    .filter((g): g is { ev: Ev; code: string; items: Graphic[] } => !!g.ev);
  const withArt = groups.filter((g) => g.items.length);
  const withoutArt = groups.filter((g) => !g.items.length);

  useEffect(() => {
    if (!stampReady || started.current) return;
    started.current = true;
    let cancelled = false;
    (async () => {
      for (const u of me.upcoming) {
        for (const g of shared.graphics.filter((x) => x.event === u.event)) {
          try {
            const img = await window.Stamp!.loadImage(srcFor(g.file));
            const isPng = g.type === "image/png";
            const blob = await window.Stamp!.renderStamped(
              img,
              g.stamp,
              { CODE: u.code, FIRST: me.firstName, NAME: `${me.firstName} ${me.lastName}` },
              isPng ? "image/png" : "image/jpeg",
            );
            if (cancelled) return;
            const key = `${g.id}::${u.code}`;
            setRendered((r) => ({
              ...r,
              [key]: { url: URL.createObjectURL(blob), blob, name: `${u.code}_${g.slug}.${isPng ? "png" : "jpg"}` },
            }));
          } catch {
            /* skip a graphic that fails to load/stamp */
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [stampReady, me, shared]);

  async function download(item: Rendered) {
    try {
      const file = new File([item.blob], item.name, { type: item.blob.type });
      const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await navigator.share({ files: [file] } as ShareData);
        return;
      }
    } catch {
      /* fall through to a download link */
    }
    const a = document.createElement("a");
    a.href = item.url;
    a.download = item.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <section className="sec">
      <div className="sec-h">
        <h2>Your graphics</h2>
        <span className="sub">Your code is already on every graphic — save it, then post.</span>
      </div>

      {withArt.length ? (
        withArt.map((g) => (
          <div className="sec" key={g.ev.id}>
            <div className="sec-h">
              <h3 style={{ fontSize: "1.4rem", display: "flex", gap: 9, alignItems: "center" }}>
                {logoBox(g.ev, 30)}
                {g.ev.name}
              </h3>
              <span className="sub">
                code {g.code} · reg closes {fmtDate(g.ev.regClose)}
              </span>
            </div>
            <div className="ggrid">
              {g.items.map((item) => {
                const key = `${item.id}::${g.code}`;
                const r = rendered[key];
                return (
                  <div className="gcard" key={key}>
                    <div className="frame">
                      {r ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.url} alt={`${item.title} with code ${g.code}`} />
                      ) : (
                        <span className="wait">Adding your code…</span>
                      )}
                    </div>
                    <div className="gm">
                      <div>
                        <div className="t">{item.title || item.kind}</div>
                        <div className="k">{item.kind}</div>
                      </div>
                      <button className="btn" disabled={!r} onClick={() => r && download(r)}>
                        {r ? "Save graphic" : "Preparing…"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      ) : (
        <div className="empty">No artwork is live yet for your upcoming tournaments. It appears here as each tournament launches.</div>
      )}

      {withoutArt.length > 0 && (
        <p className="sub">Artwork coming soon for: {withoutArt.map((g) => g.ev.name).join(", ")}.</p>
      )}
    </section>
  );
}
