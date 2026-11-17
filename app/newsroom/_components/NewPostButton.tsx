"use client";

import { useRef, useState, useTransition } from "react";
import { upload } from "@vercel/blob/client";
import { FileText, Plus, X } from "lucide-react";
import { createPost, createPostFromDoc } from "../actions";

/**
 * New post: blank, or started from a Google Doc (a link, or the doc downloaded
 * as Word). The doc path fills a draft for the editor to check.
 */
export function NewPostButton() {
  const dialog = useRef<HTMLDialogElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const busy = pending || step !== null;

  function fromDoc() {
    setError(null);
    start(async () => {
      try {
        let res;
        if (file) {
          setStep("Uploading the Word file…");
          const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+/, "");
          const blob = await upload(`newsroom/doc-uploads/${safe || "doc.docx"}`, file, {
            access: "public",
            handleUploadUrl: "/api/newsroom/upload/",
            contentType: file.type || "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          });
          setStep("Reading the doc and filling in the post. This can take up to a minute…");
          res = await createPostFromDoc({ upload: { blobUrl: blob.url, name: file.name } });
        } else {
          setStep("Reading the doc and filling in the post. This can take up to a minute…");
          res = await createPostFromDoc({ url });
        }
        // Success redirects to the new draft, so a result here is an error.
        if (res?.error) setError(res.error);
      } catch (err) {
        setError((err as Error).message || "Something went wrong. Try again.");
      } finally {
        setStep(null);
      }
    });
  }

  const ready = Boolean(file) || /^https:\/\/docs\.google\.com\/document\//.test(url.trim());

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="inline-flex items-center gap-2 bg-ppa-blue px-4 py-2.5 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-ppa-blue-deep"
      >
        <Plus className="size-4" aria-hidden />
        New post
      </button>

      <dialog
        ref={dialog}
        aria-labelledby="nr-new-title"
        onCancel={(e) => busy && e.preventDefault()}
        className="m-auto w-[min(32rem,calc(100vw-2rem))] border border-ppa-line bg-white p-0 text-ppa-navy backdrop:bg-ppa-navy/60"
      >
        <div className="flex items-center justify-between border-b border-ppa-line px-5 py-3">
          <h2 id="nr-new-title" className="font-display text-lg uppercase">
            New post
          </h2>
          <button
            type="button"
            aria-label="Close"
            disabled={busy}
            onClick={() => dialog.current?.close()}
            className="p-1 hover:text-ppa-blue disabled:opacity-40"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 font-semibold">
              <FileText className="size-4 text-ppa-blue" aria-hidden /> Start from a Google Doc
            </h3>
            <p className="text-sm text-ppa-navy/70">
              We&apos;ll read the doc and fill in the headline, summary, byline, category, photo and
              body. You check it before publishing; nothing goes live on its own.
            </p>
            <label className="block">
              <span className="text-sm font-semibold">Google Docs link</span>
              <input
                type="url"
                value={url}
                disabled={busy || Boolean(file)}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://docs.google.com/document/d/…"
                className="mt-1 w-full border border-ppa-line px-3 py-2 text-sm focus:border-ppa-blue focus:outline-none disabled:bg-ppa-paper"
              />
              <span className="mt-1 block text-xs text-ppa-navy/55">
                The doc must be shared as “Anyone with the link can view”.
              </span>
            </label>
            <div className="text-center text-xs uppercase tracking-[0.14em] text-ppa-navy/45">or</div>
            <div>
              <span className="text-sm font-semibold">Upload the doc as a Word file</span>
              <span className="block text-xs text-ppa-navy/55">
                For private docs: in Google Docs, File → Download → Microsoft Word (.docx).
              </span>
              <div className="mt-1 flex items-center gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => fileInput.current?.click()}
                  className="border border-ppa-navy px-3 py-1.5 text-sm font-semibold hover:bg-ppa-paper disabled:opacity-50"
                >
                  Choose .docx
                </button>
                {file && (
                  <span className="flex min-w-0 items-center gap-1 text-sm">
                    <span className="truncate">{file.name}</span>
                    <button
                      type="button"
                      aria-label="Remove file"
                      disabled={busy}
                      onClick={() => setFile(null)}
                      className="p-0.5 hover:text-red-700"
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </span>
                )}
              </div>
              <input
                ref={fileInput}
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  if (f && !/\.docx$/i.test(f.name)) {
                    setError("Choose a .docx file (Word). Google Docs: File → Download → Microsoft Word.");
                  } else {
                    setError(null);
                    setFile(f);
                    if (f) setUrl("");
                  }
                  e.target.value = "";
                }}
              />
            </div>
            {error && (
              <p role="alert" className="text-sm font-semibold text-red-700">
                {error}
              </p>
            )}
            {step && (
              <p role="status" className="text-sm text-ppa-blue">
                {step}
              </p>
            )}
            <button
              type="button"
              disabled={!ready || busy}
              onClick={fromDoc}
              className="w-full bg-ppa-blue px-4 py-2.5 text-sm font-bold uppercase tracking-[0.1em] text-white hover:bg-ppa-blue-deep disabled:opacity-50"
            >
              {busy ? "Working…" : "Create draft from doc"}
            </button>
          </section>

          <div className="border-t border-ppa-line pt-4">
            <button
              type="button"
              disabled={busy}
              onClick={() => start(() => createPost())}
              className="w-full border border-ppa-navy px-4 py-2 text-sm font-bold uppercase tracking-[0.1em] hover:bg-ppa-paper disabled:opacity-50"
            >
              Start a blank post
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
