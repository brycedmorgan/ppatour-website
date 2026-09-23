"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { Graphic, Stamp } from "@/components/ambassadors/types";

/** The full stamp.js surface (types.ts only declares a subset). */
type StampLibFull = {
  loadImage: (src: string) => Promise<HTMLImageElement>;
  drawStamp: (ctx: CanvasRenderingContext2D, img: HTMLImageElement, st: Stamp, vars: Record<string, string>) => void;
  ensureFont: (font: string) => Promise<void>;
  STAMP_FONTS: [string, string][];
};

const DEFAULT: Stamp = {
  x: 0.15,
  y: 0.7,
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

function srcFor(file: string): string {
  return file.startsWith("/") ? file : `/ambassadors/${file}`;
}

/**
 * Draw/place the code box for one graphic, right on the ambassador dashboard —
 * the same tool HQ has. Saves the stamp to the shared graphics store, so it
 * updates both dashboards. {CODE} in the text becomes each ambassador's code.
 */
export function StampEditor({
  graphic,
  sampleCode,
  onClose,
  onSaved,
}: {
  graphic: Graphic;
  sampleCode: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<[number, number] | null>(null);
  const [st, setSt] = useState<Stamp>({ ...DEFAULT, ...(graphic.stamp || {}) });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const lib = (): StampLibFull | null =>
    typeof window !== "undefined" ? ((window as unknown as { Stamp?: StampLibFull }).Stamp ?? null) : null;

  async function draw(s: Stamp) {
    const S = lib();
    const c = canvasRef.current;
    const img = imgRef.current;
    if (!S || !c || !img) return;
    await S.ensureFont(s.font);
    const ctx = c.getContext("2d");
    if (!ctx) return;
    S.drawStamp(ctx, img, s, { CODE: sampleCode || "YOURCODE", FIRST: "Alex", NAME: "Alex Sample" });
    const W = c.width;
    const H = c.height;
    ctx.save();
    ctx.setLineDash([Math.max(6, W / 120), Math.max(4, W / 180)]);
    ctx.lineWidth = Math.max(2, W / 400);
    ctx.strokeStyle = "#67B6CE";
    ctx.strokeRect(s.x * W, s.y * H, s.w * W, s.h * H);
    ctx.restore();
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const S = lib();
      if (!S) {
        setErr("Editor is still loading — close and try again.");
        return;
      }
      try {
        const img = await S.loadImage(srcFor(graphic.file));
        if (cancelled) return;
        imgRef.current = img;
        const c = canvasRef.current;
        if (c) {
          c.width = img.naturalWidth;
          c.height = img.naturalHeight;
        }
        draw(st);
      } catch {
        setErr("Couldn't load the image.");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pt(e: PointerEvent<HTMLCanvasElement>): [number, number] {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return [
      Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
    ];
  }

  function onDown(e: PointerEvent<HTMLCanvasElement>) {
    dragRef.current = pt(e);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function onMove(e: PointerEvent<HTMLCanvasElement>) {
    if (!dragRef.current) return;
    const [a, b] = dragRef.current;
    const [x2, y2] = pt(e);
    if (Math.abs(x2 - a) < 0.01 || Math.abs(y2 - b) < 0.01) return;
    const ns: Stamp = { ...st, x: Math.min(a, x2), y: Math.min(b, y2), w: Math.abs(x2 - a), h: Math.abs(y2 - b) };
    setSt(ns);
    void draw(ns);
  }
  function onUp() {
    dragRef.current = null;
  }

  function set<K extends keyof Stamp>(k: K, v: Stamp[K]) {
    const ns = { ...st, [k]: v };
    setSt(ns);
    void draw(ns);
  }

  async function save(remove: boolean) {
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/hq/graphics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "update", id: graphic.id, patch: { stamp: remove ? null : st } }),
      });
      if (!r.ok) throw new Error();
      onSaved();
    } catch {
      setBusy(false);
      setErr("Couldn't save. Try again.");
    }
  }

  const fonts = lib()?.STAMP_FONTS ?? [["Barlow Condensed|700", "Barlow Condensed"] as [string, string]];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(6,18,32,.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 60,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{ background: "#fff", color: "#0C2B44", borderRadius: 14, maxWidth: 560, width: "100%", maxHeight: "92vh", overflow: "auto", padding: 18 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0 }}>Code box</h3>
        <p style={{ marginTop: -4, fontSize: ".86rem", color: "#4a6076" }}>
          Drag on the image to draw where the code goes. Keep <b>{"{CODE}"}</b> in the text — it becomes each ambassador&apos;s own code.
        </p>
        <canvas
          ref={canvasRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          style={{ width: "100%", height: "auto", borderRadius: 8, touchAction: "none", cursor: "crosshair", background: "#eee" }}
        />
        <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
          <label style={{ display: "grid", gap: 4 }}>
            Text
            <textarea value={st.text} onChange={(e) => set("text", e.target.value)} rows={2} style={{ width: "100%", padding: 8 }} />
          </label>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <label>
              Font{" "}
              <select value={st.font} onChange={(e) => set("font", e.target.value)}>
                {fonts.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Align{" "}
              <select value={st.align} onChange={(e) => set("align", e.target.value)}>
                {["left", "center", "right"].map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
            <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
              Text color <input type="color" value={st.color} onChange={(e) => set("color", e.target.value)} />
            </label>
            <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input type="checkbox" checked={!!st.bg} onChange={(e) => set("bg", e.target.checked ? st.bg || "#0C2B44" : "")} /> Fill box
            </label>
            {st.bg ? <input type="color" value={st.bg} onChange={(e) => set("bg", e.target.value)} /> : null}
            <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input type="checkbox" checked={st.upper} onChange={(e) => set("upper", e.target.checked)} /> ALL CAPS
            </label>
          </div>
        </div>
        {err ? <p style={{ color: "#c0392b" }}>{err}</p> : null}
        <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end", flexWrap: "wrap" }}>
          {graphic.stamp ? (
            <button className="btn" style={{ background: "transparent", color: "#c0392b", border: "1px solid #c0392b" }} disabled={busy} onClick={() => save(true)}>
              Remove
            </button>
          ) : null}
          <button className="btn" style={{ background: "#e6ebf0", color: "#334" }} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn" disabled={busy} onClick={() => save(false)}>
            {busy ? "Saving…" : "Save code box"}
          </button>
        </div>
      </div>
    </div>
  );
}
