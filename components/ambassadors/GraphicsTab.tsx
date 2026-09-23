"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
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

// Vertical position presets for a freshly-uploaded code box (as a fraction of
// image height). Fine positioning is done in HQ's drag editor.
const CODE_POS: Record<string, number> = { top: 0.06, middle: 0.44, bottom: 0.8 };

export function GraphicsTab({ me, shared, canUpload = false }: { me: Me; shared: Shared; canUpload?: boolean }) {
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
    // iOS Safari can't download a blob to the Files/Photos app, so there the
    // share sheet is the only way to save. Everywhere else (desktop, Android)
    // do a real file download rather than opening a share dialog.
    const ua = navigator.userAgent || "";
    const isIOS = /iP(hone|ad|od)/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (isIOS) {
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
    }
    const a = document.createElement("a");
    a.href = item.url;
    a.download = item.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function remove(item: Graphic) {
    if (!confirm(`Remove "${item.title || item.kind}" for everyone?`)) return;
    const assetId = item.file.replace("/_blob/", "").replace(/\/$/, "");
    try {
      await fetch(`/api/hq/assets?id=${encodeURIComponent(assetId)}`, { method: "DELETE" });
      const r = await fetch("/api/hq/graphics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "delete", id: item.id }),
      });
      if (!r.ok) throw new Error();
      window.location.reload();
    } catch {
      alert("Couldn't remove that graphic. Try again.");
    }
  }

  return (
    <section className="sec">
      <div className="sec-h">
        <h2>Your graphics</h2>
        <span className="sub">Your code is already on every graphic — save it, then post.</span>
      </div>

      {canUpload && <Uploader events={shared.events} />}

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
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {canUpload && (
                          <button
                            className="btn"
                            style={{ background: "transparent", color: "#c0392b", border: "1px solid #c0392b", padding: "6px 10px" }}
                            onClick={() => remove(item)}
                            title="Remove for everyone"
                          >
                            Delete
                          </button>
                        )}
                        <button className="btn" disabled={!r} onClick={() => r && download(r)}>
                          {r ? "Download" : "Preparing…"}
                        </button>
                      </div>
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

/** Team-only upload panel (shown when the shared editor cookie is present). */
function Uploader({ events }: { events: Ev[] }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [event, setEvent] = useState<string>(events[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [pos, setPos] = useState("bottom");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    const f = fileRef.current?.files?.[0];
    if (!f) return setMsg("Choose an image first.");
    if (!f.type || !/^image\/(png|jpeg|webp|gif)$/.test(f.type)) return setMsg("Use a PNG, JPG, WebP or GIF.");
    if (f.size > 4_000_000) return setMsg("That file is over ~4 MB — save it as WebP or JPG and try again.");
    if (!event) return setMsg("Pick a tournament.");
    setBusy(true);
    setMsg("Uploading…");
    try {
      const up = await fetch("/api/hq/assets", { method: "POST", headers: { "Content-Type": f.type }, body: f });
      const a = await up.json();
      if (!up.ok) throw new Error(a.error || "upload failed");
      const stamp = {
        x: 0.15,
        y: CODE_POS[pos] ?? 0.8,
        w: 0.7,
        h: 0.12,
        text: "USE CODE {CODE}",
        font: "Barlow Condensed|700",
        color: "#FFFFFF",
        bg: "#0C2B44",
        radius: 0.15,
        align: "center",
        upper: true,
      };
      const doc = {
        event,
        kind: "Graphic",
        title: title.trim(),
        fileName: f.name,
        assetId: a.id,
        contentType: a.contentType,
        sizeBytes: a.sizeBytes,
        stamp,
        at: new Date().toISOString(),
      };
      const cr = await fetch("/api/hq/graphics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "add", doc }),
      });
      if (!cr.ok) throw new Error("save failed");
      const evName = events.find((x) => x.id === event)?.name ?? "that tournament";
      setMsg(`Added! It's live for ambassadors promoting ${evName}. Reloading…`);
      setTimeout(() => window.location.reload(), 900);
    } catch (err) {
      setBusy(false);
      setMsg(err instanceof Error ? err.message : "Something went wrong. Try again.");
    }
  }

  return (
    <div className="sec" style={{ border: "1px dashed #9db3c9", borderRadius: 12, padding: 14, marginBottom: 18 }}>
      <div className="sec-h">
        <h3 style={{ fontSize: "1.15rem" }}>
          Add a graphic <span className="sub">· PPA team edit mode</span>
        </h3>
      </div>
      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <select value={event} onChange={(e) => setEvent(e.target.value)} aria-label="Tournament">
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name}
              </option>
            ))}
          </select>
          <select value={pos} onChange={(e) => setPos(e.target.value)} aria-label="Code position">
            <option value="top">Code near top</option>
            <option value="middle">Code in middle</option>
            <option value="bottom">Code near bottom</option>
          </select>
          <input placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Working…" : "Upload graphic"}
          </button>
          {msg && <span className="sub">{msg}</span>}
        </div>
        <span className="sub">
          The code auto-stamps as each ambassador&apos;s own code. Fine-tune the exact spot in HQ → Edit code box. Max ~4 MB (WebP or JPG).
        </span>
      </form>
    </div>
  );
}
