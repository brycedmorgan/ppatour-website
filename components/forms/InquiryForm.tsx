"use client";

import { useRef, useState } from "react";
import { FORM_SCHEMAS, type FormField } from "@/lib/forms/schema";
import { Turnstile, turnstileEnabled } from "@/components/forms/Turnstile";

/**
 * Generic, schema-driven form. Renders the fields for `formType` from
 * FORM_SCHEMAS and posts to /api/form-submit, which routes the notification
 * email + records the submission to the master Google Sheet. Supports every
 * field type the ppatour.com Gravity Forms use: text/email/tel/number/date,
 * textarea, select, radio, checkbox groups, consent checkboxes, file uploads
 * (→ Vercel Blob via /api/form-upload), signatures, and conditional fields.
 */
type Value = string | string[];
type Values = Record<string, Value>;

const inputCls =
  "h-11 w-full border border-ppa-line bg-white px-3.5 text-base text-ppa-navy placeholder:text-ppa-navy/35 focus:border-ppa-blue focus:outline-none sm:text-sm";
const labelCls =
  "mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy/60";

/** A field is visible unless its showIf condition is unmet. */
function isVisible(field: FormField, values: Values): boolean {
  if (!field.showIf) return true;
  const v = values[field.showIf.field];
  if (Array.isArray(v)) return v.includes(field.showIf.value);
  return v === field.showIf.value;
}

function SignaturePad({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    canvasRef.current!.setPointerCapture(e.pointerId);
  }
  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = pos(e);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#101d33";
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  function end() {
    if (!drawing.current) return;
    drawing.current = false;
    onChange(canvasRef.current!.toDataURL("image/png"));
  }
  function clear() {
    const c = canvasRef.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    onChange("");
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={600}
        height={160}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        className="w-full touch-none border border-ppa-line bg-white"
        style={{ aspectRatio: "600 / 160" }}
      />
      <button type="button" onClick={clear} className="mt-1.5 text-xs text-ppa-blue hover:text-ppa-navy">
        Clear signature
      </button>
      {value ? <span className="ml-3 text-xs text-ppa-navy/40">Signed ✓</span> : null}
    </div>
  );
}

