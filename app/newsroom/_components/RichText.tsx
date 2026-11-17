"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  RemoveFormatting,
} from "lucide-react";
import { uploadImage } from "./upload";

/**
 * The post body editor: a contentEditable surface with a small toolbar, plus a
 * raw-HTML view. No editor library: the formatting set is deliberately the one
 * lib/news-html.ts renders (headings, paragraphs, lists, quotes, links, images,
 * bold/italic), and everything is sanitized again on output.
 *
 * Paste is CLEANED on the way in. Copy from Google Docs or Word arrives as
 * nested spans with inline styles; that would be stripped on output anyway, but
 * it would sit in the stored HTML and make the HTML view unreadable.
 */

const KEEP = new Set([
  "P", "H2", "H3", "H4", "UL", "OL", "LI", "A", "STRONG", "B", "EM", "I",
  "BLOCKQUOTE", "BR", "IMG", "FIGURE", "FIGCAPTION",
]);

function cleanNode(node: Node, doc: Document): Node[] {
  if (node.nodeType === Node.TEXT_NODE) return [doc.createTextNode(node.textContent ?? "")];
  if (node.nodeType !== Node.ELEMENT_NODE) return [];
  const el = node as HTMLElement;
  const kids = () => [...el.childNodes].flatMap((c) => cleanNode(c, doc));
  // Google Docs wraps a whole paste in <b style="font-weight:normal">.
  const fakeBold = el.tagName === "B" && /font-weight:\s*normal/i.test(el.getAttribute("style") ?? "");
  if (!KEEP.has(el.tagName) || fakeBold) {
    if (el.tagName === "DIV") {
      const p = doc.createElement("p");
      kids().forEach((k) => p.appendChild(k));
      return p.textContent?.trim() ? [p] : [];
    }
    if (el.tagName === "H1") {
      const h = doc.createElement("h2");
      kids().forEach((k) => h.appendChild(k));
      return [h];
    }
    return kids();
  }
  const out = doc.createElement(
    el.tagName === "B" ? "strong" : el.tagName === "I" ? "em" : el.tagName.toLowerCase(),
  );
  if (el.tagName === "A") {
    const href = el.getAttribute("href") ?? "";
    if (/^(https?:|mailto:|\/)/i.test(href)) out.setAttribute("href", href);
  }
  if (el.tagName === "IMG") {
    const src = el.getAttribute("src") ?? "";
    if (!/^https:/i.test(src)) return [];
    out.setAttribute("src", src);
    out.setAttribute("alt", el.getAttribute("alt") ?? "");
    return [out];
  }
  kids().forEach((k) => out.appendChild(k));
  return [out];
}

export function cleanHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const wrap = doc.createElement("div");
  [...doc.body.childNodes].flatMap((n) => cleanNode(n, doc)).forEach((n) => wrap.appendChild(n));
  return wrap.innerHTML;
}

type ToolId =
  | "p" | "h2" | "h3" | "bold" | "italic" | "ul" | "ol" | "quote" | "link" | "image" | "clear";

const TOOLS: { id: ToolId; label: string; icon: typeof Bold }[] = [
  { id: "p", label: "Paragraph", icon: Pilcrow },
  { id: "h2", label: "Heading", icon: Heading2 },
  { id: "h3", label: "Subheading", icon: Heading3 },
  { id: "bold", label: "Bold", icon: Bold },
  { id: "italic", label: "Italic", icon: Italic },
  { id: "ul", label: "Bulleted list", icon: List },
  { id: "ol", label: "Numbered list", icon: ListOrdered },
  { id: "quote", label: "Quote", icon: Quote },
  { id: "link", label: "Link", icon: LinkIcon },
  { id: "image", label: "Image", icon: ImagePlus },
  { id: "clear", label: "Clear formatting", icon: RemoveFormatting },
];

export function RichText({
  value,
  onChange,
  version = 0,
}: {
  value: string;
  onChange: (html: string) => void;
  /** Bump to push a new `value` in from outside (e.g. an applied Reformat). */
  version?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"visual" | "html">("visual");
  const [uploading, setUploading] = useState(false);

  // Uncontrolled surface: write the value in when entering visual mode or when
  // the parent bumps `version`, never on each keystroke (keeps the caret).
  useEffect(() => {
    if (mode === "visual" && ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, version]);

  const emit = () => onChange(ref.current?.innerHTML ?? "");
  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    emit();
  };

  function runTool(id: ToolId) {
    switch (id) {
      case "p": return exec("formatBlock", "<p>");
      case "h2": return exec("formatBlock", "<h2>");
      case "h3": return exec("formatBlock", "<h3>");
      case "bold": return exec("bold");
      case "italic": return exec("italic");
      case "ul": return exec("insertUnorderedList");
      case "ol": return exec("insertOrderedList");
      case "quote": return exec("formatBlock", "<blockquote>");
      case "clear": return exec("removeFormat");
      case "image": return file.current?.click();
      case "link": {
        const url = window.prompt("Link to (https://… or /a-page-on-the-site/)");
        if (url === null) return;
        if (!url.trim()) return exec("unlink");
        if (!/^(https?:\/\/|\/|mailto:)/i.test(url.trim())) {
          window.alert("Links must start with https://, / or mailto:");
          return;
        }
        return exec("createLink", url.trim());
      }
    }
  }

  async function insertImage(f: File | undefined) {
    if (!f) return;
    setUploading(true);
    try {
      const url = await uploadImage(f);
      exec("insertImage", url);
    } catch (err) {
      window.alert((err as Error).message || "Upload failed.");
    } finally {
      setUploading(false);
      if (file.current) file.current.value = "";
    }
  }

  return (
    <div className="border border-ppa-line bg-white focus-within:border-ppa-blue">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-ppa-line bg-white p-1">
        {mode === "visual" &&
          TOOLS.map(({ id, label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              title={label}
              aria-label={label}
              // Keep the selection in the editor when a toolbar button is pressed.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => runTool(id)}
              className="p-1.5 text-ppa-navy/75 hover:bg-ppa-paper hover:text-ppa-navy"
            >
              <Icon className="size-4" aria-hidden />
            </button>
          ))}
        {uploading && <span className="px-2 text-xs text-ppa-navy/60">Uploading image…</span>}
        <button
          type="button"
          onClick={() => setMode(mode === "visual" ? "html" : "visual")}
          aria-pressed={mode === "html"}
          className="ml-auto inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-ppa-navy/70 hover:text-ppa-navy"
        >
          <Code className="size-4" aria-hidden />
          {mode === "visual" ? "HTML" : "Visual"}
        </button>
      </div>
      {mode === "visual" ? (
        <div
          ref={ref}
          role="textbox"
          aria-multiline="true"
          aria-label="Post body"
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Write the story…"
          onInput={emit}
          onBlur={emit}
          onPaste={(e) => {
            const html = e.clipboardData.getData("text/html");
            if (!html) return; // plain text pastes fine as-is
            e.preventDefault();
            document.execCommand("insertHTML", false, cleanHtml(html));
            emit();
          }}
          className="nr-prose min-h-[420px] p-4"
        />
      ) : (
        <textarea
          aria-label="Post body HTML"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className="block min-h-[420px] w-full p-4 font-mono text-xs leading-relaxed focus:outline-none"
        />
      )}
      <input
        ref={file}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void insertImage(e.target.files?.[0])}
      />
    </div>
  );
}
