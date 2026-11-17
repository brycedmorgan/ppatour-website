"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importCodePosts } from "../actions";

export function ImportButton({ count }: { count: number }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await importCodePosts();
            setMessage(
              res.error
                ? `Import failed: ${res.error}`
                : `Imported ${res.imported} post${res.imported === 1 ? "" : "s"}. They are live exactly as before, and now editable here.`,
            );
            router.refresh();
          })
        }
        className="bg-ppa-navy px-4 py-2 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-ppa-navy-deep disabled:opacity-60"
      >
        {pending ? "Importing…" : `Import ${count} hand-written post${count === 1 ? "" : "s"}`}
      </button>
      {message && (
        <p role="status" className="mt-2 text-sm text-ppa-navy/75">
          {message}
        </p>
      )}
    </div>
  );
}
