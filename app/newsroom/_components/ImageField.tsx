"use client";

import { useId, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { uploadImage } from "./upload";

/** An image URL with upload, paste-a-URL and remove. */
export function ImageField({
  label,
  help,
  value,
  onChange,
  position,
}: {
  label: string;
  help?: string;
  value: string;
  onChange: (url: string) => void;
  /** Shown as the preview's object-position, so editors see the hero crop. */
  position?: string;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await uploadImage(file));
    } catch (err) {
      setError((err as Error).message || "Upload failed.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      {value ? (
        <div className="relative mt-1 aspect-[16/9] overflow-hidden border border-ppa-line bg-ppa-navy">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt=""
            className="size-full object-cover"
            style={position ? { objectPosition: position } : undefined}
          />
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label={`Remove ${label.toLowerCase()}`}
            className="absolute right-1.5 top-1.5 bg-white/90 p-1 text-ppa-navy hover:bg-white"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void onFile(e.dataTransfer.files[0]);
          }}
          disabled={busy}
          className="mt-1 flex aspect-[16/9] w-full flex-col items-center justify-center gap-1 border-2 border-dashed border-ppa-line bg-white text-sm text-ppa-navy/60 hover:border-ppa-blue hover:text-ppa-blue"
        >
          <ImagePlus className="size-6" aria-hidden />
          {busy ? "Uploading…" : "Upload or drop an image"}
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      <div className="mt-1 flex gap-2">
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="…or paste an image URL"
          className="min-w-0 flex-1 border border-ppa-line px-2 py-1 text-xs focus:border-ppa-blue focus:outline-none"
        />
        {value && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy}
            className="border border-ppa-line px-2 text-xs font-semibold hover:border-ppa-blue"
          >
            {busy ? "Uploading…" : "Replace"}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs font-semibold text-red-700">{error}</p>}
      {help && <p className="mt-1 text-xs text-ppa-navy/55">{help}</p>}
    </div>
  );
}
