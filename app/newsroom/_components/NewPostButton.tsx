"use client";

import { useTransition } from "react";
import { Plus } from "lucide-react";
import { createPost } from "../actions";

export function NewPostButton() {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      onClick={() => start(() => createPost())}
      disabled={pending}
      className="inline-flex items-center gap-2 bg-ppa-blue px-4 py-2.5 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-ppa-blue-deep disabled:opacity-60"
    >
      <Plus className="size-4" aria-hidden />
      {pending ? "Creating…" : "New post"}
    </button>
  );
}
