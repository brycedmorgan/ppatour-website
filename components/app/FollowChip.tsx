"use client";

import { Check, Plus } from "lucide-react";
import { useFollows } from "@/components/app/follows";
import { syncSubscription } from "@/components/app/push";
import { useAppMode } from "@/components/app/use-app-mode";

/**
 * The small follow toggle for LIST surfaces — the roster grid, the standings
 * rows, the "More Pros" cards. Bryce, 8/18: "I should be able to click follow
 * on a player without clicking into their profile."
 *
 * ⚠ EVERY LIST ITEM HERE IS ITSELF A LINK, so the chip must swallow the click.
 * Without `preventDefault` + `stopPropagation` a tap follows the pro AND
 * navigates away from the list, which reads as the app losing your place every
 * time you add someone.
 *
 * App-mode only, same as the full button on the profile: on the website a
 * follow buys nothing, because iOS delivers web push to installed apps only.
 */
export function FollowChip({
  slug,
  name,
  className = "",
}: {
  slug: string;
  name: string;
  className?: string;
}) {
  const isApp = useAppMode();
  const { toggle, isFollowing } = useFollows();
  if (!isApp) return null;

  const following = isFollowing(slug);
  const Icon = following ? Check : Plus;

  return (
    <button
      type="button"
      aria-label={following ? `Unfollow ${name}` : `Follow ${name}`}
      aria-pressed={following}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle({ slug, name });
        void syncSubscription();
      }}
      className={`flex size-8 items-center justify-center rounded-full shadow-sm transition active:scale-90 ${
        following
          ? "bg-ppa-yellow text-ppa-navy"
          : "bg-ppa-navy/80 text-white backdrop-blur-sm hover:bg-ppa-navy"
      } ${className}`}
    >
      <Icon className="size-4" strokeWidth={2.5} aria-hidden />
    </button>
  );
}
