import Link from "next/link";
import { Newspaper } from "lucide-react";
import type { DashboardPost } from "@/lib/newsroom/store";
import { NEWSROOM_PATH } from "@/lib/newsroom/session";

export function fmtDate(iso: string, withTime = false): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });
}

export function StatusBadge({ status }: { status: DashboardPost["status"] }) {
  return status === "published" ? (
    <span className="bg-ppa-blue px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
      Live
    </span>
  ) : (
    <span className="bg-ppa-yellow px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ppa-navy">
      Draft
    </span>
  );
}

export function PostCard({ post }: { post: DashboardPost }) {
  const img = post.cardImage || post.image;
  return (
    <article className="group relative flex flex-col border border-ppa-line bg-white transition-shadow hover:shadow-md">
      <div className="relative aspect-[16/9] overflow-hidden bg-ppa-navy">
        {img ? (
          // Dashboard thumbnails: plain <img>, no optimiser round trip for a
          // freshly uploaded file.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center text-white/40">
            <Newspaper className="size-8" aria-hidden />
          </span>
        )}
        <span className="absolute left-2 top-2">
          <StatusBadge status={post.status} />
        </span>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-blue">
          {post.category || "No category"}
        </p>
        <h3 className="mt-1 line-clamp-2 font-semibold leading-snug">
          <Link
            href={`${NEWSROOM_PATH}/posts/${post.id}/`}
            className="after:absolute after:inset-0 group-hover:text-ppa-blue"
          >
            {post.title || "Untitled post"}
          </Link>
        </h3>
        <p className="mt-auto pt-2 text-xs text-ppa-navy/55">
          {fmtDate(post.publishedAt)} · {post.author || "PPA Tour"}
        </p>
      </div>
    </article>
  );
}