export function InquiryForm({ formType }: { formType: keyof typeof FORM_SCHEMAS }) {
  const schema = FORM_SCHEMAS[formType];
  const [values, setValues] = useState<Values>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileKey, setTurnstileKey] = useState(0);

  function setValue(name: string, v: Value) {
    setValues((prev) => ({ ...prev, [name]: v }));
  }

  function toggleGroup(name: string, option: string) {
    setValues((prev) => {
      const cur = Array.isArray(prev[name]) ? (prev[name] as string[]) : [];
      return { ...prev, [name]: cur.includes(option) ? cur.filter((o) => o !== option) : [...cur, option] };
    });
  }

  async function uploadFile(name: string, files: FileList | null, multiple?: boolean) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const res = await fetch(`/api/form-upload?filename=${encodeURIComponent(file.name)}`, {
          method: "POST",
          body: file,
        });
        if (!res.ok) throw new Error("upload failed");
        const { url } = await res.json();
        urls.push(url);
      }
      setValue(name, multiple ? urls : urls[0]);
    } catch {
      setErrorMsg("File upload failed — try a smaller file or a different format.");
    } finally {
      setUploading(false);
    }
  }

  function visibleFields() {
    return schema.fields.filter((f) => isVisible(f, values));
  }

  function validate(): string | null {
    for (const f of visibleFields()) {
      if (!f.required) continue;
      const v = values[f.name];
      const empty = v == null || (Array.isArray(v) ? v.length === 0 : String(v).trim() === "");
      if (empty) return `Please complete: ${f.label}`;
      if (f.type === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(v))) return `Please enter a valid ${f.label}`;
    }
    return null;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if ((e.currentTarget.elements.namedItem("website") as HTMLInputElement)?.value) return; // honeypot
    const err = validate();
    if (err) {
      setErrorMsg(err);
      setStatus("error");
      return;
    }
    if (turnstileEnabled() && !turnstileToken) {
      setErrorMsg("Please complete the anti-spam check.");
      setStatus("error");
      return;
    }
    setStatus("sending");
    setErrorMsg("");
    // Only send visible fields (hidden conditionals are omitted).
    const payload: Values = { formType, turnstileToken };
    for (const f of visibleFields()) if (values[f.name] != null) payload[f.name] = values[f.name];
    try {
      const res = await fetch("/api/form-submit/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || String(res.status));
      }
      setStatus("done");
      setValues({});
    } catch (err2) {
      setErrorMsg(err2 instanceof Error ? err2.message : "Something went wrong");
      setStatus("error");
      // Turnstile tokens are single-use — force a fresh one for the retry.
      setTurnstileToken("");
      setTurnstileKey((k) => k + 1);
    }
  }

  if (status === "done") {
    return (
      <div className="border border-ppa-line bg-white p-8 text-center sm:p-10">
        <p className="font-display text-2xl uppercase text-ppa-navy">{schema.successTitle}</p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ppa-navy/60">{schema.successBody}</p>
      </div>
    );
  }

  // A plain render function (NOT a nested component) so controlled inputs
  // don't remount and lose focus on every keystroke.
  function renderControl(f: FormField) {
    const id = `f-${f.name}`;
    const val = values[f.name];
    switch (f.type) {
      case "textarea":
        return (
          <textarea
            id={id}
            rows={4}
            maxLength={f.maxLength}
            placeholder={f.placeholder}
            value={(val as string) ?? ""}
            onChange={(e) => setValue(f.name, e.target.value)}
            className="w-full border border-ppa-line bg-white px-3.5 py-2.5 text-base text-ppa-navy placeholder:text-ppa-navy/35 focus:border-ppa-blue focus:outline-none sm:text-sm"
          />
        );
      case "select":
        return (
          <select id={id} value={(val as string) ?? ""} onChange={(e) => setValue(f.name, e.target.value)} className={inputCls}>
            <option value="" disabled>
              Select…
            </option>
            {f.options?.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        );
      case "radio":
        return (
          <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
            {f.options?.map((o) => (
              <label key={o} className="flex items-center gap-2 text-sm text-ppa-navy">
                <input type="radio" name={id} value={o} checked={val === o} onChange={() => setValue(f.name, o)} className="accent-ppa-blue" />
                {o}
              </label>
            ))}
          </div>
        );
      case "checkbox":
        return (
          <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
            {f.options?.map((o) => {
              const arr = Array.isArray(val) ? val : [];
              return (
                <label key={o} className="flex items-center gap-2 text-sm text-ppa-navy">
                  <input type="checkbox" checked={arr.includes(o)} onChange={() => toggleGroup(f.name, o)} className="accent-ppa-blue" />
                  {o}
                </label>
              );
            })}
          </div>
        );
      case "consent":
        return (
          <label className="flex items-start gap-2.5 text-sm leading-relaxed text-ppa-navy/80">
            <input
              type="checkbox"
              checked={val === "1"}
              onChange={(e) => setValue(f.name, e.target.checked ? "1" : "")}
              className="mt-1 accent-ppa-blue"
            />
            <span dangerouslySetInnerHTML={{ __html: f.consentText ?? f.label }} />
          </label>
        );
      case "file":
        return (
          <div>
            <input
              id={id}
              type="file"
              accept={f.accept}
              multiple={f.multiple}
              onChange={(e) => uploadFile(f.name, e.target.files, f.multiple)}
              className="block w-full text-sm text-ppa-navy file:mr-3 file:border file:border-ppa-line file:bg-ppa-paper file:px-3 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-wide"
            />
            {val ? <p className="mt-1.5 text-xs text-green-700">Uploaded ✓</p> : null}
          </div>
        );
      case "signature":
        return <SignaturePad value={(val as string) ?? ""} onChange={(v) => setValue(f.name, v)} />;
      case "number":
        return (
          <input
            id={id}
            type="number"
            min={f.min}
            placeholder={f.placeholder}
            value={(val as string) ?? ""}
            onChange={(e) => setValue(f.name, e.target.value)}
            className={inputCls}
          />
        );
      case "date":
        return (
          <input id={id} type="date" value={(val as string) ?? ""} onChange={(e) => setValue(f.name, e.target.value)} className={inputCls} />
        );
      default:
        return (
          <input
            id={id}
            type={f.type}
            maxLength={f.maxLength}
            placeholder={f.placeholder}
            value={(val as string) ?? ""}
            onChange={(e) => setValue(f.name, e.target.value)}
            className={inputCls}
          />
        );
    }
  }

  const grid = schema.compact ? "flex flex-col gap-3 sm:flex-row" : "grid gap-4 sm:grid-cols-2";

  return (
    <form onSubmit={onSubmit} className={grid}>
      {/* Honeypot */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      {visibleFields().map((f) =>
        schema.compact ? (
          <div key={f.name} className="flex-1">
            {renderControl(f)}
          </div>
        ) : (
          <div key={f.name} className={f.half ? "" : "sm:col-span-2"}>
            {f.type !== "consent" && (
              <label className={labelCls} htmlFor={`f-${f.name}`}>
                {f.label}
                {f.required ? " *" : ""}
              </label>
            )}
            {renderControl(f)}
            {f.help ? <p className="mt-1 text-xs text-ppa-navy/45">{f.help}</p> : null}
          </div>
        ),
      )}

      <div className={schema.compact ? "" : "sm:col-span-2"}>
        <Turnstile onToken={setTurnstileToken} resetKey={turnstileKey} />
        <button
          type="submit"
          disabled={status === "sending" || uploading}
          className="group mt-3 inline-flex h-12 w-full items-center justify-center gap-1.5 bg-ppa-blue px-8 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-ppa-blue-deep active:scale-[0.98] disabled:opacity-60 sm:w-auto"
        >
          {uploading ? "Uploading…" : status === "sending" ? "Sending…" : schema.submitLabel}
          <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-0.5">
            →
          </span>
        </button>
        {status === "error" && (
          <p className="mt-3 text-xs text-red-600">
            {errorMsg || "Something went wrong."} If this keeps happening, email{" "}
            <a href="mailto:info@ppatour.com" className="underline">
              info@ppatour.com
            </a>
            .
          </p>
        )}
      </div>
    </form>
  );
}
